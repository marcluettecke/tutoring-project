import {Injectable, OnDestroy} from '@angular/core';
import {Router} from "@angular/router";
import {BehaviorSubject, from, Subject} from "rxjs";
import {
  Auth,
  browserLocalPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  User,
  AuthError,
  onAuthStateChanged
} from "firebase/auth";
import {Auth as AngularFireAuth} from '@angular/fire/auth';
import {CookieService} from "ngx-cookie-service";
import {UserInfo} from "../models/User.model";

@Injectable({
              providedIn: 'root'
            })
export class AuthService implements OnDestroy {
  loginChanged = new BehaviorSubject<UserInfo | null>(this.getInitialUserState())
  errorStatusChanged = new Subject<AuthError>()
  
  private sessionCheckInterval: any = null;
  private authStateUnsubscribe: any = null;
  private activityMonitorInterval: any = null;
  private lastActivityTime: number = Date.now();

  constructor(private auth: AngularFireAuth, private router: Router, private cookieService: CookieService) {
    this.initializeAuthStateMonitor();
    this.setupActivityMonitoring();
  }

  private getInitialUserState(): UserInfo | null {
    try {
      const userData = this.cookieService.get('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      this.cookieService.delete('userData');
      return null;
    }
  }

  handleLogin() {
    const user = this.auth.currentUser
    if (user !== null) {
      // cookie - Set to 8 hours for a full school/work day
      const expirationTime = (new Date())
      expirationTime.setHours(expirationTime.getHours() + 8)
      this.cookieService.set('userData', JSON.stringify(user), {expires: expirationTime})
      
      // Store expiration time for session monitoring
      localStorage.setItem('sessionExpiration', expirationTime.getTime().toString())

      this.loginChanged.next(user)
      
      // Check if we should return to a previous URL after re-authentication
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        this.router.navigate([returnUrl]).then();
      } else {
        this.router.navigate(['/home']).then();
      }
    } else {
      this.router.navigate(['/home']).then()
    }
  }

  handleError(error: AuthError) {
    this.errorStatusChanged.next(error)
  }

  googleLogin() {
    setPersistence(this.auth, browserLocalPersistence).then(() => {
      const provider = new GoogleAuthProvider();
      const googleLoginObservable = from(signInWithPopup(this.auth, provider))
      googleLoginObservable
        .subscribe(_ => {
                     this.handleLogin()
                   }, err => {
                     this.handleError(err)
                   }
        );
    })
  }

  logOut() {
    signOut(this.auth).then()
    this.loginChanged.next(null)
    this.cookieService.delete('userData')
    this.cookieService.delete('adminState')
    this.clearSessionMonitoring();
  }

  /**
   * Initialize Firebase auth state monitoring to handle session expiration
   */
  private initializeAuthStateMonitor(): void {
    this.authStateUnsubscribe = onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // User is signed in, update login state if needed
        const currentUser = this.loginChanged.value;
        if (!currentUser || currentUser.uid !== user.uid) {
          // Only re-establish session if we're on the login page
          if (this.router.url === '/login') {
            this.handleLogin();
          }
        }
        this.startSessionMonitoring();
      } else {
        // User is signed out
        if (this.loginChanged.value) {
          // Session expired - save current state before redirecting
          this.handleSessionExpired();
        }
      }
    });
  }

  /**
   * Start monitoring session expiration
   */
  private startSessionMonitoring(): void {
    this.clearSessionMonitoring();
    
    // Check session status every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      const cookieExpiration = this.getCookieExpiration();
      if (cookieExpiration) {
        const hoursRemaining = (cookieExpiration - Date.now()) / (1000 * 60 * 60);
        
        // Auto-refresh if less than 1 hour remaining and user is active
        if (hoursRemaining <= 1 && hoursRemaining > 0) {
          const timeSinceLastActivity = Date.now() - this.lastActivityTime;
          const fifteenMinutes = 15 * 60 * 1000;
          
          // Only refresh if user has been active in the last 15 minutes
          if (timeSinceLastActivity < fifteenMinutes) {
            this.refreshSession();
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clear session monitoring
   */
  private clearSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Get cookie expiration time
   */
  private getCookieExpiration(): number | null {
    // Since we can't directly get cookie expiration, we'll store it separately
    const expirationStr = localStorage.getItem('sessionExpiration');
    return expirationStr ? parseInt(expirationStr, 10) : null;
  }

  /**
   * Refresh the session by extending the cookie
   */
  private refreshSession(): void {
    const user = this.auth.currentUser;
    if (user) {
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 8); // Extend for another 8 hours
      this.cookieService.set('userData', JSON.stringify(user), {expires: expirationTime});
      localStorage.setItem('sessionExpiration', expirationTime.getTime().toString());
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired(): void {
    // Save current test/quiz state before redirecting
    const currentUrl = this.router.url;
    if (currentUrl.includes('/home') || currentUrl.includes('/test')) {
      // Store the current URL to return to after re-authentication
      localStorage.setItem('returnUrl', currentUrl);
      
      // TODO: Save current test state to localStorage
      // This would require coordination with TestService
    }
    
    this.loginChanged.next(null);
    this.cookieService.delete('userData');
    this.cookieService.delete('adminState');
    this.router.navigate(['/login']);
  }

  /**
   * Clean up auth state monitor on service destruction
   */
  /**
   * Setup activity monitoring to track user interactions
   */
  private setupActivityMonitoring(): void {
    // Update activity time on user interactions
    ['click', 'keypress', 'mousemove', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }
    this.clearSessionMonitoring();
  }
}
