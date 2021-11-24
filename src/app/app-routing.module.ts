import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {SignupComponent} from "./views/signup/signup.component";
import {AddQuestionComponent} from "./views/add-question/add-question.component";

const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'addQuestion', component: AddQuestionComponent},
  {path: '', component: AddQuestionComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
