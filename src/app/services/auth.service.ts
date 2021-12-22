import {Injectable} from '@angular/core';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {Router} from "@angular/router";
import {BehaviorSubject, from, Subject} from "rxjs";
import {browserSessionPersistence, getAuth, setPersistence} from "firebase/auth";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {CookieService} from "ngx-cookie-service";
import {UserInfo} from "../models/User.model";
import Error = firebase.auth.Error;

@Injectable({
              providedIn: 'root'
            })
export class AuthService {
  loginChanged = new BehaviorSubject<UserInfo | null>(this.cookieService.get('userData') ? JSON.parse(this.cookieService.get('userData')) : null)
  errorStatusChanged = new Subject<Error>()

  constructor(private afAuth: AngularFireAuth, private router: Router, private cookieService: CookieService) {
  }

  handleLogin() {
    const user = getAuth().currentUser
    if (user !== null) {
      // cookie
      const expirationTime = (new Date())
      expirationTime.setHours(expirationTime.getHours() + 1)
      this.cookieService.set('userData', JSON.stringify(user), {expires: expirationTime})

      console.log('success login :', user)
      this.loginChanged.next(user)
    }
    this.router.navigate(['/home']).then()
  }

  handleError(error: Error) {
    this.errorStatusChanged.next(error)
  }

  googleLogin() {
    const auth = getAuth();
    setPersistence(auth, browserSessionPersistence).then(() => {
      const provider = new firebase.auth.GoogleAuthProvider();
      const googleLoginObservable = from(this.oAuthLogin(provider))
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
    this.afAuth.signOut().then()
    this.loginChanged.next(null)
    this.cookieService.delete('userData')
    this.cookieService.delete('adminState')
  }

  private oAuthLogin(provider: firebase.auth.GoogleAuthProvider) {
    return this.afAuth.signInWithPopup(provider);
  }
}
