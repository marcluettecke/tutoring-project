import {Component, OnInit} from '@angular/core';
import {AccountsService} from "../../services/accounts.service";
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "../../services/auth.service";
import {getAuth} from "firebase/auth";


@Component({
             selector: 'app-login',
             templateUrl: './login.component.html',
             styleUrls: ['./login.component.scss']
           })


export class LoginComponent implements OnInit {
  accountNotFound = false

  constructor(private accountService: AccountsService,
              private router: Router,
              private cookieService: CookieService, private auth: AuthService) {
  }

  handleEmailLogin() {
    // stay logged in for 1 hours

    // this.accountService.getAccounts(this.loginForm.value.email, this.loginForm.value.password)
    //   .subscribe(response => {
    //     if (response.length > 0) {
    //       this.loginService.logIn()
    //       this.router.navigate(['/home'])
    //       if (response[0].isAdmin) {
    //         this.loginService.changeAdminStatus(true)
    //         this.cookieService.set('adminState', 'true', {expires: expirationTime})
    //       }
    //     } else {
    //       this.accountNotFound = true
    //     }
    //   })
  }

  handleGoogleLogin() {
    this.auth.googleLogin()
  }


  ngOnInit(): void {
  }

}
