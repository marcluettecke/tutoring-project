import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoggedInService {
  private readonly  _isLoggedIn = new BehaviorSubject<boolean>(false)
  readonly isLoggedIn$ = this._isLoggedIn.asObservable()

  get isLoggedIn(): boolean {
    return this._isLoggedIn.getValue()
  }

  private set isLoggedIn(val: boolean) {
    this._isLoggedIn.next(val)
  }

  logIn(){
    this.isLoggedIn = true
  }
  logOut(){
    this.isLoggedIn = false
  }


  constructor() { }
}
