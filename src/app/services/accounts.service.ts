import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from "@angular/fire/compat/firestore";
import {Account} from "../models/accounts";
import {Observable} from "rxjs";
import {Question} from "../models/question";

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

  addAccount(newAccount: Account) {
    this.firestore.collection<Account>('accounts').add(newAccount).then(_ => alert('Account added'))
  }
}
