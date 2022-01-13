import {Component, Input, OnInit,} from '@angular/core';
import {Question} from "../../models/question.model";
import {TestService} from "../../services/test.service";

@Component({
             selector: 'app-test-card',
             templateUrl: './test-card.component.html',
             styleUrls: ['./test-card.component.scss']
           })
export class TestCardComponent {
  @Input() questionItem: Question
  @Input() questionIndex: number
  @Input() testStatus: string

  constructor(private testService: TestService) {}

  handleClick(questionItem: Question, clickedAnswer: string) {
    this.testService.addClickedAnswer(questionItem, clickedAnswer)
  }

}
