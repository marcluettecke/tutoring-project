import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {SignupComponent} from "./views/signup/signup.component";
import {AddQuestionComponent} from "./views/add-question/add-question.component";
import {AdminGuard} from "./guards/admin-guard.guard";
import {LoggedinGuard} from "./guards/loggedin.guard";

const routes: Routes = [
  {path: 'home', component: HomeComponent, canActivate: [LoggedinGuard]},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent, canActivate: [AdminGuard]},
  {path: 'addQuestion', component: AddQuestionComponent, canActivate: [AdminGuard]},
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
