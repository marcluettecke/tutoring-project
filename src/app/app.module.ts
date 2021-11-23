import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { SignupComponent } from './views/signup/signup.component';
import { AddQuestionComponent } from './views/add-question/add-question.component';
import { QuestionCardComponent } from './components/question-card/question-card.component';
import { AnswerOptionComponent } from './components/answer-option/answer-option.component';
import {FormsModule} from "@angular/forms";
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
            declarations: [
              AppComponent,
              HeaderComponent,
              HomeComponent,
              LoginComponent,
              SignupComponent,
              AddQuestionComponent,
              QuestionCardComponent,
              AnswerOptionComponent
            ],
            imports: [
              BrowserModule,
              AppRoutingModule,
              FormsModule,
              AngularFireModule.initializeApp(environment.firebase),
              FontAwesomeModule
            ],
            providers: [],
            bootstrap: [AppComponent]
          })
export class AppModule {
};
