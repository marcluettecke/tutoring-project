import {Injectable} from '@angular/core';
import {Router} from "@angular/router";
import {BehaviorSubject, from, Subject} from "rxjs";
import {
  Auth,
  browserSessionPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  User,
  AuthError
} from "firebase/auth";
import {Auth as AngularFireAuth} from '@angular/fire/auth';
import {CookieService} from "ngx-cookie-service";
import {UserInfo} from "../models/User.model";

@Injectable({
              providedIn: 'root'
            })
export class AuthService {
  loginChanged = new BehaviorSubject<UserInfo | null>(this.cookieService.get('userData') ? JSON.parse(this.cookieService.get('userData')) : null)
  errorStatusChanged = new Subject<AuthError>()

  constructor(private auth: AngularFireAuth, private router: Router, private cookieService: CookieService) {
  }

  handleLogin() {
    const user = this.auth.currentUser
    if (user !== null) {
      // cookie
      const expirationTime = (new Date())
      expirationTime.setHours(expirationTime.getHours() + 1)
      this.cookieService.set('userData', JSON.stringify(user), {expires: expirationTime})

      this.loginChanged.next(user)
    }
    this.router.navigate(['/home']).then()
  }

  handleError(error: AuthError) {
    this.errorStatusChanged.next(error)
  }

  googleLogin() {
    setPersistence(this.auth, browserSessionPersistence).then(() => {
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
  }
}
