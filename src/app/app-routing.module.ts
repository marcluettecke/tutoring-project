import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {AddQuestionComponent} from "./views/add-question/add-question.component";
import {AdminGuard} from "./guards/admin-guard.guard";
import {AngularFireAuthGuard, redirectUnauthorizedTo} from '@angular/fire/compat/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AngularFireAuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: 'login', component: LoginComponent},
  {
    path: 'addQuestion',
    component: AddQuestionComponent,
    canActivate: [AdminGuard, AngularFireAuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];

@NgModule({
            imports: [RouterModule.forRoot(routes)],
            exports: [RouterModule]
          })
export class AppRoutingModule {
}
