import {Component, OnDestroy, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question.model";
import {Subject, Subscription} from 'rxjs';
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
  questions: Question[];
  tempQuestions: Question [];
  sidebarExpanded = true;
  errorMessage = ''
  activeSection: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number } = {
    mainSection: '',
    subSection: '',
    mainSectionNumber: 0,
    subSectionNumber: 0
  }
  
  private destroy$ = new Subject<void>();

  constructor(private questionService: QuestionsService) {
  }


  ngOnInit(): void {
    // this.updateData()
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
    this.updateData()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
