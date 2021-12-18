import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from "@angular/forms";
import {AccountsService} from "../../services/accounts.service";
import {Account} from "../../models/User.model";
import {AuthService} from "../../services/auth.service";

@Component({
             selector: 'app-signup',
             templateUrl: './signup.component.html',
             styleUrls: ['./signup.component.scss']
           })
export class SignupComponent implements OnInit {

  signupForm = new FormGroup({
                               firstname: new FormControl('', [Validators.required]),
                               lastname: new FormControl('', [Validators.required]),
                               email: new FormControl('', [Validators.required]),
                               password: new FormControl('', [Validators.required]),
                               isAdmin: new FormControl(''),
                             })

  constructor(private accountService: AccountsService, private auth: AuthService) {
  }

  get firstname() {
    return this.signupForm.get('firstname') as AbstractControl
  }

  get lastname() {
    return this.signupForm.get('lastname') as AbstractControl
  }

  get email() {
    return this.signupForm.get('email') as AbstractControl
  }

  get password() {
    return this.signupForm.get('password') as AbstractControl
  }

  get isAdmin() {
    return this.signupForm.get('isAdmin') as AbstractControl
  }

  handleSignup() {
    const newUser: Account = {
      id: `${new Date()}`,
      firstname: this.signupForm.value.firstname,
      lastname: this.signupForm.value.lastname,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      isAdmin: this.signupForm.value.isAdmin
    }
    this.accountService.addAccount(newUser)
    this.auth.signUp(this.email.value, this.password.value, this.firstname.value)
    this.signupForm.reset()
  }

  ngOnInit(): void {
  }

}
