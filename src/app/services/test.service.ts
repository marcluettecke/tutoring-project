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
  private readonly TEST_STATE_KEY = 'testServiceState';
  private readonly ANSWERED_QUESTIONS_KEY = 'answeredQuestions';
  correctAnswers: { [key: string]: { blank: number, correct: number, incorrect: number } }
  private answeredQuestions: Map<string, string> = new Map(); // questionId -> selectedAnswer

  constructor() {
    // Initialize with default values or restore from saved state
    this.correctAnswers = this.restoreState() || this.getDefaultState();
    this.restoreAnsweredQuestions();
  }

  /**
   * Get the default state for correct answers
   */
  private getDefaultState() {
    return {
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
    };
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
    
    // Save state after each answer
    this.saveState();
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
    this.correctAnswers = this.getDefaultState();
    
    // Clear saved state from localStorage
    this.clearSavedState();
    
    // Clear answered questions
    this.answeredQuestions.clear();
    this.clearAnsweredQuestionsFromStorage();
    
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

  /**
   * Save current test state to localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        correctAnswers: this.correctAnswers,
        timestamp: Date.now()
      };
      localStorage.setItem(this.TEST_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      // Error saving test state
    }
  }

  /**
   * Restore test state from localStorage
   */
  private restoreState(): { [key: string]: { blank: number, correct: number, incorrect: number } } | null {
    try {
      const savedState = localStorage.getItem(this.TEST_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Check if saved state is not too old (12 hours)
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        if (parsed.timestamp && parsed.timestamp > twelveHoursAgo) {
          return parsed.correctAnswers;
        } else {
          // Clear old state
          this.clearSavedState();
        }
      }
    } catch (error) {
      this.clearSavedState();
    }
    return null;
  }

  /**
   * Clear saved state from localStorage
   */
  private clearSavedState(): void {
    try {
      localStorage.removeItem(this.TEST_STATE_KEY);
    } catch (error) {
      // Error clearing saved test state
    }
  }

  /**
   * Check if there's a saved state available
   */
  hasSavedState(): boolean {
    try {
      const savedState = localStorage.getItem(this.TEST_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        return parsed.timestamp && parsed.timestamp > twelveHoursAgo;
      }
    } catch (error) {
      console.error('Error checking saved state:', error);
    }
    return false;
  }

  /**
   * Save a question answer for persistence
   */
  saveQuestionAnswer(questionId: string, selectedAnswer: string): void {
    this.answeredQuestions.set(questionId, selectedAnswer);
    this.saveAnsweredQuestionsToStorage();
  }

  /**
   * Get a saved answer for a question
   */
  getSavedAnswer(questionId: string): string | undefined {
    return this.answeredQuestions.get(questionId);
  }

  /**
   * Check if a question has been answered
   */
  hasAnsweredQuestion(questionId: string): boolean {
    return this.answeredQuestions.has(questionId);
  }

  /**
   * Save answered questions to localStorage
   */
  private saveAnsweredQuestionsToStorage(): void {
    try {
      const answeredArray = Array.from(this.answeredQuestions.entries());
      localStorage.setItem(this.ANSWERED_QUESTIONS_KEY, JSON.stringify({
        questions: answeredArray,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Error saving answered questions
    }
  }

  /**
   * Restore answered questions from localStorage
   */
  private restoreAnsweredQuestions(): void {
    try {
      const saved = localStorage.getItem(this.ANSWERED_QUESTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        
        if (parsed.timestamp && parsed.timestamp > twelveHoursAgo) {
          this.answeredQuestions = new Map(parsed.questions);
        } else {
          this.clearAnsweredQuestionsFromStorage();
        }
      }
    } catch (error) {
      this.clearAnsweredQuestionsFromStorage();
    }
  }

  /**
   * Clear answered questions from storage
   */
  private clearAnsweredQuestionsFromStorage(): void {
    try {
      localStorage.removeItem(this.ANSWERED_QUESTIONS_KEY);
    } catch (error) {
      // Error clearing answered questions
    }
  }
}
