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
  isPausedForModal = false; // Track if we're paused just for showing the modal
  
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
    const hiddenRoutes = ['/login', '/addQuestion', '/test', '/results', '/exam-configuration'];
    
    // Hide if user is not authenticated
    if (!this.currentUserId) {
      this.isVisible = false;
      return;
    }
    
    // Hide in admin areas, test exams, data analysis, and login page
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
        this.isPausedForModal = true; // Remember we're just paused for modal
        // Temporarily pause tracking but don't update UI state yet
        // The UI will update based on user's choice in the modal
        await this.progressService.stopTracking();
      } else {
        // No session data, just stop tracking
        await this.progressService.stopTracking();
      }
    } else {
      this.showSessionSummary = false;
      // When starting fresh tracking, always reset to ensure clean state
      this.testService.resetAllAnswers();
      this.progressService.startTracking(this.currentUserId, false); // false = don't preserve answers (already reset)
    }
  }

  /**
   * Handle modal close (X button or outside click)
   * This truly ends the session and clears all state
   */
  handleModalClose(): void {
    this.showSessionSummary = false;
    this.lastSession = null;
    this.isPausedForModal = false;
    
    // End the session completely and clear all state
    if (this.currentUserId) {
      this.progressService.endTrackingSession();
      // Clear all answered questions since user chose to close without saving
      this.testService.resetAllAnswers();
    }
  }

  /**
   * Handle retry button click
   * Starts a new session with cleared answers
   */
  handleModalRetry(): void {
    this.showSessionSummary = false;
    this.lastSession = null;
    this.isPausedForModal = false;
    
    if (this.currentUserId) {
      // End the current session completely
      this.progressService.endTrackingSession();
      // Reset answers for retry
      this.testService.resetAllAnswers();
      // Start fresh tracking session
      this.progressService.startTracking(this.currentUserId, false);
    }
  }

  /**
   * Handle continue button click
   * Resumes the existing session
   */
  handleModalContinue(): void {
    this.showSessionSummary = false;
    this.isPausedForModal = false;
    
    if (this.currentUserId) {
      // Just resume tracking - don't start a new session
      // The session is already paused, we just need to re-enable tracking
      this.progressService.resumeTracking();
      
    }
    
    this.lastSession = null;
  }

  /**
   * Reset all answered questions to unanswered state
   */
  resetAllAnswers(): void {
    this.testService.resetAllAnswers();
    
    // If tracking is enabled, also reset the current session
    if (this.isTrackingEnabled && this.currentUserId) {
      this.progressService.startTracking(this.currentUserId, false); // false = don't preserve answers (already reset)
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