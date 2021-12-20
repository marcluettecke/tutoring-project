import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/compat/firestore";
import {Account} from "../models/User.model";
import {BehaviorSubject, Observable} from "rxjs";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "./auth.service";
import {getAuth} from "firebase/auth";

@Injectable({
              providedIn: 'root'
            })
export class AccountsService {
  isAdmin = new BehaviorSubject<boolean>(this.cookieService.get('adminState') === 'true')

  constructor(private firestore: AngularFirestore, private cookieService: CookieService, private authService: AuthService) {
    this.authService.loginChanged
      .subscribe(loggedIn => {
        if (loggedIn) {
          const user = getAuth().currentUser
          this.checkIfAdmin(user?.email as string)
        }
      })
  }


  getAccounts(email: string): Observable<Account[]> {
    const accountsRef: AngularFirestoreCollection<Account> = this.firestore
      .collection('accounts', ref =>
        ref.where('email', '==', email))
    return accountsRef.valueChanges()
  }

  checkIfAdmin(email: string) {
    this.getAccounts(email).subscribe(matches => {
      if (!matches) {
        this.isAdmin.next(false)
      } else {
        if (matches[0].isAdmin) {
          this.isAdmin.next(true)
          const expirationTime = (new Date())
          expirationTime.setHours(expirationTime.getHours() + 1)
          this.cookieService.set('adminState', 'true', {expires: expirationTime})
        }
      }
    })
  }

  resetAdminStatus() {
    this.isAdmin.next(false)
  }
}
