import {Injectable} from '@angular/core';
import {Question} from "../models/question.model";
import {Subject} from "rxjs";

@Injectable({
              providedIn: 'root'
            })
export class TestService {
  testStatus: Subject<string> = new Subject<string>()
  correctAnswers: { [key: string]: number } = {
    administrativo: 0,
    medioAmbiente: 0,
    costas: 0,
    aguas: 0
  }

  constructor() {
  }

  evaluateQuestions(clickedAnswers: string[], questionItem: Question) {
    for (const clickedAnswer of clickedAnswers) {
      if (clickedAnswer === questionItem.correctAnswer) {
        this.correctAnswers[questionItem.mainSection] += 1
      }
    }
  }

  handleTestStart() {
    this.testStatus.next('started')
  }

  handleTestEnd() {
    this.testStatus.next('ended')
  }
}
