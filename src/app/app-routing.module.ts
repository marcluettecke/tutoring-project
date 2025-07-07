import {Routes} from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {AddQuestionComponent} from "./views/add-question/add-question.component";
import {AdminGuard} from "./guards/admin-guard.guard";
import {AuthGuard, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {TestComponent} from "./views/test/test.component";

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: 'test', component: TestComponent},
  {path: 'login', component: LoginComponent},
  {
    path: 'addQuestion',
    component: AddQuestionComponent,
    canActivate: [AdminGuard, AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];

export { routes };
