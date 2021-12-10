import {Component, OnInit} from '@angular/core';
import {QuestionsService} from "../../services/questions.service";
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Question} from "../../models/question";
import {MAINSECTIONS, SUBSECTIONS, SUBSECTIONINTERFACE} from "../../constants/sections";

@Component({
             selector: 'app-add-question',
             templateUrl: './add-question.component.html',
             styleUrls: ['./add-question.component.scss']
           })
export class AddQuestionComponent implements OnInit {
  currentQuestionLength: number
  mainSections: string[] = MAINSECTIONS
  subsections: SUBSECTIONINTERFACE = SUBSECTIONS

  newQuestionForm =
    new FormGroup({
                    questionText: new FormControl('', [Validators.required]),
                    answers: new FormGroup({
                                             answer1: new FormControl('', [Validators.required]),
                                             answer2: new FormControl('', [Validators.required]),
                                             answer3: new FormControl('', [Validators.required]),
                                             answer4: new FormControl('', [Validators.required])
                                           }
                    ),
                    explanation: new FormControl('', [Validators.required]),
                    correctAnswer: new FormControl('', [Validators.required]),
                    mainSection: new FormControl('', [Validators.required]),
                    subSection: new FormControl('', [Validators.required]),
                  })
  currentSubsection: {name: string, index: number}[] | null = null

  constructor(private questionService: QuestionsService) {
  }

  get question(): AbstractControl {
    return this.newQuestionForm.get('questionText') as AbstractControl;
  }

  get correctAnswer(): AbstractControl {
    return this.newQuestionForm.get('correctAnswer') as AbstractControl;
  }

  get explanation(): AbstractControl {
    return this.newQuestionForm.get('explanation') as AbstractControl;
  }

  get mainSection(): AbstractControl {
    return this.newQuestionForm.get('mainSection') as AbstractControl;
  }

  get subSection(): AbstractControl {
    return this.newQuestionForm.get('subSection') as AbstractControl;
  }


  checkAnswerProperty(number: number) {
    return this.newQuestionForm.get(['answers', `answer${number}`]) as AbstractControl;
  }

  ngOnInit(): void {
    this.questionService.getQuestions().subscribe(questions => this.currentQuestionLength = questions.length)
  }

  findId() {
    return `q${this.currentQuestionLength + 1}`
  }
  findIdNumeric() {
    return this.currentQuestionLength + 1
  }


  subsectionChangeHandler(){
    this.currentSubsection = this.subsections[<'administrativo' | 'costas' | 'medio ambiente' | 'aguas'>this.newQuestionForm.value.mainSection]
    console.log(this.currentSubsection)
  }

  onSubmit() {
    const subSectionIndex = this.currentSubsection!.filter(el => {
      return el.name === this.newQuestionForm.value.subSection
    })[0].index
    const newQuestion: Question = {
      id: this.findId(),
      questionText: this.newQuestionForm.value.questionText,
      questionIndex: +this.findId(),
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
      subSectionIndex: subSectionIndex

    }
    this.questionService.addQuestion(newQuestion)
    this.newQuestionForm.reset()
  }

}
