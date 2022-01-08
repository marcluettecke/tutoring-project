import {Component, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question.model";

@Component({
             selector: 'app-test',
             templateUrl: './test.component.html',
             styleUrls: ['./test.component.scss']
           })
export class TestComponent implements OnInit {
  questions: Question[] = []
  filteredQuestions: Question[] = []
  errorMessage = ''

  constructor(private questionsService: QuestionsService) {
  }

  ngOnInit(): void {
    this.questionsService.getQuestions().subscribe(questions => {
                                                     this.questions = questions
                                                     this.filterQuestions()
                                                   },
                                                   error => {
                                                     this.errorMessage = error
                                                   })
  }

  filterQuestions() {
    for (const mainSection of ['administrativo', 'medio ambiente', 'costas', 'aguas']) {
      const questionPerSection = this.questions.filter(el => el.mainSection === mainSection)
      // find how many questions per mainSection exist
      const maxFilter = questionPerSection.length
      const indices = Array(maxFilter).fill(1).map((_, index) => index + 1);
      indices.sort(() => Math.random() - 0.5);

      for (const index of indices.slice(0, 25)) {
        this.filteredQuestions.push(questionPerSection[index])
      }
    }
    // shuffle the resulting questions
    this.filteredQuestions.sort(() => Math.random() - 0.5)
  }

}
