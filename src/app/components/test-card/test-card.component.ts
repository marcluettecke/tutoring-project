import {Component, Input,} from '@angular/core';
import {Question} from "../../models/question.model";

@Component({
             selector: 'app-test-card',
             templateUrl: './test-card.component.html',
             styleUrls: ['./test-card.component.scss']
           })
export class TestCardComponent {
  @Input() questionItem: Question
  @Input() questionIndex: number

}
