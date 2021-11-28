import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/compat/firestore";
import {Account} from "../models/accounts";
import {Observable} from "rxjs";

@Injectable({
              providedIn: 'root'
            })
export class AccountsService {

  constructor(private firestore: AngularFirestore) {
  }

  getAccounts(email: string, password: string): Observable<Account[]> {
    const accountsRef: AngularFirestoreCollection<Account> = this.firestore
      .collection('accounts', ref =>
        ref.where('email', '==', email)
          .where('password', '==', password))
    return accountsRef.valueChanges()
  }
}
