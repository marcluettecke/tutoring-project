import {Injectable} from '@angular/core';
import {Question} from "../models/question.model";
import {Subject} from "rxjs";
import {QUESTIONWEIGHTS} from "../views/test/constants";

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
  correctAnswers: { [key: string]: { blank: number, correct: number, incorrect: number } } = {
    total: {
      blank: 100,
      correct: 0,
      incorrect: 0
    },
    'administrativo': {
      blank: QUESTIONWEIGHTS['administrativo'],
      correct: 0,
      incorrect: 0
    },
    'medio ambiente': {
      blank: QUESTIONWEIGHTS['medio ambiente'],
      correct: 0,
      incorrect: 0
    },
    'costas': {
      blank: QUESTIONWEIGHTS['costas'],
      correct: 0,
      incorrect: 0
    },
    'aguas': {
      blank: QUESTIONWEIGHTS['aguas'],
      correct: 0,
      incorrect: 0
    },

  }


  addClickedAnswer(questionItem: Question, clickedAnswer: string, firstTimeClicked: boolean, previousAnswerWasWrong: boolean) {
    // handle the first click
    if (firstTimeClicked) {
      this.correctAnswers.total.blank--
      this.correctAnswers[questionItem.mainSection].blank--

      if (questionItem.correctAnswer === clickedAnswer) {
        this.correctAnswers.total.correct++
        this.correctAnswers[questionItem.mainSection].correct++
      } else {
        this.correctAnswers.total.incorrect++
        this.correctAnswers[questionItem.mainSection].incorrect++
      }
    } else {
      // handle subsequent clicks
      if (previousAnswerWasWrong && questionItem.correctAnswer === clickedAnswer) {
        this.correctAnswers.total.correct++
        this.correctAnswers[questionItem.mainSection].correct++
        this.correctAnswers.total.incorrect--
        this.correctAnswers[questionItem.mainSection].incorrect--
      }
      if (previousAnswerWasWrong && questionItem.correctAnswer !== clickedAnswer) {
        return
      }
      if (!previousAnswerWasWrong && questionItem.correctAnswer === clickedAnswer) {
        return
      }
      if (!previousAnswerWasWrong && questionItem.correctAnswer !== clickedAnswer) {
        this.correctAnswers.total.incorrect++
        this.correctAnswers[questionItem.mainSection].incorrect++
        this.correctAnswers.total.correct--
        this.correctAnswers[questionItem.mainSection].correct--
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
