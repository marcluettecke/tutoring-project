import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProgressService } from './progress.service';
import { TestService } from './test.service';
import { Router } from '@angular/router';

/**
 * Service to manage navigation warnings and prevent data loss
 * during active sessions or exams
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationGuardService {
  private showWarningModalSubject = new BehaviorSubject<boolean>(false);
  public showWarningModal$ = this.showWarningModalSubject.asObservable();

  private pendingNavigationSubject = new BehaviorSubject<string | null>(null);
  public pendingNavigation$ = this.pendingNavigationSubject.asObservable();

  private warningDataSubject = new BehaviorSubject<{
    sessionType: 'progress' | 'exam';
    questionsAnswered: number;
    correctAnswers: number;
    timeElapsed: number;
  } | null>(null);
  public warningData$ = this.warningDataSubject.asObservable();

  constructor(
    private progressService: ProgressService,
    private testService: TestService,
    private router: Router
  ) {}

  /**
   * Checks for active sessions and displays warning modal if navigation would cause data loss
   * @param targetRoute The route the user is attempting to navigate to
   * @returns True if navigation should proceed, false if blocked by warning modal
   */
  checkActiveSession(targetRoute: string): boolean {
    const currentProgressSession = this.progressService.getCurrentSessionProgress();
    if (currentProgressSession && currentProgressSession.isActive && currentProgressSession.questionsAnswered > 0) {
      this.showNavigationWarning('progress', targetRoute, {
        questionsAnswered: currentProgressSession.questionsAnswered,
        correctAnswers: currentProgressSession.correctAnswers,
        timeElapsed: currentProgressSession.timeElapsed
      });
      return false;
    }

    const currentRoute = this.router.url;
    if (currentRoute.includes('/test')) {
      const testAnswers = this.testService.getTestAnswers();
      const totalAnswered = Object.values(testAnswers).reduce((sum, section) => {
        return sum + section.correct + section.incorrect;
      }, 0);

      if (totalAnswered > 0) {
        const totalCorrect = Object.values(testAnswers).reduce((sum, section) => {
          return sum + section.correct;
        }, 0);

        this.showNavigationWarning('exam', targetRoute, {
          questionsAnswered: totalAnswered,
          correctAnswers: totalCorrect,
          timeElapsed: 0
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Show navigation warning modal
   */
  private showNavigationWarning(
    sessionType: 'progress' | 'exam',
    targetRoute: string,
    sessionData: {
      questionsAnswered: number;
      correctAnswers: number;
      timeElapsed: number;
    }
  ): void {
    this.warningDataSubject.next({
      sessionType,
      ...sessionData
    });
    this.pendingNavigationSubject.next(targetRoute);
    this.showWarningModalSubject.next(true);
  }

  /**
   * Handle save and navigate action
   */
  async handleSaveAndNavigate(targetRoute: string): Promise<void> {
    const currentSession = this.progressService.getCurrentSessionProgress();
    
    if (currentSession && currentSession.isActive) {
      try {
        // Save the current progress session
        await this.progressService.saveProgressSessionToFirebase(currentSession);
        
        // Stop tracking
        await this.progressService.stopTracking();
        
        // Navigate to target route
        this.proceedWithNavigation(targetRoute);
      } catch (error) {
        console.error('Error saving session before navigation:', error);
        // Still allow navigation but log the error
        this.proceedWithNavigation(targetRoute);
      }
    } else {
      this.proceedWithNavigation(targetRoute);
    }
  }

  /**
   * Handle discard and navigate action
   */
  async handleDiscardAndNavigate(targetRoute: string): Promise<void> {
    // Stop tracking without saving for progress sessions
    if (this.progressService.isTrackingEnabled) {
      await this.progressService.stopTracking();
    }
    
    // Reset test answers for exam sessions
    const currentRoute = this.router.url;
    if (currentRoute.includes('/test')) {
      this.testService.resetAllAnswers();
    }
    
    this.proceedWithNavigation(targetRoute);
  }

  /**
   * Handle cancel navigation action
   */
  handleCancelNavigation(): void {
    this.hideWarningModal();
  }

  /**
   * Hide the warning modal
   */
  hideWarningModal(): void {
    this.showWarningModalSubject.next(false);
    this.pendingNavigationSubject.next(null);
    this.warningDataSubject.next(null);
  }

  /**
   * Proceed with navigation
   */
  private proceedWithNavigation(targetRoute: string): void {
    this.hideWarningModal();
    this.router.navigateByUrl(targetRoute);
  }

  /**
   * Get current warning data
   */
  getCurrentWarningData() {
    return this.warningDataSubject.value;
  }

  /**
   * Get pending navigation route
   */
  getPendingNavigation(): string | null {
    return this.pendingNavigationSubject.value;
  }
}