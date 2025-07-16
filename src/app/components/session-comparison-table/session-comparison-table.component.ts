import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTable, faCheck, faTimes, faArrowUp, faArrowDown, faArrowRight, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { TestSession, SectionProgressData } from '../../models/progress.model';

export interface SessionComparisonMetrics {
  questionsAnswered: {
    current: number;
    historical: number;
    diff: number;
  };
  correctAnswers: {
    current: number;
    historical: number;
    diff: number;
  };
  incorrectAnswers: {
    current: number;
    historical: number;
    diff: number;
  };
  avgTimePerQuestion: {
    current: number;
    historical: number;
    diff: number;
  };
}

@Component({
  selector: 'app-session-comparison-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './session-comparison-table.component.html',
  styleUrls: ['./session-comparison-table.component.scss']
})
export class SessionComparisonTableComponent {
  // FontAwesome icons
  faTable = faTable;
  faCheck = faCheck;
  faTimes = faTimes;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faArrowRight = faArrowRight;
  faChartLine = faChartLine;

  // Inputs
  @Input() session1: TestSession | null = null;
  @Input() session2: TestSession | null = null;
  @Input() session1Label: string = 'Primera sesión';
  @Input() session2Label: string = 'Segunda sesión';

  /**
   * Calculate comparison metrics between two sessions
   */
  getComparisonMetrics(): SessionComparisonMetrics | null {
    if (!this.session1 || !this.session2) return null;

    const currentAvgTime = this.session1.questionsAnswered > 0 ? (this.session1.timeSpent * 1000) / this.session1.questionsAnswered : 0;
    const historicalAvgTime = this.session2.questionsAnswered > 0 ? (this.session2.timeSpent * 1000) / this.session2.questionsAnswered : 0;

    return {
      questionsAnswered: {
        current: this.session1.questionsAnswered,
        historical: this.session2.questionsAnswered,
        diff: this.session1.questionsAnswered - this.session2.questionsAnswered
      },
      correctAnswers: {
        current: this.session1.correctAnswers,
        historical: this.session2.correctAnswers,
        diff: this.session1.correctAnswers - this.session2.correctAnswers
      },
      incorrectAnswers: {
        current: this.session1.incorrectAnswers,
        historical: this.session2.incorrectAnswers,
        diff: this.session1.incorrectAnswers - this.session2.incorrectAnswers
      },
      avgTimePerQuestion: {
        current: currentAvgTime,
        historical: historicalAvgTime,
        diff: currentAvgTime - historicalAvgTime
      }
    };
  }

  /**
   * Calculate accuracy for a session
   */
  getSessionAccuracy(session: TestSession): number {
    if (session.questionsAnswered === 0) return 0;
    return (session.correctAnswers / session.questionsAnswered) * 100;
  }

  /**
   * Get accuracy difference between sessions
   */
  getAccuracyDifference(): number {
    if (!this.session1 || !this.session2) return 0;
    return this.getSessionAccuracy(this.session1) - this.getSessionAccuracy(this.session2);
  }

  /**
   * Format time in milliseconds to readable format
   */
  formatTime(timeInMs: number): string {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get session score (if available)
   */
  getSessionScore(session: TestSession): number {
    return session.testScore || session.score || 0;
  }

  /**
   * Get score difference between sessions
   */
  getScoreDifference(): number {
    if (!this.session1 || !this.session2) return 0;
    return this.getSessionScore(this.session1) - this.getSessionScore(this.session2);
  }
}