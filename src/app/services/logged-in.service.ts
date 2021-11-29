import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {CookieService} from "ngx-cookie-service";

@Injectable({
  providedIn: 'root'
})
export class LoggedInService {
  private readonly  _isLoggedIn = new BehaviorSubject<boolean>(this.cookieService.get('loggedinState') === 'true')
  readonly isLoggedIn$ = this._isLoggedIn.asObservable()
  private readonly  _isAdmin = new BehaviorSubject<boolean>(this.cookieService.get('adminState') === 'true')
  readonly isAdmin$ = this._isAdmin.asObservable()

  constructor(private cookieService: CookieService) {
  }

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
    this.changeAdminStatus(false)
  }
  changeAdminStatus(value: boolean){
    this.isAdmin = value
  }


}
