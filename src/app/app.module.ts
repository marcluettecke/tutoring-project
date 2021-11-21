import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { SignupComponent } from './views/signup/signup.component';
import { AddQuestionComponent } from './views/add-question/add-question.component';

@NgModule({
            declarations: [
              AppComponent,
              HeaderComponent,
              HomeComponent,
              LoginComponent,
              SignupComponent,
              AddQuestionComponent
            ],
            imports: [
              BrowserModule,
              AppRoutingModule
            ],
            providers: [],
            bootstrap: [AppComponent]
          })
export class AppModule {
};
