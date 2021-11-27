import {Component, OnInit} from '@angular/core';
import {loginData} from "../../models/loginData";
import {LoggedInService} from "../../services/logged-in.service";
import {AccountsService} from "../../services/accounts.service";
import {Account} from "../../models/accounts";
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";


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

  constructor(private loginService: LoggedInService, private accountService: AccountsService) {
  }

  get email() {
    return this.loginForm.get('email') as AbstractControl
  }

  get password() {
    return this.loginForm.get('password') as AbstractControl
  }

  handleLogin() {
    this.accountService.getAccounts().subscribe((resp: Account[]) => {
      const availableAccounts = resp.map(el => {
        return {email: el.email, password: el.password, isAdmin: el.isAdmin}
      })
      if (availableAccounts.filter((singleAccount: loginData) => {
        return singleAccount.email === this.loginForm.value.email && singleAccount.password === this.loginForm.value.password
      }).length > 0) {
        console.log('fail')
        this.loginService.logIn()
        if (availableAccounts[0].isAdmin) {
          this.loginService.changeAdminStatus(true)
        }
      } else {
        this.accountNotFound = true
      }
    })
  }

  // )
  // @ts-ignore


  ngOnInit(): void {
  }

}
