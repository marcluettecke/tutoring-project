import {Component, Input, OnInit} from '@angular/core';
import {Question} from "../../models/question";
import {faAngleDoubleDown, faAngleDoubleUp} from "@fortawesome/free-solid-svg-icons";

@Component({
             selector: 'app-question-card',
             templateUrl: './question-card.component.html',
             styleUrls: ['./question-card.component.scss'],

           })
export class QuestionCardComponent implements OnInit {
  @Input() questionItem: Question
  @Input() questionIndex: number
  @Input() mainSectionNumber: number
  @Input() subSectionNumber: number
  @Input() sidebarExpanded: boolean

  faAngleDoubleDown = faAngleDoubleDown
  faAngleDoubleUp = faAngleDoubleUp

  clicked = false
  wrongAnswerClicked = false
  selectedAnswer: string
  explanationShown = false

  constructor() {
  }

  clickHandler(isCorrect: boolean, id: string) {
    // set the value of if one answer in general was chosen
    this.clicked = true;
    // set the value for shake animation to trigger if wrong answer is chose
    this.wrongAnswerClicked = !isCorrect;
    // set the selected value to correct for disabling the right buttons
    this.selectedAnswer = id;
  }

  ngOnInit(): void {
  }

}
