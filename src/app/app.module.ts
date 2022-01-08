import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { AddQuestionComponent } from './views/add-question/add-question.component';
import { QuestionCardComponent } from './components/question-card/question-card.component';
import { AnswerOptionComponent } from './components/answer-option/answer-option.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { AngularFireAuthGuardModule} from "@angular/fire/compat/auth-guard";
import { ErrorSnackbarComponent } from './components/error-snackbar/error-snackbar.component';
import { InfoSnackbarComponent } from './components/info-snackbar/info-snackbar.component';
import { TestComponent } from './views/test/test.component';
import { TestCardComponent } from './components/test-card/test-card.component';

@NgModule({
            declarations: [
              AppComponent,
              HeaderComponent,
              HomeComponent,
              LoginComponent,
              AddQuestionComponent,
              QuestionCardComponent,
              AnswerOptionComponent,
              SideNavComponent,
              ErrorSnackbarComponent,
              InfoSnackbarComponent,
              TestComponent,
              TestCardComponent
            ],
            imports: [
              BrowserModule,
              AppRoutingModule,
              FormsModule,
              AngularFireModule.initializeApp(environment.firebase),
              FontAwesomeModule,
              ReactiveFormsModule,
              AngularFireAuthGuardModule
            ],
            providers: [],
            bootstrap: [AppComponent]
          })
export class AppModule {
};
