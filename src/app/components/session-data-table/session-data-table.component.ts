import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { TestSession, SectionProgressData } from '../../models/progress.model';
import { formatSpanishPercentage, formatTime } from '../../utils/number-format.utils';

@Component({
  selector: 'app-session-data-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './session-data-table.component.html',
  styleUrls: ['./session-data-table.component.scss']
})
export class SessionDataTableComponent {
  // FontAwesome icons
  faChartBar = faChartBar;

  // Inputs
  @Input() sectionBreakdown: SectionProgressData[] = [];
  @Input() session: TestSession | null = null;
  @Input() sessionLabel: string = '';
  @Input() showEmptyState: boolean = false;
  @Input() emptyStateTitle: string = 'Sesión sin datos';
  @Input() emptyStateDescription: string = 'No se respondieron preguntas durante esta sesión.';

  /**
   * Get section display name
   */
  getSectionDisplayName(sectionName: string): string {
    const sectionMap: { [key: string]: string } = {
      'administrativo': 'Administrativo',
      'medio ambiente': 'Medio Ambiente',
      'costas': 'Costas',
      'aguas': 'Aguas'
    };
    return sectionMap[sectionName] || sectionName;
  }

  /**
   * Calculate section accuracy
   */
  getSectionAccuracy(section: SectionProgressData): number {
    if (section.questionsAnswered === 0) return 0;
    return (section.correctAnswers / section.questionsAnswered) * 100;
  }

  /**
   * Get accuracy level for styling
   */
  getSectionAccuracyLevel(section: SectionProgressData): string {
    const accuracy = this.getSectionAccuracy(section);
    if (accuracy >= 85) return 'excellent';
    if (accuracy >= 70) return 'good';
    return 'needs-improvement';
  }

  /**
   * Format time spent
   */
  formatTimeSpent(timeInMs: number): string {
    return formatTime(timeInMs);
  }

  /**
   * Format average time per question
   */
  formatAverageTimePerQuestion(section: SectionProgressData): string {
    if (section.questionsAnswered === 0) return '0:00';
    const avgTimeMs = section.timeSpent / section.questionsAnswered;
    return this.formatTimeSpent(avgTimeMs);
  }
  
  /**
   * Format percentage to Spanish locale
   */
  formatSpanishPercentage(value: number, decimals: number = 1): string {
    return formatSpanishPercentage(value, decimals);
  }
}