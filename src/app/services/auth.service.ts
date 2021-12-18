import {Injectable} from '@angular/core';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {Router} from "@angular/router";
import {from, Subject} from "rxjs";
import {getAuth} from "firebase/auth";
import firebase from "firebase/compat";
import UserInfo = firebase.UserInfo;

@Injectable({
              providedIn: 'root'
            })
export class AuthService {
  loginChanged = new Subject<UserInfo | null>()

  constructor(private afAuth: AngularFireAuth, private router: Router) {
  }

  login(email: string, password: string) {
    const loginObservable = from(this.afAuth.signInWithEmailAndPassword(email, password))
    loginObservable.subscribe(
      value => {
        const user = getAuth().currentUser
        if (user !== null) {
          console.log('success login :', user)
          this.loginChanged.next(user)
        }
        this.router.navigate(['/home']).then()
      },
      err => {
        console.log('Error')
      })
  }

  logOut() {
    this.afAuth.signOut().then()
    this.loginChanged.next(null)
  }

  signUp(email: string, password: string, username: string) {
    this.afAuth.createUserWithEmailAndPassword(email, password).then(
      user => {
        console.log(user)
        user.user?.updateProfile({
                                   displayName: username
                                 })
        this.router.navigate(['/home']).then()
      }
    ).catch(error => {
      console.log(error)
    })
  }
}
