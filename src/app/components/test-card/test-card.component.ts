import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Question} from "../../models/question.model";
import {TestService} from "../../services/test.service";
import {ProgressService} from "../../services/progress.service";
import {Subject, takeUntil} from 'rxjs';
import {faAngleDoubleDown} from "@fortawesome/free-solid-svg-icons";
import {AnswerOptionComponent} from "../answer-option/answer-option.component";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";

@Component({
             selector: 'app-test-card',
             standalone: true,
             imports: [AnswerOptionComponent, FontAwesomeModule],
             templateUrl: './test-card.component.html',
             styleUrls: ['./test-card.component.scss']
           })
export class TestCardComponent implements OnInit, OnDestroy {
  @Input() questionItem: Question
  @Input() questionIndex: number
  @Input() testStatus: string
  firstTimeClicked = true
  previousAnswerWasWrong = false
  private destroy$ = new Subject<void>();

  faAngleDoubleDown = faAngleDoubleDown

  constructor(
    private testService: TestService,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    // Listen for reset events
    this.testService.resetAnswers
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetComponentState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleClick(questionItem: Question, clickedAnswer: string) {
    this.testService.addClickedAnswer(questionItem, clickedAnswer, this.firstTimeClicked, this.previousAnswerWasWrong)
    const isCorrect = questionItem.correctAnswer === clickedAnswer;
    this.previousAnswerWasWrong = !isCorrect;
    
    // Record section-specific answer if tracking is enabled and this is first click
    if (this.progressService.isTrackingEnabled && this.firstTimeClicked) {
      this.progressService.recordQuestionAnswer(
        questionItem.mainSection,
        questionItem.subSection,
        isCorrect
      );
    }
    
    this.firstTimeClicked = false;
  }

  /**
   * Reset this component's state to initial values
   */
  private resetComponentState(): void {
    this.firstTimeClicked = true;
    this.previousAnswerWasWrong = false;
  }

}
