import { Component, OnInit } from '@angular/core';
import {Question} from '../../models/question'
import {QuestionsService} from "../../services/questions.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  questions: Question[]
  constructor(private questionService: QuestionsService) { }

  ngOnInit(): void {
    this.questions = this.questionService.questions
  }

}
