import { Component, OnInit } from '@angular/core';
import {LoggedInService} from "../../services/logged-in.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor( public loggedInService: LoggedInService, private router: Router) { }
  ngOnInit(): void {
  }

  logout(){
    this.loggedInService.logOut()
    this.router.navigate(['login'])
  }

}
