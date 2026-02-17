import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {NgClass} from "@angular/common";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {faCheck, faTimes} from "@fortawesome/free-solid-svg-icons";
@Component({
  selector: 'app-answer-option',
  standalone: true,
  imports: [NgClass, FontAwesomeModule],
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

  // Font Awesome icons
  faCheck = faCheck;
  faTimes = faTimes;

  constructor() {
    // Constructor for dependency injection
  }

  ngOnInit(): void {
    // Lifecycle hook - no initialization needed
  }

  clickAnswer() {
    this.answerWasclickedEvent.emit()
  }

}
