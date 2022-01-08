import {Component, Input} from '@angular/core';

@Component({
             selector: 'app-info-snackbar',
             templateUrl: './info-snackbar.component.html',
             styleUrls: ['./info-snackbar.component.scss']
           })
export class InfoSnackbarComponent {
  @Input() infoText: string

}
