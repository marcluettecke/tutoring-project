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
import {ExamConfiguration} from '../../models/exam-configuration.model';

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
    // Check if we have a custom configuration
    const customConfig = this.testService.getCustomConfiguration();
    if (!customConfig) {
      // If no custom configuration, redirect to configuration page
      this.router.navigate(['/exam-configuration']);
      return;
    }
    
    // Reset test service to clear any previous state
    this.testService.resetAllAnswers();
    
    // Get current user ID from auth service
    this.currentUserId = this.authService.loginChanged.value?.uid || null;
    
    this.questionSubscription = this.questionsService.getQuestions().subscribe(questions => {
                                                                                 this.questions = questions
                                                                                 this.filterQuestions()
                                                                                 // Automatically start the test after loading questions
                                                                                 this.testService.handleTestStart()
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
    const customConfig = this.testService.getCustomConfiguration();
    
    if (customConfig) {
      this.filterQuestionsWithCustomConfig(customConfig);
    } else {
      // Fallback to default filtering
      this.filterQuestionsDefault();
    }
  }

  private filterQuestionsDefault() {
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

  private filterQuestionsWithCustomConfig(config: ExamConfiguration) {
    // Always use custom distribution since each section has its own question count
    this.selectCustomDistributionQuestions(this.questions, config);

    // Update test service with actual question counts per section
    const actualCounts: { [key: string]: number } = {};
    this.filteredQuestions.forEach(q => {
      actualCounts[q.mainSection] = (actualCounts[q.mainSection] || 0) + 1;
    });

    Object.keys(actualCounts).forEach(section => {
      this.testService.updateCustomQuestionCount(section, actualCounts[section]);
    });
  }

  private calculateTotalAvailableQuestions(config: ExamConfiguration): number {
    const counted = new Set<string>();
    let total = 0;

    config.selections.forEach(selection => {
      const questions = this.questions.filter(q => {
        if (q.mainSection !== selection.mainSection) return false;
        
        if (selection.subsections && selection.subsections.length > 0) {
          return selection.subsections.includes(q.subSection || '');
        }
        return true;
      });

      questions.forEach(q => {
        if (!counted.has(q.id)) {
          counted.add(q.id);
          total++;
        }
      });
    });

    return total;
  }

  private selectProportionalQuestions(questions: Question[], config: ExamConfiguration, totalNeeded: number) {
    // Shuffle all questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    
    // Take the required number
    this.filteredQuestions = shuffled.slice(0, totalNeeded);
  }

  private selectCustomDistributionQuestions(questions: Question[], config: ExamConfiguration) {
    this.filteredQuestions = []; // Clear any existing questions
    
    config.selections.forEach(selection => {
      const sectionQuestions = questions.filter(q => {
        if (q.mainSection !== selection.mainSection) return false;
        
        if (selection.subsections && selection.subsections.length > 0) {
          return selection.subsections.includes(q.subSection || '');
        }
        return true;
      });

      // Determine how many questions to select
      let questionsToSelect = sectionQuestions.length; // Default to all
      if (selection.questionCount !== undefined) {
        questionsToSelect = selection.questionCount;
      }

      // Shuffle and take the specified count
      const shuffled = [...sectionQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionsToSelect);
      
      this.filteredQuestions.push(...selected);
    });

    // Remove any duplicates
    const uniqueIds = new Set<string>();
    this.filteredQuestions = this.filteredQuestions.filter(q => {
      if (uniqueIds.has(q.id)) return false;
      uniqueIds.add(q.id);
      return true;
    });
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
    // Clear custom configuration
    this.testService.clearCustomConfiguration();
    // Navigate to exam configuration to select new test
    this.router.navigate(['/exam-configuration']);
  }

  ngOnDestroy() {
    if (this.questionSubscription) {
      this.questionSubscription.unsubscribe();
    }
    if (this.testStatusSubscription) {
      this.testStatusSubscription.unsubscribe();
    }
    // Clear custom configuration when leaving test
    this.testService.clearCustomConfiguration();
  }

}
