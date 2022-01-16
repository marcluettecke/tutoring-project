import {Component, Output, OnInit, EventEmitter} from '@angular/core';
import {TestService} from "../../services/test.service";

@Component({
             selector: 'app-result-modal',
             templateUrl: './result-modal.component.html',
             styleUrls: ['./result-modal.component.scss']
           })
export class ResultModalComponent implements OnInit {
  @Output() onCloseClick: EventEmitter<any> = new EventEmitter()
  correctAnswers: { [key: string]: { blank: number, correct: number, incorrect: number } }

  constructor(private testService: TestService) {
  }

  ngOnInit(): void {
    this.correctAnswers = this.testService.correctAnswers
  }

  handleCloseClick() {
    this.onCloseClick.emit()
  }
}
