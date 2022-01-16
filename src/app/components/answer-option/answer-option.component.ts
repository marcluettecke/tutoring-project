import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-answer-option',
  templateUrl: './answer-option.component.html',
  styleUrls: ['./answer-option.component.scss']
})
export class AnswerOptionComponent implements OnInit {
  @Input() answerOption: string;
  @Input() name: number;
  @Input() id: string;
  @Input() isCorrect: boolean;
  @Input() clicked: boolean;
  @Input() testFinished: boolean;
  @Input() selectedAnswer: string;
  @Input() disabled: boolean;

  @Output() answerWasclickedEvent = new EventEmitter<string>()

  constructor() { }

  ngOnInit(): void {
  }

  clickAnswer() {
    this.answerWasclickedEvent.emit()
  }

}
