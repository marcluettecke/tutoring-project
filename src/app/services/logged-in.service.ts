import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoggedInService {
  private readonly  _isLoggedIn = new BehaviorSubject<boolean>(false)
  readonly isLoggedIn$ = this._isLoggedIn.asObservable()
  private readonly  _isAdmin = new BehaviorSubject<boolean>(false)
  readonly isAdmin$ = this._isAdmin.asObservable()

  get isLoggedIn(): boolean {
    return this._isLoggedIn.getValue()
  }
  get isAdmin(): boolean {
    return this._isLoggedIn.getValue()
  }

  private set isLoggedIn(val: boolean) {
    this._isLoggedIn.next(val)
  }
  private set isAdmin(val: boolean) {
    this._isAdmin.next(val)
  }


  logIn(){
    this.isLoggedIn = true
  }
  logOut(){
    this.isLoggedIn = false
  }
  changeAdminStatus(value: boolean){
    this.isAdmin = value
  }


  constructor() { }
}
