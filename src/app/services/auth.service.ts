import {Injectable, OnDestroy, inject} from '@angular/core';
import {Router} from "@angular/router";
import {BehaviorSubject, from, Subject} from "rxjs";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
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
  sessionExpiryWarning$ = new BehaviorSubject<boolean>(false);
  
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private authStateUnsubscribe: (() => void) | null = null;
  private activityMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivityTime: number = Date.now();
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private warningShown = false;
  
  // Inactivity timeouts (30 minutes before warning, 60 seconds warning)
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_TIMEOUT = 60 * 1000; // 60 seconds

  constructor(private auth: AngularFireAuth, private router: Router, private cookieService: CookieService) {
    this.initializeAuthStateMonitor();
    this.setupActivityMonitoring();
    this.startInactivityMonitoring();
  }

  private getInitialUserState(): UserInfo | null {
    try {
      const userData = this.cookieService.get('userData');
      if (!userData) return null;
      
      // Check if session has expired
      const sessionExpiration = localStorage.getItem('sessionExpiration');
      if (sessionExpiration) {
        const expirationTime = parseInt(sessionExpiration, 10);
        if (Date.now() > expirationTime) {
          // Session expired, clear everything
          this.cookieService.delete('userData');
          this.cookieService.delete('adminState');
          localStorage.removeItem('sessionExpiration');
          return null;
        }
      }
      
      return JSON.parse(userData);
    } catch {
      this.cookieService.delete('userData');
      this.cookieService.delete('adminState');
      localStorage.removeItem('sessionExpiration');
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
        .subscribe(_result => {
                     this.handleLogin()
                   }, err => {
                     this.handleError(err)
                   }
        );
    })
  }

  async logOut() {
    // Clear login state immediately
    this.loginChanged.next(null)
    this.cookieService.delete('userData')
    this.cookieService.delete('adminState')
    localStorage.removeItem('sessionExpiration');
    this.clearSessionMonitoring();
    this.clearInactivityTimers();
    this.sessionExpiryWarning$.next(false);
    
    // End any active progress tracking session
    await this.endProgressTrackingSession();
    
    // Clear all application state
    this.clearApplicationState();
    
    // Sign out from Firebase
    signOut(this.auth).then(() => {
      // Ensure we're on login page after logout
      if (this.router.url !== '/login') {
        this.router.navigate(['/login']);
      }
    });
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
        this.resetInactivityTimer();
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
    // Clear login state immediately to hide navigation
    this.loginChanged.next(null);
    this.cookieService.delete('userData');
    this.cookieService.delete('adminState');
    localStorage.removeItem('sessionExpiration');
    
    // Save current test/quiz state before redirecting
    const currentUrl = this.router.url;
    if (currentUrl !== '/login' && (currentUrl.includes('/home') || currentUrl.includes('/test'))) {
      // Store the current URL to return to after re-authentication
      localStorage.setItem('returnUrl', currentUrl);
      
      // NOTE: We don't clear application state here to allow users
      // to continue where they left off after re-authentication
    }
    
    // Navigate to login page
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
        this.resetInactivityTimer();
      });
    });
  }

  /**
   * Start inactivity monitoring for auth session
   */
  private startInactivityMonitoring(): void {
    if (this.loginChanged.value) {
      this.resetInactivityTimer();
    }
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    // Clear existing timers
    this.clearInactivityTimers();
    
    // Only set timer if user is logged in
    if (!this.loginChanged.value) return;
    
    // Set 30-minute inactivity timer
    this.inactivityTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Show inactivity warning modal
   */
  private showInactivityWarning(): void {
    this.warningShown = true;
    this.sessionExpiryWarning$.next(true);
    
    // Set 60-second warning timer
    this.warningTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.WARNING_TIMEOUT);
  }

  /**
   * Handle inactivity timeout (auto-logout)
   */
  private handleInactivityTimeout(): void {
    this.sessionExpiryWarning$.next(false);
    this.warningShown = false;
    // Clear auth state and redirect
    this.handleSessionExpired();
  }

  /**
   * Extend auth session when user responds to warning
   */
  extendAuthSession(): void {
    this.sessionExpiryWarning$.next(false);
    this.warningShown = false;
    this.clearInactivityTimers();
    this.refreshSession();
    this.resetInactivityTimer();
  }

  /**
   * Clear all inactivity timers
   */
  private clearInactivityTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * End any active progress tracking session
   */
  private async endProgressTrackingSession(): Promise<void> {
    // Clear progress tracking session state directly
    // This ensures the session is discarded on logout
    localStorage.removeItem('progressSessionState');
    localStorage.removeItem('progressTrackingEnabled');
    localStorage.removeItem('progressTrackingUserId');
    localStorage.removeItem('activeProgressSession');
    
    // Note: We clear the session state here instead of calling ProgressService
    // to avoid circular dependencies and ensure clean logout
  }

  /**
   * Clear all application state stored in localStorage
   */
  private clearApplicationState(): void {
    // Clear test service state
    localStorage.removeItem('testServiceState');
    localStorage.removeItem('answeredQuestions');
    localStorage.removeItem('customExamConfiguration');
    
    // Clear home component active section
    localStorage.removeItem('homeActiveSection');
    
    // Clear any return URL
    localStorage.removeItem('returnUrl');
  }

  ngOnDestroy(): void {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }
    this.clearSessionMonitoring();
    this.clearInactivityTimers();
  }
}
