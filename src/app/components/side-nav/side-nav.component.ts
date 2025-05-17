import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faAngleDoubleLeft } from "@fortawesome/free-solid-svg-icons";
import { QuestionsService } from "../../services/questions.service";
import { Question } from "../../models/question.model";

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
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

  constructor(private questionService: QuestionsService) {
  }

  ngOnInit(): void {
    const questions$ = this.questionService.getQuestions();
    questions$.subscribe((allQuestions: Question[]) => {
      console.log(`Total questions fetched from service: ${allQuestions.length}`);

      const validQuestions = allQuestions.filter((question: Question) => {
        const hasId = typeof question.id === 'string' && question.id.trim() !== '';
        const hasMainSection = typeof question.mainSection === 'string' && question.mainSection.trim() !== '';
        const hasSubSection = typeof question.subSection === 'string' && question.subSection.trim() !== '';
        const hasQuestionText = typeof question.questionText === 'string' && question.questionText.trim() !== '';
        const hasSubSectionIndex = typeof question.subSectionIndex === 'number';

        const isValid = hasId && hasMainSection && hasSubSection && hasQuestionText && hasSubSectionIndex;

        if (!isValid) {
          console.warn('Filtered out invalid question:', JSON.parse(JSON.stringify(question)));
        }
        return isValid;
      });

      console.log(`Number of valid questions after filtering: ${validQuestions.length}`);
      if (validQuestions.length < allQuestions.length) {
        console.warn(`Filtered out ${allQuestions.length - validQuestions.length} invalid or incomplete questions.`);
      }

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
      console.log('Processed mainSections keys from valid questions:', this.mainSections);

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
      console.log('Sorted mainSections:', this.mainSections);

      Object.keys(this.sections).forEach(key => {
        if (this.sections[key]) {
          this.sections[key].sort((a: { name: string, index: number }, b: { name: string, index: number }) => {
            return a.index - b.index;
          });
        }
      });

      this.mainSections.forEach((el, idx) => {
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
}