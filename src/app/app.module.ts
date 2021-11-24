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
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideNavComponent } from './components/side-nav/side-nav.component';

@NgModule({
            declarations: [
              AppComponent,
              HeaderComponent,
              HomeComponent,
              LoginComponent,
              SignupComponent,
              AddQuestionComponent,
              QuestionCardComponent,
              AnswerOptionComponent,
              SideNavComponent
            ],
            imports: [
              BrowserModule,
              AppRoutingModule,
              FormsModule,
              AngularFireModule.initializeApp(environment.firebase),
              FontAwesomeModule,
              ReactiveFormsModule
            ],
            providers: [],
            bootstrap: [AppComponent]
          })
export class AppModule {
};
