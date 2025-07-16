import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faExclamationTriangle, 
  faChartLine, 
  faCheckCircle, 
  faClock, 
  faFileAlt, 
  faSave, 
  faTrash, 
  faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';

/**
 * Modal component that warns users about navigating away from active sessions
 * Provides options to save progress, discard, or cancel navigation
 */
@Component({
  selector: 'app-navigation-warning-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './navigation-warning-modal.component.html',
  styleUrls: ['./navigation-warning-modal.component.scss']
})
export class NavigationWarningModalComponent {
  @Input() sessionType: 'progress' | 'exam' = 'progress';
  @Input() questionsAnswered: number = 0;
  @Input() correctAnswers: number = 0;
  @Input() timeElapsed: number = 0;
  @Input() targetRoute: string = '';

  @Output() saveAndNavigate = new EventEmitter<string>();
  @Output() discardAndNavigate = new EventEmitter<string>();
  @Output() cancelNavigation = new EventEmitter<void>();

  // FontAwesome icons
  faExclamationTriangle = faExclamationTriangle;
  faChartLine = faChartLine;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faFileAlt = faFileAlt;
  faSave = faSave;
  faTrash = faTrash;
  faArrowLeft = faArrowLeft;

  /**
   * Handle save and navigate action
   */
  onSaveAndNavigate(): void {
    this.saveAndNavigate.emit(this.targetRoute);
  }

  /**
   * Handle discard and navigate action
   */
  onDiscardAndNavigate(): void {
    this.discardAndNavigate.emit(this.targetRoute);
  }

  /**
   * Handle cancel navigation action
   */
  onCancel(): void {
    this.cancelNavigation.emit();
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