import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-error-snackbar[errorText]',
  templateUrl: './error-snackbar.component.html',
  styleUrls: ['./error-snackbar.component.scss']
})
export class ErrorSnackbarComponent implements OnInit {
  @Input() errorText: string

  constructor() { }

  ngOnInit(): void {
  }

}
