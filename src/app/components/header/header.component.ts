import {Component, OnInit} from '@angular/core';
import {LoggedInService} from "../../services/logged-in.service";
import {Router} from "@angular/router";
import {CookieService} from "ngx-cookie-service";

@Component({
             selector: 'app-header',
             templateUrl: './header.component.html',
             styleUrls: ['./header.component.scss']
           })
export class HeaderComponent implements OnInit {
  constructor(public loggedInService: LoggedInService, private router: Router, private cookieService: CookieService) {
  }

  ngOnInit(): void {
  }

  logout() {
    this.loggedInService.logOut()
    this.cookieService.delete('loggedinState')
    this.cookieService.delete('adminState')
    this.router.navigate(['login'])
  }

}
