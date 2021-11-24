import {Component, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {FormControl, FormGroup} from '@angular/forms';
import {Question} from "../../models/question";

@Component({
             selector: 'app-add-question',
             templateUrl: './add-question.component.html',
             styleUrls: ['./add-question.component.scss']
           })
export class AddQuestionComponent implements OnInit {
  currentQuestionLength: number
  newQuestionForm =
    new FormGroup({
                    questionText: new FormControl(''),
                    answers: new FormGroup({
                                             answer1: new FormControl(''),
                                             answer2: new FormControl(''),
                                             answer3: new FormControl(''),
                                             answer4: new FormControl('')
                                           }
                    ),
                    explanation: new FormControl(''),
                    correctAnswer: new FormControl(''),
                    mainSection: new FormControl(''),
                    subSection: new FormControl(''),
                  })

  constructor(private questionService: QuestionsService) {
  }

  ngOnInit(): void {
    this.questionService.getQuestions().subscribe(questions => this.currentQuestionLength = questions.length)
  }

  findId() {
    return `q${this.currentQuestionLength + 1}`
  }

  onSubmit() {
    const newQuestion: Question = {
      id: this.findId(),
      questionText: this.newQuestionForm.value.questionText,
      answers: [
        {
          id: `${this.findId()}-a1`,
          text: this.newQuestionForm.get(['answers', 'answer1'])?.value
        },
        {
          id: `${this.findId()}-a2`,
          text: this.newQuestionForm.get(['answers', 'answer2'])?.value
        },
        {
          id: `${this.findId()}-a3`,
          text: this.newQuestionForm.get(['answers', 'answer3'])?.value
        },
        {
          id: `${this.findId()}-a4`,
          text: this.newQuestionForm.get(['answers', 'answer4'])?.value
        }
      ],
      correctAnswer: `${this.findId()}-a${this.newQuestionForm.value.correctAnswer}`,
      explanation: this.newQuestionForm.value.explanation,
      mainSection: this.newQuestionForm.value.mainSection,
      subSection: this.newQuestionForm.value.subSection,

    }
    this.questionService.addQuestion(newQuestion)
  }

}
