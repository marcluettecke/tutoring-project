import {Component, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question";

@Component({
             selector: 'app-home',
             templateUrl: './home.component.html',
             styleUrls: ['./home.component.scss']
           })
export class HomeComponent implements OnInit {
  questions: Question[];
  activeSection: { mainSection: string, subSection: string, mainSectionNumber: number, subSectionNumber: number } = {
    mainSection: 'administrativo',
    subSection: 'general',
    mainSectionNumber: 1,
    subSectionNumber: 1
  }

  constructor(private questionService: QuestionsService) {
  }


  ngOnInit(): void {
    this.updateData()
  }

  updateData() {
    this.questionService.getQuestions().subscribe((response: any) => {
      this.questions = response.filter((el: Question) => {
        return el.mainSection === this.activeSection.mainSection && el.subSection === this.activeSection.subSection
      })
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

}
