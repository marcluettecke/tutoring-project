import {Injectable} from '@angular/core';
import {Question} from "../models/question.model";
import {Subject, BehaviorSubject} from "rxjs";
import {QUESTIONWEIGHTS} from "../views/test/constants";
import {ExamConfiguration} from "../models/exam-configuration.model";

// Define types for better type safety
interface SectionCounts {
  blank: number;
  correct: number;
  incorrect: number;
}

interface CorrectAnswersState {
  [key: string]: SectionCounts;
}

@Injectable({
              providedIn: 'root'
            })
export class TestService {
  testStatus: BehaviorSubject<string> = new BehaviorSubject<string>('')
  resetAnswers: Subject<void> = new Subject<void>()
  modalMinimized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  private readonly TEST_STATE_KEY = 'testServiceState';
  private readonly ANSWERED_QUESTIONS_KEY = 'answeredQuestions';
  private readonly CUSTOM_CONFIG_KEY = 'customExamConfiguration';
  correctAnswers: CorrectAnswersState
  private answeredQuestions: Map<string, string> = new Map(); // questionId -> selectedAnswer
  private customConfiguration: ExamConfiguration | null = null;
  private elapsedTime: number = 0; // Time in seconds

  constructor() {
    // Restore custom configuration first
    this.restoreCustomConfiguration();
    
    // Initialize with default values or restore from saved state
    this.correctAnswers = this.restoreState() || this.getDefaultState();
    this.restoreAnsweredQuestions();
  }

  /**
   * Get the default state for correct answers
   */
  private getDefaultState(): CorrectAnswersState {
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
   * Updates modal minimized state
   */
  setModalMinimized(isMinimized: boolean): void {
    this.modalMinimized.next(isMinimized);
  }

  /**
   * Resets all question states to unanswered and clears UI selections
   * Restores original question counts from QUESTIONWEIGHTS configuration or custom configuration
   */
  resetAllAnswers(): void {
    this.correctAnswers = this.hasCustomConfiguration() 
      ? this.getDefaultStateForConfiguration(
          this.customConfiguration?.totalQuestions === 'full' 
            ? undefined 
            : this.customConfiguration?.totalQuestions as number
        )
      : this.getDefaultState();
    
    // Clear saved state from localStorage
    this.clearSavedState();
    
    // Clear answered questions
    this.answeredQuestions.clear();
    this.clearAnsweredQuestionsFromStorage();
    
    // Reset elapsed time
    this.resetElapsedTime();
    
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      // Error checking saved state
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
    } catch {
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
    } catch {
      this.clearAnsweredQuestionsFromStorage();
    }
  }

  /**
   * Clear answered questions from storage
   */
  private clearAnsweredQuestionsFromStorage(): void {
    try {
      localStorage.removeItem(this.ANSWERED_QUESTIONS_KEY);
    } catch {
      // Error clearing answered questions
    }
  }

  /**
   * Set custom exam configuration
   */
  setCustomConfiguration(config: ExamConfiguration): void {
    this.customConfiguration = config;
    try {
      localStorage.setItem(this.CUSTOM_CONFIG_KEY, JSON.stringify({
        config: config,
        timestamp: Date.now()
      }));
    } catch {
      // Error saving custom configuration
    }
  }

  /**
   * Get custom exam configuration
   */
  getCustomConfiguration(): ExamConfiguration | null {
    return this.customConfiguration;
  }

  /**
   * Check if using custom configuration
   */
  hasCustomConfiguration(): boolean {
    return this.customConfiguration !== null;
  }

  /**
   * Clear custom configuration
   */
  clearCustomConfiguration(): void {
    this.customConfiguration = null;
    try {
      localStorage.removeItem(this.CUSTOM_CONFIG_KEY);
    } catch {
      // Error clearing custom configuration
    }
  }

  /**
   * Restore custom configuration from storage
   */
  restoreCustomConfiguration(): void {
    try {
      const saved = localStorage.getItem(this.CUSTOM_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        if (parsed.timestamp && parsed.timestamp > oneHourAgo) {
          this.customConfiguration = parsed.config;
        } else {
          this.clearCustomConfiguration();
        }
      }
    } catch {
      this.clearCustomConfiguration();
    }
  }

  /**
   * Get default state based on custom configuration or standard weights
   */
  private getDefaultStateForConfiguration(totalQuestions?: number): CorrectAnswersState {
    if (this.customConfiguration) {
      const state: CorrectAnswersState = {
        total: {
          blank: totalQuestions || 0,
          correct: 0,
          incorrect: 0
        }
      };

      // Initialize sections based on custom configuration
      this.customConfiguration.selections.forEach(selection => {
        if (!state[selection.mainSection]) {
          state[selection.mainSection] = {
            blank: 0,
            correct: 0,
            incorrect: 0
          };
        }
      });

      return state;
    }

    return this.getDefaultState();
  }

  /**
   * Update question count for custom configuration
   */
  updateCustomQuestionCount(mainSection: string, count: number): void {
    if (!this.correctAnswers[mainSection]) {
      this.correctAnswers[mainSection] = {
        blank: count,
        correct: 0,
        incorrect: 0
      };
    } else {
      const diff = count - (this.correctAnswers[mainSection].blank + 
                           this.correctAnswers[mainSection].correct + 
                           this.correctAnswers[mainSection].incorrect);
      this.correctAnswers[mainSection].blank += diff;
      this.correctAnswers.total.blank += diff;
    }
  }

  /**
   * Set the elapsed time for the test
   * @param timeInSeconds Time elapsed in seconds
   */
  setElapsedTime(timeInSeconds: number): void {
    this.elapsedTime = timeInSeconds;
  }

  /**
   * Get the elapsed time for the test
   * @returns Time elapsed in seconds
   */
  getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Reset elapsed time
   */
  resetElapsedTime(): void {
    this.elapsedTime = 0;
  }
}
