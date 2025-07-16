import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { ProgressToggleComponent } from './components/progress-toggle/progress-toggle.component';
import { ProgressIndicatorComponent } from './components/progress-indicator/progress-indicator.component';
import { InactivityWarningModalComponent } from './components/inactivity-warning-modal/inactivity-warning-modal.component';
import { NavigationWarningModalComponent } from './components/navigation-warning-modal/navigation-warning-modal.component';
import { ProgressService } from './services/progress.service';
import { NavigationGuardService } from './services/navigation-guard.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent,
    ProgressToggleComponent,
    ProgressIndicatorComponent,
    InactivityWarningModalComponent,
    NavigationWarningModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'tutoring-project';

  showNavigationWarning = false;
  navigationWarningData: {
    sessionType: 'progress' | 'exam';
    questionsAnswered: number;
    correctAnswers: number;
    timeElapsed: number;
  } | null = null;
  pendingNavigation: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private progressService: ProgressService,
    private navigationGuard: NavigationGuardService
  ) {}

  ngOnInit(): void {
    // Initialize progress tracking state from localStorage
    this.progressService.initializeTrackingState();

    // Subscribe to navigation warning modal state
    this.navigationGuard.showWarningModal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(show => {
        this.showNavigationWarning = show;
      });

    // Subscribe to warning data
    this.navigationGuard.warningData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.navigationWarningData = data;
      });

    // Subscribe to pending navigation
    this.navigationGuard.pendingNavigation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(route => {
        this.pendingNavigation = route;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle save and navigate action from modal
   */
  async onSaveAndNavigate(targetRoute: string): Promise<void> {
    await this.navigationGuard.handleSaveAndNavigate(targetRoute);
  }

  /**
   * Handle discard and navigate action from modal
   */
  async onDiscardAndNavigate(targetRoute: string): Promise<void> {
    await this.navigationGuard.handleDiscardAndNavigate(targetRoute);
  }

  /**
   * Handle cancel navigation action from modal
   */
  onCancelNavigation(): void {
    this.navigationGuard.handleCancelNavigation();
  }
}
