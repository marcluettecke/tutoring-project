import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faTimes, faQuestionCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { ProgressService } from '../../services/progress.service';
import { TestService } from '../../services/test.service';
import { CurrentSessionProgress, TestServiceAnswers } from '../../models/progress.model';

/**
 * Simple progress indicator component showing real-time counters
 * Displays questions answered, correct/incorrect counts during tracked sessions
 * Non-intrusive design that doesn't interfere with learning
 */
@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './progress-indicator.component.html',
  styleUrls: ['./progress-indicator.component.scss']
})
export class ProgressIndicatorComponent implements OnInit, OnDestroy {
  currentSession: CurrentSessionProgress | null = null;
  isVisible = false;
  isCollapsed = false;
  isModalMinimized = false;
  
  // FontAwesome icons
  faCheck = faCheck;
  faTimes = faTimes;
  faQuestionCircle = faQuestionCircle;
  faClock = faClock;
  
  private destroy$ = new Subject<void>();
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private progressService: ProgressService,
    private testService: TestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupProgressListener();
    this.setupTestServiceListener();
    this.setupRouteListener();
    this.setupModalMinimizedListener();
    this.updateVisibility();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimeUpdateInterval();
  }

  /**
   * Setup progress service listener
   */
  private setupProgressListener(): void {
    this.progressService.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.currentSession = session;
        this.updateVisibility();
        
        if (this.isVisible) {
          this.startTimeUpdateInterval();
        } else {
          this.clearTimeUpdateInterval();
        }
      });
  }

  /**
   * Setup test service listener for real-time updates
   */
  private setupTestServiceListener(): void {
    // Method placeholder - functionality moved to ngOnInit
  }

  /**
   * Setup route listener to update visibility on navigation
   */
  private setupRouteListener(): void {
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateVisibility();
      });
  }

  /**
   * Setup modal minimized listener to pause time updates
   */
  private setupModalMinimizedListener(): void {
    this.testService.modalMinimized
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMinimized => {
        this.isModalMinimized = isMinimized;
        
        if (isMinimized) {
          // Pause time updates
          this.clearTimeUpdateInterval();
        } else if (this.isVisible) {
          // Resume time updates
          this.startTimeUpdateInterval();
        }
      });
  }

  /**
   * Update component visibility based on route and session state
   */
  private updateVisibility(): void {
    const currentUrl = this.router.url;
    const hiddenRoutes = ['/login', '/admin', '/test', '/results', '/exam-configuration'];
    
    // Hide on certain routes
    const isHiddenRoute = hiddenRoutes.some(route => currentUrl.includes(route));
    
    // Also need active tracking session
    const hasActiveSession = !!(this.currentSession && this.currentSession.isActive && this.progressService.isTrackingEnabled);
    
    this.isVisible = !isHiddenRoute && hasActiveSession;
  }

  /**
   * Update session progress from test service data
   */
  private updateSessionFromTestService(answers: TestServiceAnswers): void {
    if (!this.currentSession || !answers.total) return;

    const totalAnswered = answers.total.correct + answers.total.incorrect;
    const updatedSession: CurrentSessionProgress = {
      ...this.currentSession,
      questionsAnswered: totalAnswered,
      correctAnswers: answers.total.correct,
      incorrectAnswers: answers.total.incorrect
    };

    // Update the progress service with real-time data
    this.progressService.updateSessionProgress(updatedSession);
  }

  /**
   * Toggle collapsed state
   */
  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  /**
   * Get current accuracy percentage
   */
  get accuracyPercentage(): number {
    if (!this.currentSession || this.currentSession.questionsAnswered === 0) return 0;
    return Math.round((this.currentSession.correctAnswers / this.currentSession.questionsAnswered) * 100);
  }

  /**
   * Get elapsed time in readable format
   */
  get elapsedTimeText(): string {
    if (!this.currentSession) return '0:00';
    
    const elapsed = this.progressService.getElapsedTime(this.currentSession.startTime);
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get section display text
   */
  get sectionText(): string {
    if (!this.currentSession) return '';
    
    const main = this.currentSession.mainSection;
    const sub = this.currentSession.subSection;
    
    if (sub) {
      return `${this.getSectionDisplayName(main)} - ${sub}`;
    }
    return this.getSectionDisplayName(main);
  }

  /**
   * Get section display name
   */
  private getSectionDisplayName(section: string): string {
    const displayNames: { [key: string]: string } = {
      'administrativo': 'Admin',
      'medio ambiente': 'Medio Amb.',
      'costas': 'Costas',
      'aguas': 'Aguas'
    };
    return displayNames[section] || section;
  }

  /**
   * Get performance indicator class
   */
  get performanceClass(): string {
    const accuracy = this.accuracyPercentage;
    if (accuracy >= 80) return 'excellent';
    if (accuracy >= 60) return 'good';
    if (accuracy >= 40) return 'average';
    return 'needs-improvement';
  }

  /**
   * Start time update interval
   */
  private startTimeUpdateInterval(): void {
    this.clearTimeUpdateInterval();
    
    // Update time every second
    this.timeUpdateInterval = setInterval(() => {
      // Force change detection for elapsed time
      // This will update the elapsedTimeText getter
    }, 1000);
  }

  /**
   * Clear time update interval
   */
  private clearTimeUpdateInterval(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }
}