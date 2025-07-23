import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {AccountsService} from "../services/accounts.service";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  isAdmin = false

  constructor(private accountsService: AccountsService, private router: Router) {
  }

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.accountsService.isAdmin.pipe(
      map(isAdmin => {
        if (isAdmin) {
          return true;
        } else {
          // Redirect to home if not admin
          return this.router.createUrlTree(['/home']);
        }
      })
    );
  }

}
