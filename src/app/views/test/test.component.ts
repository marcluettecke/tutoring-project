import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question.model";
import {TestService} from "../../services/test.service";
import {AuthService} from "../../services/auth.service";
import {Subscription} from "rxjs";
import {QUESTIONWEIGHTS} from './constants';
import {ResultModalComponent} from '../../components/result-modal/result-modal.component';
import {TestCardComponent} from '../../components/test-card/test-card.component';
import {TimerComponent} from '../../components/timer/timer.component';
import {ErrorSnackbarComponent} from '../../components/error-snackbar/error-snackbar.component';

@Component({
             selector: 'app-test',
             standalone: true,
             imports: [ResultModalComponent, TestCardComponent, TimerComponent, ErrorSnackbarComponent],
             templateUrl: './test.component.html',
             styleUrls: ['./test.component.scss']
           })
export class TestComponent implements OnInit, OnDestroy {
  modalOpen = false;
  questions: Question[] = []
  testStatus: string
  filteredQuestions: Question[] = []
  errorMessage = ''
  questionSubscription: Subscription
  testStatusSubscription: Subscription
  currentUserId: string | null = null;


  constructor(
    private questionsService: QuestionsService, 
    private testService: TestService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Reset test service to clear any previous state
    this.testService.resetAllAnswers();
    
    // Get current user ID from auth service
    this.currentUserId = this.authService.loginChanged.value?.uid || null;
    
    this.questionSubscription = this.questionsService.getQuestions().subscribe(questions => {
                                                                                 this.questions = questions
                                                                                 this.filterQuestions()
                                                                               },
                                                                               error => {
                                                                                 this.errorMessage = error
                                                                               })
    this.testStatusSubscription = this.testService.testStatus.subscribe(status => {
      this.testStatus = status
      this.modalOpen = status === 'ended'
    })
  }

  filterQuestions() {

    for (const mainSection of ['administrativo', 'medio ambiente', 'costas', 'aguas']) {
      const questionPerSection = this.questions.filter(el => el.mainSection === mainSection)
      // find how many questions per mainSection exist
      const maxFilter = questionPerSection.length
      const indices = Array(maxFilter).fill(0).map((_, index) => index);
      indices.sort(() => Math.random() - 0.5);

      // Take only the number of questions specified in QUESTIONWEIGHTS or all available questions, whichever is smaller
      const questionsToTake = Math.min(QUESTIONWEIGHTS[mainSection], maxFilter);
      
      for (const index of indices.slice(0, questionsToTake)) {
        this.filteredQuestions.push(questionPerSection[index])
      }
    }
  }

  openModal() {
    this.modalOpen = true
  }

  closeModal() {
    this.modalOpen = false;
  }

  /**
   * Handle when user closes modal without saving
   */
  onModalClose() {
    this.modalOpen = false;
    // Navigate back to home
    this.router.navigate(['/home']);
  }

  /**
   * Handle when user retries the test
   */
  onRetryTest() {
    this.modalOpen = false;
    // Reset test service and start over
    this.testService.resetAllAnswers();
    this.testService.handleTestStart();
    // Clear current questions and re-filter to get new random questions
    this.filteredQuestions = [];
    this.filterQuestions();
    // Stay on test page for retry
  }

  /**
   * Handle when user wants to continue to new test
   */
  onContinueTest() {
    this.modalOpen = false;
    // Navigate back to home to select new test
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    this.questionSubscription.unsubscribe()
    this.testStatusSubscription.unsubscribe()
  }

}
