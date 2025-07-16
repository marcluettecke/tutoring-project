import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProgressService } from '../../services/progress.service';
import { TestSession, SectionProgressData } from '../../models/progress.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar, faTable, faArrowUp, faArrowDown, faArrowRight, faCheck, faTimes, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { SessionSelectorComponent } from '../../components/session-selector/session-selector.component';
import { SessionDataTableComponent } from '../../components/session-data-table/session-data-table.component';
import { SessionComparisonTableComponent } from '../../components/session-comparison-table/session-comparison-table.component';
import { ChartsContainerComponent } from '../../components/charts/charts-container/charts-container.component';
import { ChartDataService } from '../../services/chart-data.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, SessionSelectorComponent, SessionDataTableComponent, SessionComparisonTableComponent, ChartsContainerComponent],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {
  // FontAwesome icons
  faChartBar = faChartBar;
  faTable = faTable;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faArrowRight = faArrowRight;
  faCheck = faCheck;
  faTimes = faTimes;
  faChartLine = faChartLine;

  // State management
  activeTab: 'data' | 'charts' = 'data';
  currentUserId: string | null = null;
  allSessions: TestSession[] = [];
  practicesSessions: TestSession[] = [];
  testSessions: TestSession[] = [];
  
  // Session selection for comparison
  selectedSession1: TestSession | null = null;
  selectedSession2: TestSession | null = null;
  selectedSessionId1: string = '';
  selectedSessionId2: string = '';
  
  // View mode is now computed based on selected sessions
  get viewMode(): 'single' | 'compare' {
    return this.selectedSession2 ? 'compare' : 'single';
  }
  
  // Section breakdown data
  session1SectionBreakdown: SectionProgressData[] = [];
  session2SectionBreakdown: SectionProgressData[] = [];
  
  // Chart data (cached to avoid infinite loops)
  chartData1: SectionProgressData[] = [];
  chartData2: SectionProgressData[] = [];
  
  // Chart data
  currentChartData: SectionProgressData[] = [];
  comparisonChartData: SectionProgressData[] = [];
  
  // Chart controls
  comparisonMode: 'individual' | 'compare' = 'individual';
  canCompare: boolean = false;
  showComparison: boolean = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private progressService: ProgressService,
    private chartDataService: ChartDataService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.loadUserSessions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUser(): void {
    this.currentUserId = this.authService.loginChanged.value?.uid || null;
  }

  private async loadUserSessions(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      this.progressService.getUserProgress(this.currentUserId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (userProgress) => {
            if (userProgress && userProgress.recentSessions) {
              this.allSessions = userProgress.recentSessions
                .filter(session => session.completed)
                .sort((a, b) => b.timestamp - a.timestamp);

              // Separate by mode
              this.practicesSessions = this.allSessions.filter(s => s.mode === 'practice');
              this.testSessions = this.allSessions.filter(s => s.mode === 'test');
            }
          },
          error: (error) => {
            console.error('Error loading user sessions:', error);
          }
        });
    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  }

  /**
   * Switch active tab
   */
  switchTab(tab: 'data' | 'charts'): void {
    this.activeTab = tab;
  }


  /**
   * Handle session selection for comparison
   */
  onSession1Select(): void {
    this.selectedSession1 = this.allSessions.find(s => s.id === this.selectedSessionId1) || null;
    this.updateSession1Breakdown();
    
    // Clear second selection when first selection changes to ensure type compatibility
    if (this.selectedSession2) {
      const isSecondSessionCompatible = this.getFilteredSessions().some(s => s.id === this.selectedSessionId2);
      if (!isSecondSessionCompatible) {
        this.selectedSessionId2 = '';
        this.selectedSession2 = null;
        this.updateSession2Breakdown();
      }
    }
  }

  onSession2Select(): void {
    this.selectedSession2 = this.allSessions.find(s => s.id === this.selectedSessionId2) || null;
    this.updateSession2Breakdown();
  }

  /**
   * Handle session selection from SessionSelectorComponent
   */
  onSessionSelect(sessionId: string): void {
    this.selectedSessionId1 = sessionId;
    this.onSession1Select();
  }

  /**
   * Update section breakdown for session 1
   */
  private updateSession1Breakdown(): void {
    if (this.selectedSession1) {
      this.session1SectionBreakdown = this.extractSectionBreakdown(this.selectedSession1);
      this.chartData1 = this.chartDataService.convertSessionToChartData(this.selectedSession1);
      this.currentChartData = this.chartData1;
      this.updateChartComparison();
    } else {
      this.session1SectionBreakdown = [];
      this.chartData1 = [];
      this.currentChartData = [];
      this.updateChartComparison();
    }
  }

  /**
   * Update section breakdown for session 2
   */
  private updateSession2Breakdown(): void {
    if (this.selectedSession2) {
      this.session2SectionBreakdown = this.extractSectionBreakdown(this.selectedSession2);
      this.chartData2 = this.chartDataService.convertSessionToChartData(this.selectedSession2);
      this.updateChartComparison();
    } else {
      this.session2SectionBreakdown = [];
      this.chartData2 = [];
      this.updateChartComparison();
    }
  }

  /**
   * Extract section breakdown from session data
   */
  private extractSectionBreakdown(session: any): SectionProgressData[] {
    // If session has sectionBreakdown property, use it
    if ('sectionBreakdown' in session && session.sectionBreakdown && Array.isArray(session.sectionBreakdown)) {
      return session.sectionBreakdown;
    }
    
    // Otherwise create from main session data
    const timeValue = 'timeSpent' in session ? session.timeSpent : 0;
    return [{
      sectionName: session.mainSection || 'general',
      subSection: session.subSection,
      questionsAnswered: session.questionsAnswered || 0,
      correctAnswers: session.correctAnswers || 0,
      incorrectAnswers: session.incorrectAnswers || 0,
      timeSpent: timeValue * 1000 // Convert to milliseconds if needed
    }];
  }

  /**
   * Get filtered sessions for second selector (excluding first selection and filtering by same type)
   */
  getFilteredSessions(): TestSession[] {
    // If no first session is selected, return empty array to prevent second dropdown from being used first
    if (!this.selectedSessionId1 || this.selectedSessionId1 === 'current') {
      return [];
    }

    // Find the first selected session to determine its type
    const firstSession = this.allSessions.find(s => s.id === this.selectedSessionId1);
    if (!firstSession) {
      return [];
    }

    // Filter sessions to only include same type as first session, excluding the first session itself
    return this.allSessions.filter(s => 
      s.id !== this.selectedSessionId1 && 
      s.mode === firstSession.mode
    );
  }


  /**
   * Handle session selection from second selector
   */
  onSession2SelectFromSelector(sessionId: string): void {
    this.selectedSessionId2 = sessionId;
    this.onSession2Select();
  }

  /**
   * Get session type display text
   */
  getSessionTypeText(session: TestSession): string {
    return session.mode === 'practice' ? 'Práctica' : 'Examen';
  }

  /**
   * Calculate session accuracy
   */
  getSessionAccuracy(session: TestSession): number {
    if (session.questionsAnswered === 0) return 0;
    return (session.correctAnswers / session.questionsAnswered * 100);
  }

  /**
   * Check if session has empty breakdown
   */
  hasEmptyBreakdown(breakdown: SectionProgressData[]): boolean {
    return breakdown.length === 0;
  }

  /**
   * Get formatted session label for table
   */
  getSessionLabel(session: TestSession | null, fallback: string): string {
    return session ? this.formatSessionForDropdown(session) : fallback;
  }

  /**
   * Format session for dropdown display
   */
  formatSessionForDropdown(session: TestSession): string {
    return this.chartDataService.formatSessionForDropdown(session);
  }

  /**
   * Update chart comparison state
   */
  private updateChartComparison(): void {
    this.canCompare = this.selectedSession1 !== null && this.selectedSession2 !== null;
  }

  /**
   * Handle chart session change
   */
  onChartSessionChanged(sessionId: string): void {
    if (sessionId === 'current') {
      // In results view, "current" means the first selected session
      return;
    }
    
    // Update second session selection
    this.selectedSessionId2 = sessionId;
    this.onSession2Select();
  }

  /**
   * Handle chart comparison mode change
   */
  onChartComparisonModeChanged(mode: 'individual' | 'compare'): void {
    this.comparisonMode = mode;
  }

  /**
   * Get comparison tooltip
   */
  get comparisonTooltip(): string {
    if (!this.canCompare) {
      return 'Selecciona dos sesiones para habilitar la comparación';
    }
    return this.comparisonMode === 'individual' ? 'Cambiar a vista de comparación' : 'Cambiar a vista individual';
  }

  /**
   * Get available sessions for chart comparison
   */
  get availableSessionsForChart(): TestSession[] {
    // Return all sessions for chart selector
    return this.allSessions;
  }

  /**
   * Get chart data for a specific session
   */
  getChartDataForSession(session: TestSession): SectionProgressData[] {
    return this.chartDataService.convertSessionToChartData(session);
  }
}
