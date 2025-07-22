import { Component, Output, OnInit, OnDestroy, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TestService } from "../../services/test.service";
import { ProgressService } from "../../services/progress.service";
import { ChartDataService } from "../../services/chart-data.service";
import { TestSession, TestServiceAnswers, CurrentSessionProgress, SectionProgressData, SectionProgressDataWithComparison } from '../../models/progress.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar, faTable, faArrowUp, faArrowDown, faArrowRight, faCheck, faTimes, faChartLine, faPlay, faEye, faMinus, faExpand } from '@fortawesome/free-solid-svg-icons';
import { SessionComparisonTableComponent } from '../session-comparison-table/session-comparison-table.component';
import { ChartsContainerComponent } from '../charts/charts-container/charts-container.component';
import { formatSpanishNumber, formatSpanishPercentage } from '../../utils/number-format.utils';

/**
 * Enhanced result modal component with modern styling and session comparison
 * Displays test results with professional presentation and manual session comparison
 */
@Component({
  selector: 'app-result-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, SessionComparisonTableComponent, ChartsContainerComponent],
  templateUrl: './result-modal.component.html',
  styleUrls: ['./result-modal.component.scss']
})
export class ResultModalComponent implements OnInit, OnDestroy {
  @Output() onCloseClick: EventEmitter<void> = new EventEmitter();
  @Output() onRetryClick: EventEmitter<void> = new EventEmitter();
  @Output() onContinueClick: EventEmitter<void> = new EventEmitter();
  @Output() onMinimizeChange: EventEmitter<boolean> = new EventEmitter();

  @Input() currentSection: string = '';
  @Input() currentSubsection: string = '';
  @Input() userId: string | null = null;
  @Input() isProgressTracking: boolean = false;
  @Input() progressSession: CurrentSessionProgress | null = null;

  correctAnswers: TestServiceAnswers = {};
  previousSessions: TestSession[] = [];
  selectedSessionId: string = 'current';
  selectedSession: TestSession | null = null;
  showComparison = false;
  comparisonMode: 'individual' | 'compare' = 'individual';
  activeTab: 'data' | 'charts' = 'data';
  isMinimized = false;

  faChartBar = faChartBar;
  faTable = faTable;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faArrowRight = faArrowRight;
  faCheck = faCheck;
  faEye = faEye;
  faTimes = faTimes;
  faChartLine = faChartLine;
  faPlay = faPlay;
  faMinus = faMinus;
  faExpand = faExpand;

  private destroy$ = new Subject<void>();

  constructor(
    public testService: TestService,
    private progressService: ProgressService,
    private chartDataService: ChartDataService
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.isProgressTracking && this.progressSession) {
      this.buildCorrectAnswersFromProgressSession();
    } else {
      this.correctAnswers = this.testService.correctAnswers;
    }
    await this.loadPreviousSessions();
    
    // Pre-generate chart data to avoid template calls
    this.getChartData();
  }

  /**
   * Build correctAnswers structure from progress session data
   */
  private buildCorrectAnswersFromProgressSession(): void {
    if (!this.progressSession) return;

    const totalAnswered = this.progressSession.questionsAnswered;
    const totalBlank = Math.max(0, this.progressSession.totalQuestions - totalAnswered);

    this.correctAnswers = {
      total: {
        correct: this.progressSession.correctAnswers,
        incorrect: this.progressSession.incorrectAnswers,
        blank: totalBlank
      }
    };

    if (this.progressSession.mainSection && this.progressSession.mainSection !== 'general') {
      this.correctAnswers[this.progressSession.mainSection] = {
        correct: this.progressSession.correctAnswers,
        incorrect: this.progressSession.incorrectAnswers,
        blank: totalBlank
      };
    }

    if (this.progressSession.questionsAnswered > 0 &&
      (!this.progressSession.sectionBreakdown || this.progressSession.sectionBreakdown.length === 0)) {
      this.progressSession.sectionBreakdown = [{
        sectionName: this.progressSession.mainSection || 'Varias',
        subSection: this.progressSession.subSection,
        questionsAnswered: this.progressSession.questionsAnswered,
        correctAnswers: this.progressSession.correctAnswers,
        incorrectAnswers: this.progressSession.incorrectAnswers,
        timeSpent: this.progressSession.timeElapsed || 0,
        accuracy: this.progressSession.questionsAnswered > 0 ?
          (this.progressSession.correctAnswers / this.progressSession.questionsAnswered) * 100 : 0,
        avgTimePerQuestion: this.progressSession.questionsAnswered > 0 ?
          (this.progressSession.timeElapsed || 0) / this.progressSession.questionsAnswered : 0
      }];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Save current session to progress tracking
   */
  private async saveCurrentSession(): Promise<void> {
    if (!this.userId || !this.correctAnswers.total) return;

    try {
      const sessionId = `${this.userId}_${Date.now()}`;

      // Build section breakdown from correctAnswers data
      const sectionBreakdown: SectionProgressData[] = [];
      const totalElapsedTime = this.testService.getElapsedTime();
      const totalQuestionsAnswered = this.correctAnswers.total.correct + this.correctAnswers.total.incorrect;
      
      Object.keys(this.correctAnswers).forEach(sectionName => {
        if (sectionName !== 'total' && this.correctAnswers[sectionName]) {
          const sectionData = this.correctAnswers[sectionName];
          const questionsAnswered = sectionData.correct + sectionData.incorrect;
          
          if (questionsAnswered > 0) {
            // Proportionally distribute time based on questions answered
            const sectionTimeSpent = totalQuestionsAnswered > 0 
              ? Math.floor((questionsAnswered / totalQuestionsAnswered) * totalElapsedTime * 1000) // Convert to milliseconds
              : 0;
              
            sectionBreakdown.push({
              sectionName: sectionName,
              questionsAnswered: questionsAnswered,
              correctAnswers: sectionData.correct,
              incorrectAnswers: sectionData.incorrect,
              blankAnswers: sectionData.blank,
              timeSpent: sectionTimeSpent,
              accuracy: questionsAnswered > 0 ? (sectionData.correct / questionsAnswered) * 100 : 0
            });
          }
        }
      });

      const currentSession: TestSession = {
        id: sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        mode: this.isProgressTracking ? 'practice' : 'test',
        mainSection: this.isProgressTracking ? (this.currentSection || 'Varias') : this.determineMainSection(),
        subSection: this.currentSubsection,
        questionsAnswered: this.correctAnswers.total.correct + this.correctAnswers.total.incorrect,
        correctAnswers: this.correctAnswers.total.correct,
        incorrectAnswers: this.correctAnswers.total.incorrect,
        blankAnswers: this.correctAnswers.total.blank,
        timeSpent: this.testService.getElapsedTime(),
        completed: true,
        score: this.overallAccuracy,
        testScore: this.overallScore,
        sectionBreakdown: sectionBreakdown // Include section breakdown
      };

      await this.progressService.saveCompletedSession(currentSession);
    } catch {
      // Error saving current session
    }
  }

  /**
   * Load previous sessions for the dropdown
   */
  private async loadPreviousSessions(): Promise<void> {
    if (!this.userId) return;

    try {
      this.progressService.getUserProgress(this.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (userProgress) => {
            if (userProgress && userProgress.recentSessions) {
              const targetMode = this.isProgressTracking ? 'practice' : 'test';

              this.previousSessions = userProgress.recentSessions
                .filter(session => {
                  // Only show completed sessions of the same mode
                  // Handle legacy sessions that might not have mode set
                  const sessionMode = session.mode || 'practice';
                  const isCompleted = session.completed;
                  const modeMatches = sessionMode === targetMode;

                  return isCompleted && modeMatches;
                })
                .sort((a, b) => b.timestamp - a.timestamp);
            }
          },
          error: () => {
            // Error loading previous sessions
          }
        });
    } catch {
      // Error loading previous sessions
    }
  }

  /**
   * Get the overall test score using TestService logic
   * @returns Calculated test score
   */
  get overallScore(): number {
    if (!this.correctAnswers.total) return 0;
    return this.correctAnswers.total.correct - (0.33 * this.correctAnswers.total.incorrect);
  }

  /**
   * Get the overall accuracy percentage
   * @returns Accuracy percentage
   */
  get overallAccuracy(): number {
    if (!this.correctAnswers.total) return 0;
    const total = this.correctAnswers.total.correct + this.correctAnswers.total.incorrect;
    return total > 0 ? (this.correctAnswers.total.correct / total) * 100 : 0;
  }

  /**
   * Get average time per question in seconds
   * @returns Average time per question
   */
  get averageTimePerQuestion(): number {
    if (!this.progressSession || this.progressSession.questionsAnswered === 0) return 0;
    return Math.round(this.progressSession.timeElapsed / 1000 / this.progressSession.questionsAnswered);
  }

  /**
   * Get session duration in readable format
   * @returns Formatted session duration
   */
  get sessionDuration(): string {
    if (!this.progressSession) return '-';
    const totalSeconds = Math.floor(this.progressSession.timeElapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get section-specific performance level for styling
   * @param section - Section name
   * @returns Performance level string
   */
  getSectionPerformanceLevel(section: string): string {
    const sectionData = this.correctAnswers[section];
    if (!sectionData) return 'needs-improvement';

    const score = sectionData.correct - (0.33 * sectionData.incorrect);
    let threshold = 0;

    switch (section) {
      case 'administrativo':
      case 'costas':
        threshold = 14;
        break;
      case 'medio ambiente':
        threshold = 18;
        break;
      case 'aguas':
        threshold = 24;
        break;
      case 'total':
        threshold = 70;
        break;
    }

    if (score > threshold) return 'excellent';
    if (score > threshold * 0.7) return 'good';
    return 'needs-improvement';
  }

  /**
   * Handle close button click
   */
  handleCloseClick(): void {
    this.onCloseClick.emit();
  }

  /**
   * Handle retry button click
   */
  handleRetryClick(): void {
    this.onRetryClick.emit();
  }

  /**
   * Handle continue session button click
   * Closes the modal and allows user to continue with their tracking session
   */
  continueSession(): void {
    this.onContinueClick.emit();
  }

  /**
   * Handle continue button click
   */
  handleContinueClick(): void {
    this.onContinueClick.emit();
  }

  /**
   * Save progress session and close modal
   */
  async saveAndClose(): Promise<void> {
    // Save and close method called

    if (this.isProgressTracking && this.progressSession && this.userId) {
      try {
        const testSession: TestSession = {
          id: this.progressSession.sessionId,
          userId: this.userId,
          timestamp: this.progressSession.startTime,
          mode: this.progressSession.mode,
          mainSection: this.progressSession.mainSection,
          subSection: this.progressSession.subSection,
          questionsAnswered: this.progressSession.questionsAnswered,
          correctAnswers: this.progressSession.correctAnswers,
          incorrectAnswers: this.progressSession.incorrectAnswers,
          blankAnswers: 0,
          timeSpent: Math.floor(this.progressSession.timeElapsed / 1000),
          completed: true,
          score: this.progressSession.questionsAnswered > 0 ? (this.progressSession.correctAnswers / this.progressSession.questionsAnswered) * 100 : 0,
          testScore: this.progressSession.correctAnswers - (0.33 * this.progressSession.incorrectAnswers),
          sectionBreakdown: this.progressSession.sectionBreakdown // Include section breakdown
        };

        // Save to Firebase
        await this.progressService.saveCompletedSession(testSession);
      } catch {
        // Error saving progress session
      }
    } else {
      // Save conditions not met
    }

    this.handleCloseClick();
  }

  /**
   * Get section display name
   * @param section - Section key
   * @returns Display name
   */
  getSectionDisplayName(section: string): string {
    const displayNames: { [key: string]: string } = {
      'administrativo': 'Administrativo',
      'medio ambiente': 'Medio Ambiente',
      'costas': 'Costas',
      'aguas': 'Aguas',
      'total': 'Total'
    };
    return displayNames[section] || section;
  }

  /**
   * Get sections in display order
   * @returns Array of section keys
   */
  get sectionsInOrder(): string[] {
    // Get all sections from correctAnswers except 'total'
    const sections = Object.keys(this.correctAnswers)
      .filter(key => key !== 'total')
      .sort(); // Sort alphabetically or you can define custom order
    
    // Add 'total' at the end
    return [...sections, 'total'];
  }

  /**
   * Handle session selection from dropdown
   */
  onSessionSelected(): void {
    if (this.selectedSessionId === 'current') {
      this.selectedSession = null;
      this.showComparison = false;
      this.comparisonMode = 'individual';
    } else {
      this.selectedSession = this.previousSessions.find(session => session.id === this.selectedSessionId) || null;
      this.showComparison = !!this.selectedSession;
      // Don't reset comparison mode when switching sessions - preserve user's selection
    }
  }

  /**
   * Alias for onSessionSelected to match HTML template
   */
  onSessionSelect(): void {
    this.onSessionSelected();
  }

  /**
   * Clear session comparison
   */
  clearComparison(): void {
    this.selectedSessionId = '';
    this.selectedSession = null;
    this.showComparison = false;
    this.comparisonMode = 'individual';
  }

  /**
   * Toggle between individual and comparison view modes
   */
  toggleComparisonMode(): void {
    this.comparisonMode = this.comparisonMode === 'individual' ? 'compare' : 'individual';
  }

  /**
   * Format session for dropdown display
   * @param session - Test session
   * @returns Formatted display string
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

  /**
   * Get score difference between current and selected session
   * @returns Score difference
   */
  get scoreDifference(): number {
    if (!this.selectedSession) return 0;
    const currentScore = this.overallScore;
    const selectedScore = this.selectedSession.testScore || this.selectedSession.score || 0;
    return currentScore - selectedScore;
  }

  /**
   * Get accuracy difference between current and selected session
   * @returns Accuracy difference percentage
   */
  get accuracyDifference(): number {
    if (!this.selectedSession) return 0;
    const currentAccuracy = this.overallAccuracy;
    const selectedAccuracy = this.selectedSession.questionsAnswered > 0
      ? (this.selectedSession.correctAnswers / this.selectedSession.questionsAnswered) * 100
      : 0;
    return currentAccuracy - selectedAccuracy;
  }

  /**
   * Get improvement indicator class
   * @returns CSS class for improvement styling
   */
  get improvementClass(): string {
    const scoreDiff = this.scoreDifference;
    if (scoreDiff > 5) return 'improvement-excellent';
    if (scoreDiff > 0) return 'improvement-good';
    if (scoreDiff < -5) return 'improvement-poor';
    return 'improvement-neutral';
  }

  /**
   * Get improvement message
   * @returns Improvement message string
   */
  get improvementMessage(): string {
    if (!this.selectedSession) return '';

    const scoreDiff = this.scoreDifference;
    if (scoreDiff > 10) return '¡Excelente mejora!';
    if (scoreDiff > 0) return '¡Has mejorado!';
    if (scoreDiff < -10) return 'Resultado por debajo de la sesión seleccionada';
    return 'Resultado similar';
  }

  /**
   * Get selected session score
   * @returns Selected session score
   */
  get selectedSessionScore(): number {
    if (!this.selectedSession) return 0;
    return this.selectedSession.testScore || this.selectedSession.score || 0;
  }

  /**
   * Get selected session accuracy
   * @returns Selected session accuracy percentage
   */
  get selectedSessionAccuracy(): number {
    if (!this.selectedSession) return 0;
    return this.selectedSession.questionsAnswered > 0
      ? (this.selectedSession.correctAnswers / this.selectedSession.questionsAnswered) * 100
      : 0;
  }

  /**
   * Get formatted date for selected session
   * @returns Formatted date string
   */
  get selectedSessionDate(): string {
    if (!this.selectedSession) return '';
    return new Date(this.selectedSession.timestamp).toLocaleDateString('es-ES');
  }

  /**
   * Get comparison mode display text
   * @returns Mode description
   */
  get comparisonModeText(): string {
    return this.comparisonMode === 'individual' ? 'Mostrar comparación' : 'Mostrar individual';
  }

  /**
   * Get current date formatted in Spanish
   * @returns Formatted date string
   */
  get currentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }


  /**
   * Get section breakdown data based on current comparison mode
   * @returns Section breakdown array or comparison data
   */
  get displaySectionBreakdown(): (SectionProgressData | SectionProgressDataWithComparison)[] {
    if (this.comparisonMode === 'compare' && this.selectedSession && this.progressSession) {
      return this.getComparisonData();
    }

    const data = this.selectedSessionId === 'current' || !this.selectedSession ? this.progressSession : this.selectedSession;
    if (!data) return [];

    if ('sectionBreakdown' in data && data.sectionBreakdown) {
      return data.sectionBreakdown;
    }

    // For historical sessions that might not have sectionBreakdown,
    // create a single entry from the main session data
    if ('mainSection' in data) {
      const timeValue = 'timeElapsed' in data ? data.timeElapsed : ('timeSpent' in data ? data.timeSpent : 0);

      return [{
        sectionName: data.mainSection,
        subSection: data.subSection || undefined,
        questionsAnswered: data.questionsAnswered || 0,
        correctAnswers: data.correctAnswers || 0,
        incorrectAnswers: data.incorrectAnswers || 0,
        timeSpent: timeValue,
        accuracy: data.questionsAnswered > 0 ? (data.correctAnswers / data.questionsAnswered) * 100 : 0,
        avgTimePerQuestion: data.questionsAnswered > 0 ? timeValue / data.questionsAnswered : 0
      }];
    }

    return [];
  }

  /**
   * Get comparison data between current and selected session
   * @returns Merged section breakdown for comparison with differences
   */
  private getComparisonData(): SectionProgressDataWithComparison[] {
    if (!this.progressSession?.sectionBreakdown || !this.selectedSession) {
      return [];
    }

    const currentBreakdown = this.progressSession.sectionBreakdown;
    const historicalData = this.getHistoricalSectionData();

    return currentBreakdown.map(currentSection => {
      const historicalSection = historicalData.find((h: SectionProgressData) =>
        h.sectionName === currentSection.sectionName &&
        h.subSection === currentSection.subSection
      );

      const currentAccuracy = currentSection.accuracy ??
        (currentSection.questionsAnswered > 0 ? (currentSection.correctAnswers / currentSection.questionsAnswered) * 100 : 0);
      const currentAvgTime = currentSection.avgTimePerQuestion ??
        (currentSection.questionsAnswered > 0 ? currentSection.timeSpent / currentSection.questionsAnswered : 0);

      const historicalAccuracy = historicalSection?.accuracy ??
        (historicalSection && historicalSection.questionsAnswered > 0 ? (historicalSection.correctAnswers / historicalSection.questionsAnswered) * 100 : 0);
      const historicalAvgTime = historicalSection?.avgTimePerQuestion ??
        (historicalSection && historicalSection.questionsAnswered > 0 ? historicalSection.timeSpent / historicalSection.questionsAnswered : 0);

      return {
        ...currentSection,
        accuracy: currentAccuracy,
        avgTimePerQuestion: currentAvgTime,
        historical: historicalSection || null,
        accuracyDiff: historicalSection && historicalAccuracy !== undefined ?
          currentAccuracy - historicalAccuracy : null,
        timeDiff: historicalSection && historicalAvgTime !== undefined ?
          currentAvgTime - historicalAvgTime : null,
        questionsDiff: historicalSection ?
          currentSection.questionsAnswered - historicalSection.questionsAnswered : null,
        correctDiff: historicalSection ?
          currentSection.correctAnswers - historicalSection.correctAnswers : null,
        incorrectDiff: historicalSection ?
          currentSection.incorrectAnswers - historicalSection.incorrectAnswers : null
      };
    });
  }

  /**
   * Get overall session comparison metrics
   */
  get sessionComparisonMetrics() {
    if (!this.selectedSession) {
      return null;
    }

    if (this.isProgressTracking && this.progressSession) {
      return this.getProgressSessionComparisonMetrics();
    }

    if (!this.isProgressTracking && this.correctAnswers.total) {
      return this.getTestExamComparisonMetrics();
    }

    return null;
  }

  /**
   * Get comparison metrics for progress tracking sessions
   */
  private getProgressSessionComparisonMetrics() {
    if (!this.progressSession || !this.selectedSession) return null;

    const currentTotal = this.progressSession.questionsAnswered;
    const currentCorrect = this.progressSession.correctAnswers;
    const currentIncorrect = this.progressSession.incorrectAnswers;
    const currentTime = this.progressSession.timeElapsed;
    const currentAvgTime = currentTotal > 0 ? currentTime / currentTotal : 0;

    const historicalTotal = this.selectedSession.questionsAnswered || 0;
    const historicalCorrect = this.selectedSession.correctAnswers || 0;
    const historicalIncorrect = this.selectedSession.incorrectAnswers || 0;
    const historicalTimeSeconds = 'timeSpent' in this.selectedSession ? this.selectedSession.timeSpent : 0;
    const historicalTime = historicalTimeSeconds * 1000;
    const historicalAvgTime = historicalTotal > 0 ? historicalTime / historicalTotal : 0;

    const currentSubsections = this.progressSession.sectionBreakdown?.map(s => s.subSection).filter(Boolean) || [];
    const historicalSubsections = this.getHistoricalSectionData().map(s => s.subSection).filter(Boolean);

    return {
      questionsAnswered: {
        current: currentTotal,
        historical: historicalTotal,
        diff: currentTotal - historicalTotal,
        percentChange: historicalTotal > 0 ? ((currentTotal - historicalTotal) / historicalTotal) * 100 : 0
      },
      correctAnswers: {
        current: currentCorrect,
        historical: historicalCorrect,
        diff: currentCorrect - historicalCorrect,
        percentChange: historicalCorrect > 0 ? ((currentCorrect - historicalCorrect) / historicalCorrect) * 100 : 0
      },
      incorrectAnswers: {
        current: currentIncorrect,
        historical: historicalIncorrect,
        diff: currentIncorrect - historicalIncorrect,
        percentChange: historicalIncorrect > 0 ? ((currentIncorrect - historicalIncorrect) / historicalIncorrect) * 100 : 0
      },
      avgTimePerQuestion: {
        current: currentAvgTime,
        historical: historicalAvgTime,
        diff: currentAvgTime - historicalAvgTime,
        percentChange: historicalAvgTime > 0 ? ((currentAvgTime - historicalAvgTime) / historicalAvgTime) * 100 : 0
      },
      subsections: {
        current: currentSubsections,
        historical: historicalSubsections,
        new: currentSubsections.filter(s => !historicalSubsections.includes(s)),
        continued: currentSubsections.filter(s => historicalSubsections.includes(s)),
        dropped: historicalSubsections.filter(s => !currentSubsections.includes(s))
      }
    };
  }

  /**
   * Convert historical session to section breakdown format
   */
  private getHistoricalSectionData(): SectionProgressData[] {
    if (!this.selectedSession) return [];

    if ('sectionBreakdown' in this.selectedSession && this.selectedSession.sectionBreakdown && Array.isArray(this.selectedSession.sectionBreakdown)) {
      return this.selectedSession.sectionBreakdown;
    }

    const timeValue = 'timeSpent' in this.selectedSession ? this.selectedSession.timeSpent : 0;
    return [{
      sectionName: this.selectedSession.mainSection,
      subSection: this.selectedSession.subSection || undefined,
      questionsAnswered: this.selectedSession.questionsAnswered || 0,
      correctAnswers: this.selectedSession.correctAnswers || 0,
      incorrectAnswers: this.selectedSession.incorrectAnswers || 0,
      timeSpent: timeValue,
      accuracy: this.selectedSession.questionsAnswered > 0 ?
        (this.selectedSession.correctAnswers / this.selectedSession.questionsAnswered) * 100 : 0,
      avgTimePerQuestion: this.selectedSession.questionsAnswered > 0 ?
        timeValue / this.selectedSession.questionsAnswered : 0
    }];
  }

  /**
   * Check if modal can be opened in historical-only mode
   * @returns True if historical sessions exist
   */
  get canOpenHistoricalMode(): boolean {
    return this.previousSessions.length > 0;
  }

  /**
   * Check if currently viewing historical data
   * @returns True if viewing historical session data
   */
  get isViewingHistoricalData(): boolean {
    return this.comparisonMode === 'compare' || (!!this.selectedSession && this.selectedSessionId !== 'current');
  }

  /**
   * Check if comparison mode is available
   * @returns True if can compare (historical session selected and current session exists)
   */
  get canCompare(): boolean {
    if (this.isProgressTracking) {
      return !!this.selectedSession && this.selectedSessionId !== 'current' && !!this.progressSession;
    } else {
      return !!this.selectedSession && this.selectedSessionId !== 'current' && !!this.correctAnswers.total;
    }
  }

  /**
   * Get tooltip text for comparison button
   * @returns Tooltip explaining why comparison is disabled or how to use it
   */
  get comparisonTooltip(): string {
    if (this.isProgressTracking && !this.progressSession) {
      return 'No hay sesión actual para comparar';
    }
    if (!this.isProgressTracking && !this.correctAnswers.total) {
      return 'No hay datos del examen actual para comparar';
    }
    if (!this.selectedSession || this.selectedSessionId === 'current') {
      return 'Selecciona una sesión histórica para habilitar la comparación';
    }
    return this.comparisonModeText;
  }

  /**
   * Get tooltip text for save button
   * @returns Tooltip explaining why save is disabled
   */
  get saveTooltip(): string {
    if (!this.hasTrackingData) {
      return 'No hay datos de sesión para guardar';
    }
    if (this.selectedSession && this.selectedSessionId !== 'current') {
      return 'Guardar la sesión actual (no los datos históricos)';
    }
    return 'Guardar sesión actual en Firebase';
  }


  /**
   * Get current session as TestSession for comparison
   */
  getCurrentSessionAsTestSession(): TestSession | null {
    if (this.isProgressTracking && this.progressSession) {
      return {
        id: 'current',
        userId: this.progressSession.sessionId,
        timestamp: this.progressSession.startTime,
        mode: this.progressSession.mode,
        mainSection: this.progressSession.mainSection,
        subSection: this.progressSession.subSection,
        questionsAnswered: this.progressSession.questionsAnswered,
        correctAnswers: this.progressSession.correctAnswers,
        incorrectAnswers: this.progressSession.incorrectAnswers,
        blankAnswers: this.progressSession.totalQuestions - this.progressSession.questionsAnswered,
        timeSpent: Math.floor(this.progressSession.timeElapsed / 1000),
        completed: true
      };
    } else if (!this.isProgressTracking && this.correctAnswers.total) {
      const total = this.correctAnswers.total;
      
      // Build section breakdown for test mode
      const sectionBreakdown: SectionProgressData[] = [];
      Object.keys(this.correctAnswers).forEach(sectionName => {
        if (sectionName !== 'total' && this.correctAnswers[sectionName]) {
          const sectionData = this.correctAnswers[sectionName];
          const questionsAnswered = sectionData.correct + sectionData.incorrect;
          
          if (questionsAnswered > 0) {
            sectionBreakdown.push({
              sectionName: sectionName,
              questionsAnswered: questionsAnswered,
              correctAnswers: sectionData.correct,
              incorrectAnswers: sectionData.incorrect,
              blankAnswers: sectionData.blank,
              timeSpent: 0,
              accuracy: questionsAnswered > 0 ? (sectionData.correct / questionsAnswered) * 100 : 0
            });
          }
        }
      });
      
      return {
        id: 'current',
        userId: this.userId || '',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: this.determineMainSection(),
        subSection: this.currentSubsection,
        questionsAnswered: total.correct + total.incorrect,
        correctAnswers: total.correct,
        incorrectAnswers: total.incorrect,
        blankAnswers: total.blank,
        timeSpent: this.testService.getElapsedTime(),
        completed: true,
        testScore: this.overallScore,
        sectionBreakdown: sectionBreakdown // Include section breakdown
      };
    }
    return null;
  }

  /**
   * Switch active tab
   */
  switchTab(tab: 'data' | 'charts'): void {
    this.activeTab = tab;
  }

  /**
   * Check if section has accuracy difference data
   */
  hasAccuracyDiff(section: SectionProgressData | SectionProgressDataWithComparison): section is SectionProgressDataWithComparison {
    return 'accuracyDiff' in section && section.accuracyDiff !== undefined && section.accuracyDiff !== null;
  }

  /**
   * Get accuracy difference for a section (only call if hasAccuracyDiff returns true)
   */
  getAccuracyDiff(section: SectionProgressData | SectionProgressDataWithComparison): number {
    if (this.hasAccuracyDiff(section)) {
      return section.accuracyDiff!;
    }
    return 0;
  }

  /**
   * Get accuracy percentage for a section
   * @param section - Section progress data
   * @returns Accuracy percentage
   */
  getSectionAccuracy(section: SectionProgressData): number {
    if (section.accuracy !== undefined) {
      return section.accuracy;
    }
    if (section.questionsAnswered === 0) return 0;
    return (section.correctAnswers / section.questionsAnswered) * 100;
  }

  /**
   * Get accuracy level class for styling
   * @param section - Section progress data
   * @returns CSS class for accuracy level
   */
  getSectionAccuracyLevel(section: SectionProgressData): string {
    const accuracy = this.getSectionAccuracy(section);
    if (accuracy >= 85) return 'excellent';
    if (accuracy >= 70) return 'good';
    return 'needs-improvement';
  }

  /**
   * Format time spent in readable format
   * @param timeMs - Time in milliseconds
   * @returns Formatted time string
   */
  formatTimeSpent(timeMs: number): string {
    if (timeMs === 0) return '-';
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Format average time per question for a section
   * @param section - Section progress data
   * @returns Formatted average time string
   */
  formatAverageTimePerQuestion(section: SectionProgressData): string {
    if (section.questionsAnswered === 0) return '-';
    const averageMs = section.timeSpent / section.questionsAnswered;
    const averageSeconds = Math.floor(averageMs / 1000);
    return `${averageSeconds}s`;
  }

  /**
   * Check if there's tracking data to save
   * @returns True if there's data worth saving
   */
  get hasTrackingData(): boolean {
    if (!this.isProgressTracking || !this.progressSession) return false;
    return this.progressSession.questionsAnswered > 0;
  }

  /**
   * Get current session accuracy percentage
   * @returns Current session accuracy
   */
  getSessionAccuracy(): number {
    if (!this.progressSession) return 0;
    if (this.progressSession.questionsAnswered === 0) return 0;
    return (this.progressSession.correctAnswers / this.progressSession.questionsAnswered) * 100;
  }

  /**
   * Get historical session accuracy percentage
   * @returns Historical session accuracy
   */
  getHistoricalAccuracy(): number {
    if (!this.selectedSession) return 0;
    if (this.selectedSession.questionsAnswered === 0) return 0;
    return (this.selectedSession.correctAnswers / this.selectedSession.questionsAnswered) * 100;
  }

  /**
   * Get accuracy difference between sessions
   * @returns Accuracy difference in percentage points
   */
  getAccuracyDifference(): number {
    return this.getSessionAccuracy() - this.getHistoricalAccuracy();
  }

  /**
   * Format time value in milliseconds to readable format
   * @param timeMs - Time in milliseconds
   * @returns Formatted time string
   */
  formatTime(timeMs: number): string {
    if (timeMs === 0) return '-';
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Access to Math for template use
   */
  get Math() {
    return Math;
  }

  /**
   * Access to Date for template use
   */
  get Date() {
    return Date;
  }

  /**
   * Format date timestamp to readable string
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Format number to Spanish locale
   */
  formatSpanishNumber(value: number, decimals: number = 2): string {
    return formatSpanishNumber(value, decimals);
  }

  /**
   * Format percentage to Spanish locale
   */
  formatSpanishPercentage(value: number, decimals: number = 1): string {
    return formatSpanishPercentage(value, decimals);
  }

  /**
   * Get chart data for selected session with aggregation
   */
  getSelectedSessionChartData(): SectionProgressData[] {
    if (!this.selectedSession) {
      return [];
    }
    
    const rawData = this.chartDataService.convertSessionToChartData(this.selectedSession);
    return this.aggregateByMainSection(rawData);
  }

  /**
   * Determine the main section based on answers
   * Returns the section name if all answers are from one section, or 'Varias' if mixed
   */
  private determineMainSection(): string {
    if (!this.correctAnswers) return 'Varias';
    
    // Get all sections that have questions answered (excluding 'total')
    const sectionsWithAnswers = Object.keys(this.correctAnswers)
      .filter(section => section !== 'total' && this.correctAnswers[section])
      .filter(section => {
        const sectionData = this.correctAnswers[section];
        return (sectionData.correct + sectionData.incorrect) > 0;
      });
    
    // If answers come from exactly one section, return that section name
    if (sectionsWithAnswers.length === 1) {
      return sectionsWithAnswers[0];
    }
    
    // If answers come from multiple sections or no sections, return 'Varias'
    return 'Varias';
  }

  /**
   * Get comparison metrics for test exam sessions
   */
  private getTestExamComparisonMetrics() {
    if (!this.selectedSession || !this.correctAnswers.total) return null;

    const currentTotal = this.correctAnswers.total.correct + this.correctAnswers.total.incorrect;
    const currentCorrect = this.correctAnswers.total.correct;
    const currentIncorrect = this.correctAnswers.total.incorrect;
    const currentAvgTime = 0;

    const historicalTotal = this.selectedSession.questionsAnswered || 0;
    const historicalCorrect = this.selectedSession.correctAnswers || 0;
    const historicalIncorrect = this.selectedSession.incorrectAnswers || 0;
    const historicalAvgTime = 0;

    return {
      questionsAnswered: {
        current: currentTotal,
        historical: historicalTotal,
        diff: currentTotal - historicalTotal,
        percentChange: historicalTotal > 0 ? ((currentTotal - historicalTotal) / historicalTotal) * 100 : 0
      },
      correctAnswers: {
        current: currentCorrect,
        historical: historicalCorrect,
        diff: currentCorrect - historicalCorrect,
        percentChange: historicalCorrect > 0 ? ((currentCorrect - historicalCorrect) / historicalCorrect) * 100 : 0
      },
      incorrectAnswers: {
        current: currentIncorrect,
        historical: historicalIncorrect,
        diff: currentIncorrect - historicalIncorrect,
        percentChange: historicalIncorrect > 0 ? ((currentIncorrect - historicalIncorrect) / historicalIncorrect) * 100 : 0
      },
      avgTimePerQuestion: {
        current: currentAvgTime,
        historical: historicalAvgTime,
        diff: 0,
        percentChange: 0
      },
      subsections: {
        current: [],
        historical: [],
        new: [],
        continued: [],
        dropped: []
      }
    };
  }

  /**
   * Get chart data for the charts container
   * @returns SectionProgressData array for charts
   */
  // Cache the chart data to prevent infinite loops
  private _chartData: SectionProgressData[] | null = null;
  private _lastProgressSession: CurrentSessionProgress | null = null;

  // Cached chart data property
  private _cachedChartData: SectionProgressData[] | null = null;
  private _lastCorrectAnswers: TestServiceAnswers | null = null;

  getChartData(): SectionProgressData[] {
    // Check if we can use cached data for test mode
    if (!this.isProgressTracking && this._cachedChartData && this._lastCorrectAnswers === this.correctAnswers) {
      return this._cachedChartData;
    }

    // Check if we can use cached data for progress tracking
    if (this.isProgressTracking && this._chartData && this._lastProgressSession === this.progressSession) {
      return this._chartData;
    }

    // Generate new data using shared service
    if (this.isProgressTracking && this.progressSession) {
      // Clear cache
      this._chartData = null;
      this._lastProgressSession = this.progressSession;
      
      const rawData = this.chartDataService.buildSectionDataFromProgressSession(this.progressSession);
      this._chartData = this.aggregateByMainSection(rawData);
      return this._chartData;
    } else if (!this.isProgressTracking && this.correctAnswers) {
      // Cache the current correctAnswers reference
      this._lastCorrectAnswers = this.correctAnswers;
      
      // Convert TestServiceAnswers to SectionProgressData format using shared service
      const rawData = this.chartDataService.convertTestServiceAnswersToChartData(this.correctAnswers);
      this._cachedChartData = this.aggregateByMainSection(rawData);
      
      return this._cachedChartData;
    }
    
    return [];
  }

  /**
   * Aggregate section data by main section to avoid duplicate sections in charts
   */
  private aggregateByMainSection(data: SectionProgressData[]): SectionProgressData[] {
    const aggregated = new Map<string, SectionProgressData>();
    const hasTotal = data.some(item => item.sectionName === 'total');
    
    for (const item of data) {
      const mainSection = item.sectionName;
      
      if (aggregated.has(mainSection)) {
        // Merge with existing section data
        const existing = aggregated.get(mainSection)!;
        aggregated.set(mainSection, {
          sectionName: mainSection,
          subSection: undefined, // Don't show subsection in aggregated data
          questionsAnswered: existing.questionsAnswered + item.questionsAnswered,
          correctAnswers: existing.correctAnswers + item.correctAnswers,
          incorrectAnswers: existing.incorrectAnswers + item.incorrectAnswers,
          blankAnswers: (existing.blankAnswers || 0) + (item.blankAnswers || 0),
          timeSpent: existing.timeSpent + item.timeSpent,
          accuracy: 0, // Will be recalculated
          avgTimePerQuestion: 0 // Will be recalculated
        });
      } else {
        // Add new section
        aggregated.set(mainSection, {
          ...item,
          subSection: undefined // Don't show subsection in aggregated data
        });
      }
    }
    
    // Recalculate accuracy and avg time for aggregated data
    const result = Array.from(aggregated.values());
    for (const section of result) {
      section.accuracy = section.questionsAnswered > 0 
        ? (section.correctAnswers / section.questionsAnswered) * 100 
        : 0;
      section.avgTimePerQuestion = section.questionsAnswered > 0 
        ? section.timeSpent / section.questionsAnswered 
        : 0;
    }
    
    // Count sections with actual data (excluding 'total')
    // Include sections that have blank answers even if no questions answered yet
    const sectionsWithData = result.filter(s => 
      s.sectionName !== 'total' && 
      (s.questionsAnswered > 0 || (s.blankAnswers && s.blankAnswers > 0))
    );
    
    // If there was no total in the original data and we have more than one section with data, calculate and add it
    if (!hasTotal && sectionsWithData.length > 1) {
      const total: SectionProgressData = {
        sectionName: 'total',
        subSection: undefined,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        blankAnswers: 0,
        timeSpent: 0,
        accuracy: 0,
        avgTimePerQuestion: 0
      };
      
      // Sum up all sections (excluding 'total' if it somehow exists)
      for (const section of result) {
        if (section.sectionName !== 'total') {
          total.questionsAnswered += section.questionsAnswered;
          total.correctAnswers += section.correctAnswers;
          total.incorrectAnswers += section.incorrectAnswers;
          total.blankAnswers = (total.blankAnswers || 0) + (section.blankAnswers || 0);
          total.timeSpent += section.timeSpent;
        }
      }
      
      // Calculate accuracy and avg time for total
      total.accuracy = total.questionsAnswered > 0 
        ? (total.correctAnswers / total.questionsAnswered) * 100 
        : 0;
      total.avgTimePerQuestion = total.questionsAnswered > 0 
        ? total.timeSpent / total.questionsAnswered 
        : 0;
      
      result.push(total);
    }
    
    return result;
  }

  /**
   * Save test exam and close modal
   */
  async saveTestAndClose(): Promise<void> {
    if (!this.isProgressTracking && this.userId && this.correctAnswers.total) {
      try {
        // Save the test exam session
        await this.saveCurrentSession();
      } catch {
        // Error saving test exam
      }
    }
    this.handleCloseClick();
  }

  /**
   * Review answers - allows users to check their answers
   * Minimizes modal to show test with answers revealed
   */
  reviewAnswers(): void {
    // Minimize the modal instead of closing it
    this.isMinimized = true;
    this.onMinimizeChange.emit(true);
  }

  /**
   * Toggle minimize/maximize state of the modal
   */
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    this.onMinimizeChange.emit(this.isMinimized);
  }

  /**
   * Handle session selection change from charts tab
   */
  onChartSessionChanged(sessionId: string): void {
    this.selectedSessionId = sessionId;
    this.onSessionSelect();
  }

  /**
   * Handle comparison mode change from charts tab
   */
  onChartComparisonModeChanged(mode: 'individual' | 'compare'): void {
    this.comparisonMode = mode;
  }
}
