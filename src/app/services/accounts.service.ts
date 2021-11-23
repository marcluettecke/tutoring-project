import {Injectable} from '@angular/core';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {loginData} from "../models/loginData";
import {find} from "rxjs/operators";

@Injectable({
              providedIn: 'root'
            })
export class AccountsService {

  constructor(private firestore: AngularFirestore) {
  }

  getAccounts(): any {
    return this.firestore.collection('accounts').valueChanges()
  }
}
