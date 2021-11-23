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
    this.accountService.getAccounts().subscribe((resp: Account[]) =>{
      const availableAccounts = resp.map(el => {
        return {email: el.email, password: el.password}
      })
      if(availableAccounts.some((singleAccount: loginData) => {
        return singleAccount.email === inputData.email && singleAccount.password === inputData.password
      })){
        this.loginService.logIn()
      }
    })
  }

  // )
  // @ts-ignore


  ngOnInit(): void {
  }

}
