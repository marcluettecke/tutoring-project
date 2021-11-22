import {Component, Input, OnInit} from '@angular/core';
import {Question} from "../../models/question";

@Component({
             selector: 'app-question-card',
             templateUrl: './question-card.component.html',
             styleUrls: ['./question-card.component.scss']
           })
export class QuestionCardComponent implements OnInit {
  @Input() questionItem: Question
  @Input() questionIndex: number

  clicked = false
  wrongAnswerClicked = false
  selectedAnswer: string

  constructor() {
  }

  clickHandler(isCorrect: boolean, id: string){
      // set the value of if one answer in general was chosen
      this.clicked = true;
      // set the value for shake animation to trigger if wrong answer is chose
      this.wrongAnswerClicked = !isCorrect;
      // set the selected value to correct for disabling the right buttons
      this.selectedAnswer = id;
  }

  ngOnInit(): void {}

}
