import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {faAngleDoubleLeft} from "@fortawesome/free-solid-svg-icons";
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question";

@Component({
             selector: 'app-side-nav',
             templateUrl: './side-nav.component.html',
             styleUrls: ['./side-nav.component.scss']
           })
export class SideNavComponent implements OnInit {
  sections: { [id: string]: string[] } = {}
  mainSections: string[] = []
  isExpanded: { [id: number]: boolean } = {}
  faAngleDoubleLeft = faAngleDoubleLeft
  open = true;
  sectionOrderEnum: { [key: string]: number } = {
    'administrativo': 1,
    'medio ambiente': 2,
    'costas': 3,
    'aguas': 4
  }
  @Input() activeSection: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number }
  @Output() clickEmit: EventEmitter<{ mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number }> = new EventEmitter()
  @Output() expandSidebarEmit: EventEmitter<boolean> = new EventEmitter<boolean>()

  constructor(private questionService: QuestionsService) {
  }

  ngOnInit(): void {
    // create observable with list of questions
    const questions$ = this.questionService.getQuestions()
    questions$.subscribe((questions: any) => {
      questions.map((question: Question) => {
        // if main section is not present create new one with main section as key and subsections as only array entry
        if (!(question.mainSection in this.sections)) {
          this.sections[question.mainSection] = [question.subSection]
        } else {
          // if main section exists as key we have to check whether subsection exists in value array or not
          if (!this.sections[question.mainSection].includes(question.subSection)) {
            this.sections[question.mainSection].push(question.subSection)
          }
        }
      })
      this.mainSections = Object.keys(this.sections)
      // sort according to Jose's order
      this.mainSections.sort((a, b) => {
        return this.sectionOrderEnum[a] - this.sectionOrderEnum[b]
      })
      // collapse all subheaders on init
      this.mainSections.map((el, idx) => {
        this.isExpanded[idx] = idx === 0;
      })
    })
  }

  clickHandlerMainList(index: number) {
    if (this.activeSection.mainSectionNumber !== index + 1) {
      this.isExpanded[index] = !this.isExpanded[index]
    }
  }

  clickHandlerSublist(mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number) {
    this.clickEmit.emit({mainSection, subSection, mainSectionNumber, subSectionNumber})
  }

  iconClickHandler() {
    this.open = !this.open
    this.expandSidebarEmit.emit(this.open)
  }

}
