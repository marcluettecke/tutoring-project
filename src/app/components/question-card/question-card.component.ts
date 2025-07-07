import {Component, Input, OnInit} from '@angular/core';
import {Question} from "../../models/question.model";
import {faAngleDoubleDown, faAngleDoubleUp} from "@fortawesome/free-solid-svg-icons";
import {AnswerOptionComponent} from "../answer-option/answer-option.component";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {NgClass} from "@angular/common";

@Component({
             selector: 'app-question-card',
             standalone: true,
             imports: [AnswerOptionComponent, FontAwesomeModule, NgClass],
             templateUrl: './question-card.component.html',
             styleUrls: ['./question-card.component.scss'],

           })
export class QuestionCardComponent implements OnInit {
  @Input() questionItem: Question
  @Input() questionIndex: number
  @Input() subSectionName: string
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
