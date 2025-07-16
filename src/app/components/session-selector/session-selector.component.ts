import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { TestSession } from '../../models/progress.model';

@Component({
  selector: 'app-session-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './session-selector.component.html',
  styleUrls: ['./session-selector.component.scss']
})
export class SessionSelectorComponent implements OnInit, OnChanges {
  // FontAwesome icons
  faChartBar = faChartBar;

  // Inputs
  @Input() sessions: TestSession[] = [];
  @Input() selectedSessionId: string = '';
  @Input() label: string = 'Comparar con sesión anterior:';
  @Input() currentSessionText: string = '📊 Sesión actual (sin guardar)';
  @Input() placeholder: string = '-- Seleccionar sesión --';
  @Input() showComparison: boolean = false;
  @Input() canCompare: boolean = false;
  @Input() comparisonMode: 'individual' | 'compare' = 'individual';
  @Input() comparisonTooltip: string = '';
  @Input() groupByMode: boolean = true; // Whether to group practice and test sessions

  // Outputs
  @Output() sessionSelect = new EventEmitter<string>();
  @Output() comparisonModeToggle = new EventEmitter<void>();

  // Computed properties for session grouping
  practicesSessions: TestSession[] = [];
  testSessions: TestSession[] = [];

  ngOnInit(): void {
    this.updateSessionGroups();
  }

  ngOnChanges(): void {
    this.updateSessionGroups();
  }

  private updateSessionGroups(): void {
    if (this.groupByMode) {
      this.practicesSessions = this.sessions.filter(s => s.mode === 'practice');
      this.testSessions = this.sessions.filter(s => s.mode === 'test');
    }
  }

  onSessionSelect(): void {
    this.sessionSelect.emit(this.selectedSessionId);
  }

  onComparisonModeToggle(): void {
    if (this.canCompare) {
      this.comparisonModeToggle.emit();
    }
  }

  /**
   * Format session for dropdown display
   */
  formatSessionForDropdown(session: TestSession): string {
    return new Date(session.timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}