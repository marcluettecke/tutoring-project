import {Routes} from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {AddQuestionComponent} from "./views/add-question/add-question.component";
import {AdminGuard} from "./guards/admin-guard.guard";
import {AuthGuard, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {TestComponent} from "./views/test/test.component";
import {ResultsComponent} from "./views/results/results.component";
import {ExamConfigurationComponent} from "./views/exam-configuration/exam-configuration";
import {DataMigrationComponent} from "./views/data-migration/data-migration.component";

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {
    path: 'exam-configuration',
    component: ExamConfigurationComponent,
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {
    path: 'test', 
    component: TestComponent,
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {
    path: 'results',
    component: ResultsComponent,
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: 'login', component: LoginComponent},
  {
    path: 'addQuestion',
    component: AddQuestionComponent,
    canActivate: [AdminGuard, AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {
    path: 'data-migration',
    component: DataMigrationComponent,
    canActivate: [AdminGuard, AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];

export { routes };
