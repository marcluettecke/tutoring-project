import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle, faClock, faStop, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ProgressService } from '../../services/progress.service';

/**
 * Inactivity warning modal component
 * Shows when user has been inactive for 10 minutes during a tracked session
 * Auto-closes tracking if user doesn't respond within 60 seconds
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
  
  // FontAwesome icons
  faExclamationTriangle = faExclamationTriangle;
  faClock = faClock;
  faStop = faStop;
  faTimes = faTimes;
  
  private destroy$ = new Subject<void>();
  private countdownInterval: number | null = null;

  constructor(private progressService: ProgressService) {}

  ngOnInit(): void {
    this.setupInactivityWarningListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  /**
   * Setup inactivity warning listener
   */
  private setupInactivityWarningListener(): void {
    this.progressService.inactivityWarning$
      .pipe(takeUntil(this.destroy$))
      .subscribe(showWarning => {
        this.isVisible = showWarning;
        
        if (showWarning) {
          this.startCountdown();
        } else {
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
    this.progressService.extendSession();
  }

  /**
   * Handle stop tracking button click
   */
  onStopTracking(): void {
    this.progressService.stopTracking();
  }

  /**
   * Handle dismiss modal (continue without tracking, close modal)
   */
  onDismiss(): void {
    this.progressService.dismissInactivityWarning();
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