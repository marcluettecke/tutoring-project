import {Injectable} from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where
} from '@angular/fire/firestore';
import {Account} from "../models/User.model";
import {BehaviorSubject, Observable} from "rxjs";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "./auth.service";

@Injectable({
              providedIn: 'root'
            })
export class AccountsService {
  isAdmin = new BehaviorSubject<boolean>(this.cookieService.get('adminState') === 'true')

  constructor(private firestore: Firestore, private cookieService: CookieService, private authService: AuthService) {
    this.authService.loginChanged
      .subscribe(user => {
        if (!!user) {
          this.checkIfAdmin(user.email as string)
        }
      })
  }


  getAccounts(email: string): Observable<Account[]> {
    const accountsCollection = collection(this.firestore, 'accounts');
    const q = query(accountsCollection, where('email', '==', email));
    return collectionData(q, { idField: 'id' }) as Observable<Account[]>;
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
