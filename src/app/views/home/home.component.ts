import { Component, OnInit } from '@angular/core';
import {QuestionsService} from "../../services/questions.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  questions: any;
  constructor(private questionService: QuestionsService) { }


  ngOnInit(): void {
    this.questions = this.questionService.getQuestions()
  }

}
