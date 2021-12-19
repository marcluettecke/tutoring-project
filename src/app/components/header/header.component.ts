import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "../../services/auth.service";
import {Subscription} from "rxjs";
import {AccountsService} from "../../services/accounts.service";

@Component({
             selector: 'app-header',
             templateUrl: './header.component.html',
             styleUrls: ['./header.component.scss']
           })
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false
  isAdmin = false
  username: string | null = ''
  authSubs: Subscription
  adminSubs: Subscription

  constructor(public authService: AuthService, private router: Router, private cookieService: CookieService, private accountsService: AccountsService) {
  }

  ngOnInit(): void {
    this.authSubs = this.authService.loginChanged
      .subscribe(loggedIn => {
                   if (loggedIn) {
                     this.isLoggedIn = true
                   } else {
                     this.isLoggedIn = false
                     this.username = ''
                   }
                 }
      )
    this.adminSubs = this.accountsService.isAdmin.subscribe(isAdmin => {
      this.isAdmin = isAdmin
    })
  }

  logout() {
    this.authService.logOut()
    this.accountsService.resetAdminStatus()
    this.cookieService.delete('loggedinState')
    this.cookieService.delete('adminState')
    this.router.navigate(['login'])
  }

  ngOnDestroy() {
    this.authSubs.unsubscribe()
    this.adminSubs.unsubscribe()

  }

}
