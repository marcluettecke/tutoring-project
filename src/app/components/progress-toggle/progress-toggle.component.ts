import { Component, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartLine, faSync } from '@fortawesome/free-solid-svg-icons';
import { ProgressService } from '../../services/progress.service';
import { TestService } from '../../services/test.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CurrentSessionProgress } from '../../models/progress.model';
import { ResultModalComponent } from '../result-modal/result-modal.component';

/**
 * Global progress tracking toggle component
 * Allows users to enable/disable session tracking from anywhere in the app
 * Hidden in admin areas and during test exams
 */
@Component({
  selector: 'app-progress-toggle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, ResultModalComponent],
  templateUrl: './progress-toggle.component.html',
  styleUrls: ['./progress-toggle.component.scss']
})
export class ProgressToggleComponent implements OnInit, OnDestroy {
  @Output() sessionEnded = new EventEmitter<CurrentSessionProgress>();
  
  isTrackingEnabled = false;
  isVisible = true;
  currentUserId: string | null = null;
  showSessionSummary = false;
  lastSession: CurrentSessionProgress | null = null;
  
  // FontAwesome icons
  faChartLine = faChartLine;
  faSync = faSync;
  
  private destroy$ = new Subject<void>();

  constructor(
    private progressService: ProgressService,
    private testService: TestService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupAuthListener();
    this.setupRouteListener();
    this.setupProgressListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup authentication state listener
   */
  private setupAuthListener(): void {
    this.authService.loginChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUserId = user?.uid || null;
        this.updateVisibility();
      });
  }

  /**
   * Setup route listener to hide toggle in admin areas and test exams
   */
  private setupRouteListener(): void {
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateVisibility();
      });
  }

  /**
   * Setup progress tracking state listener
   */
  private setupProgressListener(): void {
    this.progressService.isTrackingEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isEnabled => {
        this.isTrackingEnabled = isEnabled;
      });
  }

  /**
   * Update component visibility based on current route and user state
   */
  private updateVisibility(): void {
    const currentUrl = this.router.url;
    const hiddenRoutes = ['/addQuestion', '/test', '/results'];
    
    // Hide if user is not authenticated
    if (!this.currentUserId) {
      this.isVisible = false;
      return;
    }
    
    // Hide in admin areas, test exams, and data analysis
    this.isVisible = !hiddenRoutes.some(route => currentUrl.includes(route));
  }

  /**
   * Toggle progress tracking on/off
   */
  async toggleTracking(): Promise<void> {
    if (!this.currentUserId) return;

    if (this.isTrackingEnabled) {
      const currentSession = this.progressService.getCurrentSessionProgress();
      if (currentSession && currentSession.questionsAnswered > 0) {
        this.lastSession = currentSession;
        this.showSessionSummary = true;
      }
      await this.progressService.stopTracking();
      
      // Reset all questions when stopping tracking for a clean slate
      this.testService.resetAllAnswers();
    } else {
      this.showSessionSummary = false;
      this.progressService.startTracking(this.currentUserId);
    }
  }

  /**
   * Close session summary
   */
  closeSummary(): void {
    this.showSessionSummary = false;
    this.lastSession = null;
  }

  /**
   * Reset all answered questions to unanswered state
   */
  resetAllAnswers(): void {
    this.testService.resetAllAnswers();
    
    // If tracking is enabled, also reset the current session
    if (this.isTrackingEnabled && this.currentUserId) {
      this.progressService.startTracking(this.currentUserId);
    }
  }

  /**
   * Get tooltip text based on tracking state
   */
  get tooltipText(): string {
    return this.isTrackingEnabled 
      ? 'Desactivar seguimiento de progreso' 
      : 'Activar seguimiento de progreso';
  }

  /**
   * Get toggle button text
   */
  get toggleText(): string {
    return this.isTrackingEnabled ? 'Seguimiento ON' : 'Seguimiento OFF';
  }

  /**
   * Format time elapsed into readable format
   */
  formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}