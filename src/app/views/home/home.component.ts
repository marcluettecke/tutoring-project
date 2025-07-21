import {Component, OnDestroy, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {TestService} from "../../services/test.service";
import {Question} from "../../models/question.model";
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {QuestionCardComponent} from "../../components/question-card/question-card.component";
import {ErrorSnackbarComponent} from "../../components/error-snackbar/error-snackbar.component";
import {SideNavComponent} from "../../components/side-nav/side-nav.component";

@Component({
             selector: 'app-home',
             standalone: true,
             imports: [QuestionCardComponent, ErrorSnackbarComponent, SideNavComponent],
             templateUrl: './home.component.html',
             styleUrls: ['./home.component.scss']
           })
export class HomeComponent implements OnInit, OnDestroy {
  questions: Question[] = [];
  tempQuestions: Question [] = [];
  sidebarExpanded = true;
  errorMessage = ''
  activeSection: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number } = {
    mainSection: '',
    subSection: '',
    mainSectionNumber: 0,
    subSectionNumber: 0
  }
  
  private destroy$ = new Subject<void>();
  private readonly ACTIVE_SECTION_KEY = 'homeActiveSection';

  constructor(
    private questionService: QuestionsService,
    private testService: TestService
  ) {
  }


  ngOnInit(): void {
    // Restore active section from localStorage if available
    const savedSection = this.restoreActiveSection();
    if (savedSection) {
      this.activeSection = savedSection;
      // Load questions for the restored section
      setTimeout(() => {
        this.updateData();
      }, 100);
    }
    // TestService will restore its own state from localStorage
    // Auto-selection is now handled by the SideNavComponent (only if no saved section)
  }

  toggleSidebarExpanded(value: boolean) {
    this.sidebarExpanded = value
  }

  updateData() {
    this.questionService.getSpecificQuestions(this.activeSection.mainSection, this.activeSection.subSection)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        response => {
          this.questions = response.sort((a: Question, b: Question) => a.questionIndex - b.questionIndex)
        }, error => {
          this.errorMessage = error
        })
  }

  changeData(event: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number }) {
    this.activeSection = {
      mainSection: event.mainSection,
      subSection: event.subSection,
      mainSectionNumber: event.mainSectionNumber,
      subSectionNumber: event.subSectionNumber
    }
    this.saveActiveSection();
    this.updateData()
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Save active section to localStorage
   */
  private saveActiveSection(): void {
    try {
      localStorage.setItem(this.ACTIVE_SECTION_KEY, JSON.stringify(this.activeSection));
    } catch {
      // Error saving active section
    }
  }

  /**
   * Restore active section from localStorage
   */
  private restoreActiveSection(): { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number } | null {
    try {
      const saved = localStorage.getItem(this.ACTIVE_SECTION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Error restoring active section
    }
    return null;
  }

}
