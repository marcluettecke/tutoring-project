import {Component, OnDestroy, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {Question} from "../../models/question.model";
import {TestService} from "../../services/test.service";
import {Subscription} from "rxjs";
import {QUESTIONWEIGHTS} from './constants';
import {ResultModalComponent} from '../../components/result-modal/result-modal.component';
import {TestCardComponent} from '../../components/test-card/test-card.component';
import {TimerComponent} from '../../components/timer/timer.component';
import {ErrorSnackbarComponent} from '../../components/error-snackbar/error-snackbar.component';

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


  constructor(private questionsService: QuestionsService, private testService: TestService) {
  }

  ngOnInit(): void {
    this.questionSubscription = this.questionsService.getQuestions().subscribe(questions => {
                                                                                 this.questions = questions
                                                                                 this.filterQuestions()
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

    for (const mainSection of ['administrativo', 'medio ambiente', 'costas', 'aguas']) {
      const questionPerSection = this.questions.filter(el => el.mainSection === mainSection)
      // find how many questions per mainSection exist
      const maxFilter = questionPerSection.length
      const indices = Array(maxFilter).fill(1).map((_, index) => index + 1);
      indices.sort(() => Math.random() - 0.5);


      for (const index of indices.slice(0, QUESTIONWEIGHTS[mainSection])) {
        // console.log(indices.slice(0, questionWeights[mainSection]))
        this.filteredQuestions.push(questionPerSection[index])
      }
    }
  }

  openModal() {
    this.modalOpen = true
  }

  closeModal() {
    this.modalOpen = false;
  }

  ngOnDestroy() {
    this.questionSubscription.unsubscribe()
    this.testStatusSubscription.unsubscribe()
  }

}
