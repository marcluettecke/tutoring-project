import { Component, OnInit } from '@angular/core';
import {faAngleDoubleLeft, faAngleDoubleRight} from "@fortawesome/free-solid-svg-icons";
import {QuestionsService} from "../../services/questions.service";
import {map} from "rxjs/operators";
import {Question} from "../../models/question";

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
  mainSections: string[] = []
  // mainSections = ['Administrativo', 'Medio ambiente', 'Costas', 'Aguas']
  faAngleDoubleLeft = faAngleDoubleLeft
  faAngleDoubleRight = faAngleDoubleRight
  open = true;
  constructor(private questionService: QuestionsService) { }

  ngOnInit(): void {
    // create observable with list of questions
    const sections$ = this.questionService.getQuestions()

    sections$.subscribe((sections: any) => {
      sections.map((section: Question) => {
        // find unique main sections - no duplicates
        if(!this.mainSections.includes(section.mainSection)) {
          this.mainSections.push(section.mainSection)
        }
      })
    })
    console.log(this.mainSections)
  }

}
