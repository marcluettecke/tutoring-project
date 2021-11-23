import {Component, OnInit} from '@angular/core';
import {loginData} from "../../models/loginData";
import {LoggedInService} from "../../services/logged-in.service";
import {AccountsService} from "../../services/accounts.service";
import {Account} from "../../models/accounts";


@Component({
             selector: 'app-login',
             templateUrl: './login.component.html',
             styleUrls: ['./login.component.scss']
           })


export class LoginComponent implements OnInit {
  inputData: loginData = {email: '', password: ''}

  constructor(private loginService: LoggedInService, private accountService: AccountsService) {
  }
  handleLogin(inputData: loginData) {
    this.accountService.getAccounts().subscribe((resp: Account[]) => {
      const availableAccounts = resp.map(el => {
        return {email: el.email, password: el.password, isAdmin: el.isAdmin}
      })
      if (availableAccounts.filter((singleAccount: loginData) => {
        return singleAccount.email === inputData.email && singleAccount.password === inputData.password
      }).length > 0) {
        this.loginService.logIn()
        if (availableAccounts[0].isAdmin) {
          this.loginService.changeAdminStatus(true)
        }
      }
    })
  }

  // )
  // @ts-ignore


  ngOnInit(): void {
  }

}
