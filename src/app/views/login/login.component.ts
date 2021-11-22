import { Component, OnInit } from '@angular/core';
import {Account} from "../../models/accounts";
import {LoggedInService} from "../../services/logged-in.service";

interface inputData {
  email: string,
  password: string
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})


export class LoginComponent implements OnInit {
  inputData: inputData = {email: '', password: ''}
  constructor(private loginService: LoggedInService) {}

  handleLogin(accounts: Account[], inputData: inputData ) {
    const availableAccounts = accounts.map((el: Account) => ({
        email: el.email,
        password: el.password,
      }));
      const overlap = availableAccounts.filter((account: typeof availableAccounts[0]) => (
        account.email === inputData.email && account.password === inputData.password));
      if (overlap.length > 0) {
        this.loginService.logIn();
      }
  }

  ngOnInit(): void {
  }

}
