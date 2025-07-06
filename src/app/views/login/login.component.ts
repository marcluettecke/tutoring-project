import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {Subscription} from "rxjs";
import {ErrorSnackbarComponent} from "../../components/error-snackbar/error-snackbar.component";


@Component({
             selector: 'app-login',
             standalone: true,
             imports: [ErrorSnackbarComponent],
             templateUrl: './login.component.html',
             styleUrls: ['./login.component.scss']
           })


export class LoginComponent implements OnInit, OnDestroy {
  errorMessage = ''
  errorSub: Subscription

  constructor(private auth: AuthService) {
  }

  handleGoogleLogin() {
    this.auth.googleLogin()
  }

  ngOnInit() {
    this.errorSub = this.auth.errorStatusChanged.subscribe(event => {
      this.errorMessage = event.message
    })
  }

  ngOnDestroy() {
    this.errorSub.unsubscribe()
  }


}
