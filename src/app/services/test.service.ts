import {Injectable} from '@angular/core';
import {Question} from "../models/question.model";
import {Subject} from "rxjs";

interface ClickedAnswers {
  [key: string]: ClickedAnswer
}

interface ClickedAnswer {
  correctAnswer?: string,
  clickedAnswer?: string
  mainSection?: string
  correct?: boolean
}

@Injectable({
              providedIn: 'root'
            })
export class TestService {
  testStatus: Subject<string> = new Subject<string>()
  clickedAnswers: ClickedAnswers = {}
  correctAnswers = {
    total: 0,
    administrativo: 0,
    medioAmbiente: 0,
    costas: 0,
    aguas: 0
  }

  addClickedAnswer(questionItem: Question, clickedAnswer: string) {
    const newItem: ClickedAnswer = {}
    newItem.correctAnswer = questionItem.correctAnswer
    newItem.clickedAnswer = clickedAnswer
    newItem.mainSection = questionItem.mainSection
    newItem.correct = questionItem.correctAnswer === clickedAnswer
    this.clickedAnswers[questionItem.id] = newItem
  }

  handleTestStart() {
    this.testStatus.next('started')
  }

  handleTestEnd() {
    this.testStatus.next('ended')

    Object.values(this.clickedAnswers).map((el) => {
      if (el.correct) {
        this.correctAnswers.total++
      }
      if (el.mainSection === 'medio ambiente' && el.correct) {
        this.correctAnswers.medioAmbiente++
      }
      if (el.mainSection !== 'medio ambiente' && el.correct) {
        const section = <'administrativo' | 'aguas' | 'costas'>el.mainSection
        this.correctAnswers[section]++
      }
    })
    console.log(this.correctAnswers);
  }
}
