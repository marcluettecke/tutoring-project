import { Injectable } from '@angular/core';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {Observable} from "rxjs";

interface loginData {
  email: string,
  password: string
}

@Injectable({
  providedIn: 'root'
})
export class AccountsService {

  constructor(private firestore: AngularFirestore) { }

  getAccounts(): any  {
    return this.firestore.collection('accounts').valueChanges()
  }

  checkAccount(value: {email: string, password: string}) {
    this.getAccounts().subscribe((resp: {email: string, password: string}[]) => {
      return resp.includes(value)
    })
  }
}
