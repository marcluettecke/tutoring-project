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
  resetAnswers: Subject<void> = new Subject<void>()
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


  /**
   * Records a user's answer choice and updates score tracking
   * Handles both initial answers and answer changes with proper score adjustments
   * @param questionItem The question being answered
   * @param clickedAnswer The answer option selected by the user
   * @param firstTimeClicked Whether this is the first time answering this question
   * @param previousAnswerWasWrong Whether the previous answer was incorrect
   */
  addClickedAnswer(questionItem: Question, clickedAnswer: string, firstTimeClicked: boolean, previousAnswerWasWrong: boolean): void {
    if (firstTimeClicked) {
      this.correctAnswers.total.blank--;
      this.correctAnswers[questionItem.mainSection].blank--;

      if (questionItem.correctAnswer === clickedAnswer) {
        this.correctAnswers.total.correct++;
        this.correctAnswers[questionItem.mainSection].correct++;
      } else {
        this.correctAnswers.total.incorrect++;
        this.correctAnswers[questionItem.mainSection].incorrect++;
      }
    } else {
      if (previousAnswerWasWrong && questionItem.correctAnswer === clickedAnswer) {
        this.correctAnswers.total.correct++;
        this.correctAnswers[questionItem.mainSection].correct++;
        this.correctAnswers.total.incorrect--;
        this.correctAnswers[questionItem.mainSection].incorrect--;
      }
      if (previousAnswerWasWrong && questionItem.correctAnswer !== clickedAnswer) {
        return;
      }
      if (!previousAnswerWasWrong && questionItem.correctAnswer === clickedAnswer) {
        return;
      }
      if (!previousAnswerWasWrong && questionItem.correctAnswer !== clickedAnswer) {
        this.correctAnswers.total.incorrect++;
        this.correctAnswers[questionItem.mainSection].incorrect++;
        this.correctAnswers.total.correct--;
        this.correctAnswers[questionItem.mainSection].correct--;
      }
    }
  }

  /**
   * Notifies subscribers that a test has started
   */
  handleTestStart(): void {
    this.testStatus.next('started');
  }

  /**
   * Notifies subscribers that a test has ended
   */
  handleTestEnd(): void {
    this.testStatus.next('ended');
  }

  /**
   * Resets all question states to unanswered and clears UI selections
   * Restores original question counts from QUESTIONWEIGHTS configuration
   */
  resetAllAnswers(): void {
    this.correctAnswers = {
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
      }
    };
    
    this.clearRadioButtons();
    this.resetAnswers.next();
  }

  /**
   * Gets current test answers for navigation guard checks and external validation
   * @returns Current answer tracking object with totals and section breakdowns
   */
  getTestAnswers() {
    return this.correctAnswers;
  }

  /**
   * Clears all radio button selections in the DOM
   * Ensures visual state matches the reset data state
   */
  private clearRadioButtons(): void {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach((radio: Element) => {
      (radio as HTMLInputElement).checked = false;
    });
  }
}
