import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-error-snackbar[errorText]',
  templateUrl: './error-snackbar.component.html',
  styleUrls: ['./error-snackbar.component.scss']
})
export class ErrorSnackbarComponent{
  @Input() errorText: string

}
