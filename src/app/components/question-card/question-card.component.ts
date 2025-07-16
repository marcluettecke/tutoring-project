import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Question} from "../../models/question.model";
import {ProgressService} from "../../services/progress.service";
import {TestService} from "../../services/test.service";
import {Subject, takeUntil} from 'rxjs';
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
export class QuestionCardComponent implements OnInit, OnDestroy {
  @Input() questionItem: Question
  @Input() questionIndex: number
  @Input() subSectionName: string
  @Input() sidebarExpanded: boolean

  faAngleDoubleDown = faAngleDoubleDown
  faAngleDoubleUp = faAngleDoubleUp

  clicked = false
  wrongAnswerClicked = false
  selectedAnswer: string = ''
  explanationShown = false
  private firstClick = true
  private destroy$ = new Subject<void>();

  constructor(
    private progressService: ProgressService,
    private testService: TestService
  ) {}

  clickHandler(isCorrect: boolean, id: string) {
    this.clicked = true;
    this.wrongAnswerClicked = !isCorrect;
    this.selectedAnswer = id;
    
    if (this.progressService.isTrackingEnabled && this.firstClick) {
      // Record section-specific answer with timestamp
      this.progressService.recordQuestionAnswer(
        this.questionItem.mainSection,
        this.questionItem.subSection,
        isCorrect
      );
      this.firstClick = false;
    }
  }

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

  /**
   * Reset this component's state to initial values
   */
  private resetComponentState(): void {
    this.clicked = false;
    this.wrongAnswerClicked = false;
    this.selectedAnswer = '';
    this.explanationShown = false;
    this.firstClick = true;
  }

}
