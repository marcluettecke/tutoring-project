import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "../../services/auth.service";
import {Subscription} from "rxjs";

@Component({
             selector: 'app-header',
             templateUrl: './header.component.html',
             styleUrls: ['./header.component.scss']
           })
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false
  username: string | null = ''
  authSubs: Subscription

  constructor(public authService: AuthService, private router: Router, private cookieService: CookieService) {
  }

  ngOnInit(): void {
    this.authSubs = this.authService.loginChanged
      .subscribe(user => {
                   if (user) {
                     this.isLoggedIn = true
                     console.log(user.displayName)
                     this.username = user.displayName
                   } else {
                     this.isLoggedIn = false
                     this.username = ''
                   }
                 }
      )
  }

  logout() {
    this.authService.logOut()
    this.router.navigate(['login'])
  }

  ngOnDestroy() {
    this.authSubs.unsubscribe()
  }

}
