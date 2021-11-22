import { Component, OnInit } from '@angular/core';
import {LoggedInService} from "../../services/logged-in.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor( public loggedInService: LoggedInService) { }

  ngOnInit(): void {
  }

}
