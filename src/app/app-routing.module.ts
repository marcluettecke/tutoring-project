import {Routes} from '@angular/router';
import {HomeComponent} from "./views/home/home.component";
import {LoginComponent} from "./views/login/login.component";
import {AdminPanelComponent} from "./views/admin-panel/admin-panel.component";
import {AdminGuard} from "./guards/admin-guard.guard";
import {AuthGuard, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {TestComponent} from "./views/test/test.component";
import {ResultsComponent} from "./views/results/results.component";
import {ExamConfigurationComponent} from "./views/exam-configuration/exam-configuration";

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
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [AdminGuard, AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  // Catch-all route - redirect to login for any undefined routes
  {path: '**', redirectTo: 'login'}
];

export { routes };
