import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle, faClock, faStop, faTimes, faCheck, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { ProgressService } from '../../services/progress.service';
import { AuthService } from '../../services/auth.service';

/**
 * Generic inactivity warning modal component
 * Shows when:
 * 1. User has been inactive for 10 minutes during a tracked session
 * 2. Auth session is about to expire due to inactivity
 * Auto-closes tracking/logs out if user doesn't respond within 60 seconds
 */
@Component({
  selector: 'app-inactivity-warning-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './inactivity-warning-modal.component.html',
  styleUrls: ['./inactivity-warning-modal.component.scss']
})
export class InactivityWarningModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  countdown = 60;
  modalType: 'progress' | 'auth' = 'progress';
  
  // FontAwesome icons
  faExclamationTriangle = faExclamationTriangle;
  faClock = faClock;
  faStop = faStop;
  faTimes = faTimes;
  faCheck = faCheck;
  faSignOut = faSignOutAlt;
  
  private destroy$ = new Subject<void>();
  private countdownInterval: number | null = null;

  constructor(
    private progressService: ProgressService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setupInactivityWarningListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  /**
   * Setup inactivity warning listener for both progress and auth
   */
  private setupInactivityWarningListener(): void {
    // Listen to both progress and auth inactivity warnings
    combineLatest([
      this.progressService.inactivityWarning$,
      this.authService.sessionExpiryWarning$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([progressWarning, authWarning]) => {
        if (progressWarning) {
          this.isVisible = true;
          this.modalType = 'progress';
          this.startCountdown();
        } else if (authWarning) {
          this.isVisible = true;
          this.modalType = 'auth';
          this.startCountdown();
        } else {
          this.isVisible = false;
          this.clearCountdown();
        }
      });
  }

  /**
   * Start countdown timer
   */
  private startCountdown(): void {
    this.countdown = 60;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        this.clearCountdown();
        // Modal will auto-close via service timeout
      }
    }, 1000);
  }

  /**
   * Clear countdown timer
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Handle extend session button click
   */
  onExtendSession(): void {
    if (this.modalType === 'progress') {
      this.progressService.extendSession();
    } else {
      this.authService.extendAuthSession();
    }
  }

  /**
   * Handle stop tracking button click
   */
  onStopTracking(): void {
    this.progressService.stopTracking();
  }

  /**
   * Handle logout button click
   */
  onLogout(): void {
    this.authService.logOut();
  }

  /**
   * Handle dismiss modal (continue without tracking, close modal)
   */
  onDismiss(): void {
    if (this.modalType === 'progress') {
      this.progressService.dismissInactivityWarning();
    } else {
      // For auth, dismissing means logging out
      this.authService.logOut();
    }
  }

  /**
   * Get countdown display text
   */
  get countdownText(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get urgency class for styling
   */
  get urgencyClass(): string {
    if (this.countdown <= 10) return 'urgent';
    if (this.countdown <= 30) return 'warning';
    return '';
  }
}