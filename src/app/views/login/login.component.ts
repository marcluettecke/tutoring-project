import {Component, OnInit} from '@angular/core';
import {LoggedInService} from "../../services/logged-in.service";
import {AccountsService} from "../../services/accounts.service";
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";
import {AuthService} from "../../services/auth.service";


@Component({
             selector: 'app-login',
             templateUrl: './login.component.html',
             styleUrls: ['./login.component.scss']
           })


export class LoginComponent implements OnInit {
  accountNotFound = false
  loginForm = new FormGroup({
                              email: new FormControl('', [Validators.required]),
                              password: new FormControl('', [Validators.required])
                            })

  constructor(private loginService: LoggedInService,
              private accountService: AccountsService,
              private router: Router,
              private cookieService: CookieService, private auth: AuthService) {
  }

  get email() {
    return this.loginForm.get('email') as AbstractControl
  }

  get password() {
    return this.loginForm.get('password') as AbstractControl
  }

  handleLogin() {
    this.auth.login(this.email.value, this.password.value)
    // stay logged in for 1 hours
    // const expirationTime = (new Date())
    // expirationTime.setHours(expirationTime.getHours() + 1)
    // this.accountService.getAccounts(this.loginForm.value.email, this.loginForm.value.password)
    //   .subscribe(response => {
    //     if (response.length > 0) {
    //       this.loginService.logIn()
    //       this.cookieService.set('loggedinState', 'true', {expires: expirationTime})
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


  ngOnInit(): void {
  }

}
