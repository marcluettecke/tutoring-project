import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import {AccountsService} from "../services/accounts.service";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  isAdmin = false

  constructor(private accountsService: AccountsService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.accountsService.isAdmin
  }

}
