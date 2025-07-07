import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faAngleDoubleLeft } from "@fortawesome/free-solid-svg-icons";
import { QuestionsService } from "../../services/questions.service";
import { Question } from "../../models/question.model";
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgClass } from "@angular/common";

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit, OnDestroy {
  sections: { [id: string]: { name: string, index: number }[] } = {};
  mainSections: string[] = [];
  isExpanded: { [id: number]: boolean } = {};
  faAngleDoubleLeft = faAngleDoubleLeft;
  open = true;
  sectionOrderEnum: { [key: string]: number } = {
    'administrativo': 1,
    'medio ambiente': 2,
    'costas': 3,
    'aguas': 4
  };
  @Input() activeSection: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number };
  @Output() clickEmit: EventEmitter<{ mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number }> = new EventEmitter();
  @Output() expandSidebarEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  
  private destroy$ = new Subject<void>();

  constructor(private questionService: QuestionsService) {
  }

  ngOnInit(): void {
    const questions$ = this.questionService.getQuestions();
    questions$.pipe(takeUntil(this.destroy$)).subscribe((allQuestions: Question[]) => {
      const validQuestions = allQuestions.filter((question: Question) => {
        const hasId = typeof question.id === 'string' && question.id.trim() !== '';
        const hasMainSection = typeof question.mainSection === 'string' && question.mainSection.trim() !== '';
        const hasSubSection = typeof question.subSection === 'string' && question.subSection.trim() !== '';
        const hasQuestionText = typeof question.questionText === 'string' && question.questionText.trim() !== '';
        const hasSubSectionIndex = typeof question.subSectionIndex === 'number';

        return hasId && hasMainSection && hasSubSection && hasQuestionText && hasSubSectionIndex;
      });

      validQuestions.forEach((question: Question) => {
        if (!(question.mainSection in this.sections)) {
          this.sections[question.mainSection] = [{ name: question.subSection, index: question.subSectionIndex }];
        } else {
          const names = this.sections[question.mainSection].map(el => el.name);
          if (!names.includes(question.subSection)) {
            this.sections[question.mainSection].push({ name: question.subSection, index: question.subSectionIndex });
          }
        }
      });

      this.mainSections = Object.keys(this.sections);

      this.mainSections.sort((a, b) => {
        const orderA = this.sectionOrderEnum[a];
        const orderB = this.sectionOrderEnum[b];

        if (orderA === undefined && orderB === undefined) {
          return a.localeCompare(b);
        }
        if (orderA === undefined) return 1;
        if (orderB === undefined) return -1;

        return orderA - orderB;
      });

      Object.keys(this.sections).forEach(key => {
        if (this.sections[key]) {
          this.sections[key].sort((a: { name: string, index: number }, b: { name: string, index: number }) => {
            return a.index - b.index;
          });
        }
      });

      this.mainSections.forEach((_, idx) => {
        this.isExpanded[idx] = idx === 0;
      });
    });
  }

  clickHandlerMainList(index: number) {
    if (this.activeSection.mainSectionNumber !== index + 1) {
      this.isExpanded[index] = !this.isExpanded[index];
    }
  }

  clickHandlerSublist(mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number) {
    this.clickEmit.emit({ mainSection, subSection, mainSectionNumber, subSectionNumber });
  }

  iconClickHandler() {
    this.open = !this.open;
    this.expandSidebarEmit.emit(this.open);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}