import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, setDoc, getDoc, updateDoc, query, where, orderBy, limit, getDocs, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { TestSession, SectionProgress, UserProgress, CurrentSessionProgress, SectionSummary, SectionProgressData, TestServiceAnswers } from '../models/progress.model';
import { TestService } from './test.service';

/**
 * Service for handling user progress tracking and persistence
 * Integrates with existing TestService for seamless progress tracking
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private currentSessionSubject = new BehaviorSubject<CurrentSessionProgress | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private userProgressSubject = new BehaviorSubject<UserProgress | null>(null);
  public userProgress$ = this.userProgressSubject.asObservable();

  private isTrackingEnabledSubject = new BehaviorSubject<boolean>(false);
  public isTrackingEnabled$ = this.isTrackingEnabledSubject.asObservable();

  private inactivityWarningSubject = new BehaviorSubject<boolean>(false);
  public inactivityWarning$ = this.inactivityWarningSubject.asObservable();

  private currentUserId: string | null = null;
  private inactivityTimer: number | null = null;
  private warningTimer: number | null = null;
  private lastActivityTime: number = 0;
  private lastAnswerTimestamp: number | null = null;
  private pausedAt: number | null = null;
  private totalPausedTime: number = 0;

  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly WARNING_TIMEOUT = 60 * 1000; // 60 seconds in milliseconds
  private readonly SESSION_STATE_KEY = 'progressSessionState';
  private readonly SESSION_STATE_MAX_AGE = 12 * 60 * 60 * 1000; // 12 hours

  constructor(
    private firestore: Firestore,
    private testService: TestService
  ) {}

  /**
   * Enables progress tracking for a user and initializes or resumes a session
   * Stores preferences in localStorage and starts inactivity monitoring
   * @param userId The unique identifier for the user
   * @param preserveExistingAnswers Whether to preserve existing answered questions
   */
  startTracking(userId: string, preserveExistingAnswers: boolean = false): void {
    this.currentUserId = userId;
    this.isTrackingEnabledSubject.next(true);
    
    localStorage.setItem('progressTrackingEnabled', 'true');
    localStorage.setItem('progressTrackingUserId', userId);
    
    // Check if there's an existing session to resume
    const existingSession = this.currentSessionSubject.value;
    const restoredSession = this.restoreSessionState();
    
    if ((existingSession && existingSession.isActive) || (restoredSession && restoredSession.isActive)) {
      // Resume existing session
      if (restoredSession && !existingSession) {
        // Note: pausedAt and totalPausedTime are already restored by restoreSessionState()
        this.currentSessionSubject.next(restoredSession);
        this.lastAnswerTimestamp = restoredSession.lastAnswerTimestamp || null;
      }
    } else {
      // Start new session
      if (!preserveExistingAnswers) {
        this.testService.resetAllAnswers();
      }
      this.lastAnswerTimestamp = null;
      // Reset all time tracking variables
      this.pausedAt = null;
      this.totalPausedTime = 0;
      // Clear any existing session state before starting fresh
      this.currentSessionSubject.next(null);
      this.clearSessionState();
      this.startBasicSession(userId);
    }
    
    this.startInactivityMonitoring();
  }

  /**
   * Initializes a basic progress tracking session with default values
   * @param userId The unique identifier for the user
   */
  private startBasicSession(userId: string): void {
    const sessionId = `${userId}_${Date.now()}`;
    
    // Reset pause tracking for new session
    this.pausedAt = null;
    this.totalPausedTime = 0;
    
    const currentProgress: CurrentSessionProgress = {
      sessionId,
      startTime: Date.now(),
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeElapsed: 0,
      isActive: true,
      mainSection: 'Varias', // Use 'Varias' to indicate multiple sections will be tracked
      subSection: undefined,
      currentStreak: 0,
      longestStreak: 0,
      totalQuestions: 0,
      mode: 'practice',
      currentQuestionIndex: 0,
      sectionBreakdown: []
    };

    this.currentSessionSubject.next(currentProgress);
    this.saveSessionState();
  }

  /**
   * Disables progress tracking but keeps session data for potential resume
   * Pauses the current session without ending it
   */
  async stopTracking(): Promise<void> {
    this.isTrackingEnabledSubject.next(false);
    this.inactivityWarningSubject.next(false);
    
    // Pause the timer when stopping tracking
    this.pauseSessionTimer();
    
    // Save current session state but keep it active for potential resume
    this.saveSessionState();
    
    this.clearInactivityTimers();
    
    // Update localStorage to indicate tracking is paused, not ended
    localStorage.setItem('progressTrackingEnabled', 'false');
    // Keep the userId so we can resume later
    // Don't clear session state - we want to resume it later
  }

  /**
   * Resume a paused tracking session
   * Used when user clicks "continue" after pausing
   */
  resumeTracking(): void {
    if (!this.currentUserId) return;
    
    this.isTrackingEnabledSubject.next(true);
    localStorage.setItem('progressTrackingEnabled', 'true');
    
    // Try to restore the session state
    const restoredSession = this.restoreSessionState();
    if (restoredSession && restoredSession.isActive) {
      // Restore the session and continue
      // Resume the timer properly (accumulating paused time)
      this.resumeSessionTimer();
      this.currentSessionSubject.next(restoredSession);
      this.lastAnswerTimestamp = restoredSession.lastAnswerTimestamp || null;
    }
    
    // Resume with existing session - don't create a new one
    // Make sure timer is resumed if not already
    this.resumeSessionTimer();
    this.startInactivityMonitoring();
  }

  /**
   * Completely ends the current tracking session and clears all data
   * Used when user explicitly wants to end the session (e.g., saving results)
   */
  async endTrackingSession(): Promise<void> {
    const currentSession = this.currentSessionSubject.value;
    if (currentSession && currentSession.isActive) {
      await this.endCurrentSession('user_ended_session');
    }
    
    this.isTrackingEnabledSubject.next(false);
    this.inactivityWarningSubject.next(false);
    this.clearInactivityTimers();
    this.lastAnswerTimestamp = null;
    
    localStorage.removeItem('progressTrackingEnabled');
    localStorage.removeItem('progressTrackingUserId');
    this.clearSessionState();
  }

  /**
   * Gets the current progress tracking enabled state
   * @returns True if progress tracking is currently enabled
   */
  get isTrackingEnabled(): boolean {
    return this.isTrackingEnabledSubject.value;
  }

  /**
   * Clear expired session state from localStorage
   */
  private clearExpiredSessionState(): void {
    try {
      const savedState = localStorage.getItem(this.SESSION_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const sessionAge = Date.now() - parsed.timestamp;
        
        // If session is older than max age, clear it
        if (sessionAge > this.SESSION_STATE_MAX_AGE) {
          localStorage.removeItem(this.SESSION_STATE_KEY);
        }
      }
    } catch {
      // Error checking session state
    }
  }

  /**
   * Restores progress tracking state from localStorage on application startup
   * Automatically resumes tracking if it was previously enabled
   */
  initializeTrackingState(): void {
    // First clear any expired sessions
    this.clearExpiredSessionState();
    
    const isEnabled = localStorage.getItem('progressTrackingEnabled') === 'true';
    const userId = localStorage.getItem('progressTrackingUserId');
    
    if (isEnabled && userId) {
      this.currentUserId = userId;
      
      // Restore session state if available
      const restoredSession = this.restoreSessionState();
      if (restoredSession && restoredSession.isActive) {
        // Continue the existing active session
        this.isTrackingEnabledSubject.next(true);
        // Note: pausedAt and totalPausedTime are already restored by restoreSessionState()
        this.currentSessionSubject.next(restoredSession);
        this.lastAnswerTimestamp = restoredSession.lastAnswerTimestamp || null;
        this.startInactivityMonitoring();
      } else {
        // No active session, don't auto-start a new one
        // User should explicitly start tracking when they want to
        this.isTrackingEnabledSubject.next(false);
        localStorage.setItem('progressTrackingEnabled', 'false');
      }
    }
  }

  /**
   * Records user activity to reset inactivity timers
   * Should be called whenever the user interacts with the application
   */
  recordActivity(): void {
    if (!this.isTrackingEnabled) return;
    
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();
  }

  /**
   * Start inactivity monitoring
   */
  private startInactivityMonitoring(): void {
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();
    
    // Listen for user interactions
    document.addEventListener('click', this.handleActivity.bind(this));
    document.addEventListener('keypress', this.handleActivity.bind(this));
    document.addEventListener('mousemove', this.handleActivity.bind(this));
    document.addEventListener('scroll', this.handleActivity.bind(this));
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    this.recordActivity();
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    this.clearInactivityTimers();
    
    // Set 10-minute inactivity timer
    this.inactivityTimer = window.setTimeout(() => {
      this.showInactivityWarning();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Show inactivity warning modal
   */
  private showInactivityWarning(): void {
    this.inactivityWarningSubject.next(true);
    
    // Set 60-second warning timer
    this.warningTimer = window.setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.WARNING_TIMEOUT);
  }

  /**
   * Handle inactivity timeout (auto-stop tracking)
   */
  private handleInactivityTimeout(): void {
    this.inactivityWarningSubject.next(false);
    this.stopTracking();
  }

  /**
   * Extend tracking session (called when user clicks extend)
   */
  extendSession(): void {
    this.inactivityWarningSubject.next(false);
    this.clearInactivityTimers();
    this.recordActivity();
  }

  /**
   * Manually dismisses the inactivity warning modal
   * Used when user clicks to close or wants to continue without extending
   */
  dismissInactivityWarning(): void {
    this.inactivityWarningSubject.next(false);
    this.clearInactivityTimers();
    this.recordActivity();
  }

  /**
   * Clear all inactivity timers
   */
  private clearInactivityTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    // Remove event listeners
    document.removeEventListener('click', this.handleActivity.bind(this));
    document.removeEventListener('keypress', this.handleActivity.bind(this));
    document.removeEventListener('mousemove', this.handleActivity.bind(this));
    document.removeEventListener('scroll', this.handleActivity.bind(this));
  }

  /**
   * End current session
   */
  private async endCurrentSession(_reason: string): Promise<void> {
    const currentSession = this.currentSessionSubject.value;
    if (currentSession && currentSession.isActive) {
      // Mark session as ended
      const endedSession: CurrentSessionProgress = {
        ...currentSession,
        isActive: false,
        timeElapsed: this.getElapsedTime(currentSession.startTime)
      };
      
      this.currentSessionSubject.next(endedSession);
      this.saveSessionState();
      
      // Don't automatically save sessions - only save when user explicitly clicks save
      // Session ended without auto-saving: User can manually save if desired
    }
  }

  /**
   * Convert CurrentSessionProgress to TestSession and save to Firebase
   */
  async saveProgressSessionToFirebase(session: CurrentSessionProgress): Promise<void> {
    if (!this.currentUserId) return;

    const testSession: TestSession = {
      id: session.sessionId,
      userId: this.currentUserId,
      timestamp: session.startTime,
      mode: session.mode,
      mainSection: session.mainSection,
      subSection: session.subSection,
      questionsAnswered: session.questionsAnswered,
      correctAnswers: session.correctAnswers,
      incorrectAnswers: session.incorrectAnswers,
      blankAnswers: 0, // Progress sessions don't track blanks the same way
      timeSpent: Math.floor(session.timeElapsed / 1000), // Convert to seconds
      completed: true,
      score: session.questionsAnswered > 0 ? (session.correctAnswers / session.questionsAnswered) * 100 : 0,
      testScore: session.correctAnswers - (0.33 * session.incorrectAnswers),
      sectionBreakdown: session.sectionBreakdown // Include section breakdown
    };

    await this.saveCompletedSession(testSession);
  }

  /**
   * Start a new progress tracking session
   * @param userId - User ID
   * @param mainSection - Main section being studied
   * @param subSection - Optional subsection
   * @param totalQuestions - Total questions in the section
   * @param mode - Practice or test mode
   * @returns Session ID
   */
  async startSession(
    userId: string, 
    mainSection: string, 
    subSection: string | undefined, 
    totalQuestions: number,
    mode: 'practice' | 'test'
  ): Promise<string> {
    // Only start session if tracking is enabled
    if (!this.isTrackingEnabled) {
      throw new Error('Progress tracking is not enabled');
    }

    const sessionId = `${userId}_${Date.now()}`;
    
    // Reset pause tracking for new session
    this.pausedAt = null;
    this.totalPausedTime = 0;
    
    const session: TestSession = {
      id: sessionId,
      userId,
      timestamp: Date.now(),
      mode,
      mainSection,
      subSection,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      blankAnswers: 0,
      timeSpent: 0,
      completed: false
    };

    const currentProgress: CurrentSessionProgress = {
      sessionId,
      mainSection,
      subSection,
      totalQuestions,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      currentStreak: 0,
      longestStreak: 0,
      timeElapsed: 0,
      startTime: Date.now(),
      isActive: true,
      mode,
      currentQuestionIndex: 0,
      sectionBreakdown: []
    };

    // Save to Firebase
    const userProgressRef = doc(this.firestore, 'userProgress', userId);
    const sessionRef = collection(userProgressRef, 'sessions');
    await addDoc(sessionRef, session);

    // Update local state
    this.currentSessionSubject.next(currentProgress);

    return sessionId;
  }

  /**
   * Update progress when a question is answered
   * @param userId - User ID
   * @param sessionId - Current session ID
   * @param isCorrect - Whether the answer was correct
   * @param timeSpent - Time spent on this question
   * @param questionIndex - Current question index
   */
  async updateQuestionProgress(
    userId: string,
    sessionId: string,
    isCorrect: boolean,
    timeSpent: number,
    questionIndex?: number
  ): Promise<void> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || currentSession.sessionId !== sessionId) {
      throw new Error('No active session found');
    }

    // Update local progress
    const updatedProgress: CurrentSessionProgress = {
      ...currentSession,
      questionsAnswered: currentSession.questionsAnswered + 1,
      correctAnswers: isCorrect ? currentSession.correctAnswers + 1 : currentSession.correctAnswers,
      incorrectAnswers: !isCorrect ? currentSession.incorrectAnswers + 1 : currentSession.incorrectAnswers,
      currentStreak: isCorrect ? currentSession.currentStreak + 1 : 0,
      longestStreak: isCorrect ? Math.max(currentSession.longestStreak, currentSession.currentStreak + 1) : currentSession.longestStreak,
      timeElapsed: currentSession.timeElapsed + timeSpent,
      currentQuestionIndex: questionIndex
    };

    this.currentSessionSubject.next(updatedProgress);
    this.saveSessionState();

    // Update Firebase session document
    const sessionRef = doc(this.firestore, 'userProgress', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      questionsAnswered: updatedProgress.questionsAnswered,
      correctAnswers: updatedProgress.correctAnswers,
      incorrectAnswers: updatedProgress.incorrectAnswers,
      timeSpent: updatedProgress.timeElapsed,
      score: updatedProgress.questionsAnswered > 0 ? (updatedProgress.correctAnswers / updatedProgress.questionsAnswered) * 100 : 0
    });
  }

  /**
   * Complete the current session and integrate with TestService if in test mode
   * @param userId - User ID
   * @param sessionId - Session ID to complete
   * @param finalTestResults - Optional test results from TestService
   */
  async completeSession(userId: string, sessionId: string, finalTestResults?: TestServiceAnswers): Promise<SectionSummary> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || currentSession.sessionId !== sessionId) {
      throw new Error('No active session found');
    }

    // Calculate final metrics
    const blankAnswers = currentSession.totalQuestions - currentSession.questionsAnswered;
    const accuracyPercentage = currentSession.questionsAnswered > 0 ? (currentSession.correctAnswers / currentSession.questionsAnswered) * 100 : 0;
    
    // If in test mode, get the actual test score from TestService
    let testScore: number | undefined;
    if (currentSession.mode === 'test' && finalTestResults) {
      // Extract test score from TestService results
      testScore = this.calculateTestScore(finalTestResults);
    }

    const completedSession: TestSession = {
      id: sessionId,
      userId,
      timestamp: Date.now(),
      mode: currentSession.mode,
      mainSection: currentSession.mainSection,
      subSection: currentSession.subSection,
      questionsAnswered: currentSession.questionsAnswered,
      correctAnswers: currentSession.correctAnswers,
      incorrectAnswers: currentSession.incorrectAnswers,
      blankAnswers,
      timeSpent: currentSession.timeElapsed,
      completed: true,
      score: accuracyPercentage,
      testScore, // Include test score if available
      sectionBreakdown: currentSession.sectionBreakdown // Include section breakdown
    };

    // Mark session as completed in Firebase
    const sessionRef = doc(this.firestore, 'userProgress', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      completed: true,
      timeSpent: currentSession.timeElapsed,
      blankAnswers,
      score: accuracyPercentage,
      testScore,
      sectionBreakdown: currentSession.sectionBreakdown // Include section breakdown
    });

    // Update aggregated user progress
    await this.updateUserProgress(userId, completedSession);

    // Get previous best for comparison
    const previousBest = await this.getPreviousBestSession(userId, currentSession.mainSection, currentSession.subSection);

    // Create section summary
    const summary: SectionSummary = {
      mainSection: currentSession.mainSection,
      subSection: currentSession.subSection,
      currentSession: completedSession,
      previousBest: previousBest || undefined,
      improvement: {
        accuracyChange: previousBest ? (completedSession.score || 0) - (previousBest.score || 0) : 0,
        timeChange: previousBest ? completedSession.timeSpent - previousBest.timeSpent : 0,
        scoreChange: previousBest ? (completedSession.score || 0) - (previousBest.score || 0) : 0
      },
      recommendations: this.generateRecommendations(completedSession, previousBest || undefined),
      newAchievements: [] // Will be populated by UserStatsService
    };

    // Clear current session
    this.currentSessionSubject.next(null);
    this.clearSessionState();

    return summary;
  }

  /**
   * Get user's overall progress
   * @param userId - User ID
   * @returns Observable of user progress
   */
  getUserProgress(userId: string): Observable<UserProgress> {
    const userProgressRef = doc(this.firestore, 'userProgress', userId);
    const sessionsRef = collection(userProgressRef, 'sessions');
    const sessionsQuery = query(sessionsRef, orderBy('timestamp', 'desc'), limit(50));

    return collectionData(sessionsQuery, { idField: 'id' }).pipe(
      map((sessions) => {
        const typedSessions = sessions as TestSession[];
        return this.calculateUserProgress(userId, typedSessions);
      })
    );
  }

  /**
   * Get current session progress
   * @returns Current session progress or null
   */
  getCurrentSessionProgress(): CurrentSessionProgress | null {
    return this.currentSessionSubject.value;
  }

  /**
   * Pause the session timer
   */
  pauseSessionTimer(): void {
    if (!this.pausedAt) {
      this.pausedAt = Date.now();
    }
  }

  /**
   * Resume the session timer
   */
  resumeSessionTimer(): void {
    if (this.pausedAt) {
      this.totalPausedTime += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
  }

  /**
   * Get elapsed time accounting for pauses
   */
  getElapsedTime(startTime: number): number {
    const now = this.pausedAt || Date.now();
    return now - startTime - this.totalPausedTime;
  }

  /**
   * Get the actual session duration without recalculating from start time
   * This prevents showing incorrect times for resumed sessions
   */
  getSessionDuration(): number {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) return 0;
    
    // If we have a stored timeElapsed, use it as the base
    // Only add time since last activity, not since session start
    if (this.lastAnswerTimestamp && !this.pausedAt) {
      const timeSinceLastAnswer = Date.now() - this.lastAnswerTimestamp;
      // Only add reasonable amounts of time (less than inactivity timeout)
      if (timeSinceLastAnswer < this.INACTIVITY_TIMEOUT) {
        return currentSession.timeElapsed + timeSinceLastAnswer;
      }
    }
    
    return currentSession.timeElapsed;
  }

  /**
   * Update progress from TestService data
   * @param testServiceAnswers - Current answers from TestService
   */
  updateFromTestService(testServiceAnswers: TestServiceAnswers): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || !testServiceAnswers.total) return;

    // Build section breakdown from TestService data
    const sectionBreakdown: SectionProgressData[] = [];
    
    // Iterate through all sections in testServiceAnswers (excluding 'total')
    Object.keys(testServiceAnswers).forEach(sectionName => {
      if (sectionName !== 'total' && testServiceAnswers[sectionName]) {
        const sectionData = testServiceAnswers[sectionName];
        const questionsAnswered = sectionData.correct + sectionData.incorrect;
        
        if (questionsAnswered > 0) {
          sectionBreakdown.push({
            sectionName: sectionName,
            questionsAnswered: questionsAnswered,
            correctAnswers: sectionData.correct,
            incorrectAnswers: sectionData.incorrect,
            blankAnswers: sectionData.blank,
            timeSpent: 0, // Time tracking would need to be done per-section
            accuracy: questionsAnswered > 0 ? (sectionData.correct / questionsAnswered) * 100 : 0
          });
        }
      }
    });

    const updatedProgress: CurrentSessionProgress = {
      ...currentSession,
      questionsAnswered: testServiceAnswers.total.correct + testServiceAnswers.total.incorrect,
      correctAnswers: testServiceAnswers.total.correct,
      incorrectAnswers: testServiceAnswers.total.incorrect,
      timeElapsed: this.getSessionDuration(),
      sectionBreakdown: sectionBreakdown
    };

    this.currentSessionSubject.next(updatedProgress);
    this.saveSessionState();
    this.resetInactivityTimer();
  }

  /**
   * Record a question answer for section-specific tracking
   * @param questionSection - Main section of the question
   * @param questionSubSection - Subsection of the question (optional)
   * @param isCorrect - Whether the answer was correct
   */
  recordQuestionAnswer(questionSection: string, questionSubSection: string | undefined, isCorrect: boolean): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || !this.isTrackingEnabled) return;

    const now = Date.now();
    
    // Calculate time since last answer (heuristic for time spent on this question)
    // For the first question, use a reasonable default time (30 seconds) instead of 0
    const timeSinceLastAnswer = this.lastAnswerTimestamp 
      ? Math.min(now - this.lastAnswerTimestamp, this.INACTIVITY_TIMEOUT) // Cap at inactivity timeout
      : 30000; // 30 seconds for first question
    this.lastAnswerTimestamp = now;

    // Update section breakdown
    const existingSectionIndex = currentSession.sectionBreakdown.findIndex(s => 
      s.sectionName === questionSection && s.subSection === questionSubSection
    );

    if (existingSectionIndex >= 0) {
      // Update existing section data
      const existingSection = currentSession.sectionBreakdown[existingSectionIndex];
      currentSession.sectionBreakdown[existingSectionIndex] = {
        ...existingSection,
        questionsAnswered: existingSection.questionsAnswered + 1,
        correctAnswers: isCorrect ? existingSection.correctAnswers + 1 : existingSection.correctAnswers,
        incorrectAnswers: !isCorrect ? existingSection.incorrectAnswers + 1 : existingSection.incorrectAnswers,
        timeSpent: existingSection.timeSpent + timeSinceLastAnswer,
        lastQuestionTime: now
      };
    } else {
      // Add new section data
      currentSession.sectionBreakdown.push({
        sectionName: questionSection,
        subSection: questionSubSection,
        questionsAnswered: 1,
        correctAnswers: isCorrect ? 1 : 0,
        incorrectAnswers: isCorrect ? 0 : 1,
        timeSpent: timeSinceLastAnswer,
        firstQuestionTime: now,
        lastQuestionTime: now
      });
    }

    // Update overall session progress
    // Only add the time since last answer, not the total time since session start
    const updatedProgress: CurrentSessionProgress = {
      ...currentSession,
      questionsAnswered: currentSession.questionsAnswered + 1,
      correctAnswers: isCorrect ? currentSession.correctAnswers + 1 : currentSession.correctAnswers,
      incorrectAnswers: !isCorrect ? currentSession.incorrectAnswers + 1 : currentSession.incorrectAnswers,
      timeElapsed: currentSession.timeElapsed + timeSinceLastAnswer,
      sectionBreakdown: currentSession.sectionBreakdown
    };

    this.currentSessionSubject.next(updatedProgress);
    this.saveSessionState();
    this.resetInactivityTimer();
  }


  /**
   * Get section-specific progress
   * @param userId - User ID
   * @param mainSection - Main section
   * @param subSection - Optional subsection
   * @returns Section progress data
   */
  async getSectionProgress(userId: string, mainSection: string, subSection?: string): Promise<SectionProgress | null> {
    const userProgressRef = doc(this.firestore, 'userProgress', userId);
    const sessionsRef = collection(userProgressRef, 'sessions');
    
    let sessionsQuery;
    if (subSection) {
      sessionsQuery = query(
        sessionsRef,
        where('mainSection', '==', mainSection),
        where('subSection', '==', subSection),
        where('completed', '==', true),
        orderBy('timestamp', 'desc')
      );
    } else {
      sessionsQuery = query(
        sessionsRef,
        where('mainSection', '==', mainSection),
        where('completed', '==', true),
        orderBy('timestamp', 'desc')
      );
    }

    const snapshot = await getDocs(sessionsQuery);
    const sessions = snapshot.docs.map(doc => doc.data()) as TestSession[];

    if (sessions.length === 0) {
      return null;
    }

    return this.calculateSectionProgress(mainSection, subSection, sessions);
  }

  /**
   * Calculate test score using TestService logic
   * @param testResults - Results from TestService
   * @returns Calculated test score
   */
  private calculateTestScore(testResults: TestServiceAnswers): number {
    // This would integrate with TestService's scoring logic
    // For now, return a placeholder that matches the TestService calculation
    if (testResults && testResults.total) {
      const correct = testResults.total.correct || 0;
      const incorrect = testResults.total.incorrect || 0;
      const penalty = incorrect * 0.33; // TestService penalty logic
      return Math.max(0, correct - penalty);
    }
    return 0;
  }

  /**
   * Calculate user progress from sessions
   * @param userId - User ID
   * @param sessions - Array of test sessions
   * @returns User progress object
   */
  private calculateUserProgress(userId: string, sessions: TestSession[]): UserProgress {
    const totalSessions = sessions.length;
    const totalQuestionsAnswered = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrectAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalIncorrectAnswers = sessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);
    const totalBlankAnswers = sessions.reduce((sum, s) => sum + s.blankAnswers, 0);
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.timeSpent, 0);

    // Group sessions by section for section progress
    const sectionGroups = sessions.reduce((groups, session) => {
      const key = `${session.mainSection}_${session.subSection || ''}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(session);
      return groups;
    }, {} as Record<string, TestSession[]>);

    const sectionProgress = Object.entries(sectionGroups).map(([key, sessionGroup]) => {
      const [mainSection, subSection] = key.split('_');
      return this.calculateSectionProgress(mainSection, subSection || undefined, sessionGroup);
    });

    return {
      userId,
      overallStats: {
        totalSessions,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        totalIncorrectAnswers,
        totalBlankAnswers,
        overallAccuracy: totalQuestionsAnswered > 0 ? (totalCorrectAnswers / totalQuestionsAnswered) * 100 : 0,
        totalTimeSpent,
        averageSessionTime: totalSessions > 0 ? totalTimeSpent / totalSessions : 0,
        lastActivityDate: sessions[0]?.timestamp || 0,
        firstActivityDate: sessions[sessions.length - 1]?.timestamp || 0
      },
      sectionProgress,
      recentSessions: sessions.slice(0, 10),
      achievements: [] // Will be populated by UserStatsService
    };
  }

  /**
   * Calculate section-specific progress
   * @param mainSection - Main section name
   * @param subSection - Optional subsection name
   * @param sessions - Sessions for this section
   * @returns Section progress object
   */
  private calculateSectionProgress(mainSection: string, subSection: string | undefined, sessions: TestSession[]): SectionProgress {
    const questionsAnswered = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correctAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const incorrectAnswers = sessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);
    const blankAnswers = sessions.reduce((sum, s) => sum + s.blankAnswers, 0);
    const bestScore = Math.max(...sessions.map(s => s.score || 0));
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
    const averageTimePerQuestion = questionsAnswered > 0 ? totalTimeSpent / questionsAnswered : 0;

    // Calculate improvement trend (simple linear trend)
    const sortedSessions = sessions.sort((a, b) => a.timestamp - b.timestamp);
    const improvementTrend = this.calculateImprovementTrend(sortedSessions);

    return {
      mainSection,
      subSection,
      totalQuestions: questionsAnswered + blankAnswers,
      questionsAnswered,
      correctAnswers,
      incorrectAnswers,
      blankAnswers,
      accuracyRate: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0,
      lastUpdated: sessions[0]?.timestamp || 0,
      bestScore,
      attemptsCount: sessions.length,
      averageTimePerQuestion,
      improvementTrend
    };
  }

  /**
   * Calculate improvement trend for a section
   * @param sessions - Sorted sessions by timestamp
   * @returns Improvement trend percentage
   */
  private calculateImprovementTrend(sessions: TestSession[]): number {
    if (sessions.length < 2) return 0;

    const firstHalf = sessions.slice(0, Math.ceil(sessions.length / 2));
    const secondHalf = sessions.slice(Math.ceil(sessions.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + (s.score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + (s.score || 0), 0) / secondHalf.length;

    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  /**
   * Update aggregated user progress in Firebase
   * @param userId - User ID
   * @param session - Completed session
   */
  private async updateUserProgress(userId: string, session: TestSession): Promise<void> {
    const userStatsRef = doc(this.firestore, 'userStats', userId);
    const userStatsDoc = await getDoc(userStatsRef);

    if (userStatsDoc.exists()) {
      // Update existing stats
      const currentStats = userStatsDoc.data();
      const updatedStats = {
        ...currentStats,
        totalSessions: currentStats.totalSessions + 1,
        totalQuestionsAnswered: currentStats.totalQuestionsAnswered + session.questionsAnswered,
        totalCorrectAnswers: currentStats.totalCorrectAnswers + session.correctAnswers,
        totalIncorrectAnswers: currentStats.totalIncorrectAnswers + session.incorrectAnswers,
        totalBlankAnswers: currentStats.totalBlankAnswers + session.blankAnswers,
        totalTimeSpent: currentStats.totalTimeSpent + session.timeSpent,
        lastActivityDate: session.timestamp
      };

      await updateDoc(userStatsRef, updatedStats);
    } else {
      // Create new stats document
      const newStats = {
        userId,
        totalSessions: 1,
        totalQuestionsAnswered: session.questionsAnswered,
        totalCorrectAnswers: session.correctAnswers,
        totalIncorrectAnswers: session.incorrectAnswers,
        totalBlankAnswers: session.blankAnswers,
        totalTimeSpent: session.timeSpent,
        firstActivityDate: session.timestamp,
        lastActivityDate: session.timestamp
      };

      await setDoc(userStatsRef, newStats);
    }
  }

  /**
   * Get previous best session for comparison
   * @param userId - User ID
   * @param mainSection - Main section
   * @param subSection - Optional subsection
   * @returns Best previous session or null
   */
  private async getPreviousBestSession(userId: string, mainSection: string, subSection?: string): Promise<TestSession | null> {
    const userProgressRef = doc(this.firestore, 'userProgress', userId);
    const sessionsRef = collection(userProgressRef, 'sessions');
    
    let sessionsQuery;
    if (subSection) {
      sessionsQuery = query(
        sessionsRef,
        where('mainSection', '==', mainSection),
        where('subSection', '==', subSection),
        where('completed', '==', true),
        orderBy('score', 'desc'),
        limit(1)
      );
    } else {
      sessionsQuery = query(
        sessionsRef,
        where('mainSection', '==', mainSection),
        where('completed', '==', true),
        orderBy('score', 'desc'),
        limit(1)
      );
    }

    const snapshot = await getDocs(sessionsQuery);
    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as TestSession;
  }

  /**
   * Update current session progress (for real-time counter updates)
   * @param sessionProgress - Updated session progress
   */
  updateSessionProgress(sessionProgress: CurrentSessionProgress): void {
    this.currentSessionSubject.next(sessionProgress);
    this.saveSessionState();
  }

  /**
   * Save a completed session directly to Firebase
   * @param session - Completed test session
   */
  async saveCompletedSession(session: TestSession): Promise<void> {
    try {
      const userProgressRef = doc(this.firestore, 'userProgress', session.userId);
      const sessionRef = collection(userProgressRef, 'sessions');
      
      // Clean session data for Firestore (no undefined values)
      const cleanSession = this.sanitizeForFirestore(session);
      
      // Add the session to the user's session collection
      await addDoc(sessionRef, cleanSession);
      
      // Update aggregated user progress
      await this.updateUserProgress(session.userId, session);
    } catch (error) {
      console.error('Error saving completed session:', error);
      console.error('Firestore error details:', error);
      throw error;
    }
  }

  /**
   * Sanitize data for Firestore by replacing undefined values with null
   * @param data - Data object to sanitize
   * @returns Cleaned data object
   */
  private sanitizeForFirestore<T>(data: T): T {
    if (data === null || data === undefined) {
      return null as T;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForFirestore(item)) as T;
    }
    
    if (typeof data === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        cleaned[key] = this.sanitizeForFirestore(value);
      }
      return cleaned as T;
    }
    
    return data;
  }

  /**
   * Generate recommendations based on session performance
   * @param currentSession - Current session data
   * @param previousBest - Previous best session data
   * @returns Array of recommendation strings
   */
  private generateRecommendations(currentSession: TestSession, previousBest?: TestSession): string[] {
    const recommendations: string[] = [];
    const accuracy = currentSession.score || 0;

    if (accuracy < 50) {
      recommendations.push('Consider reviewing the basic concepts for this section');
      recommendations.push('Try practicing with fewer questions at a time to focus on understanding');
    } else if (accuracy < 70) {
      recommendations.push('Good progress! Review the questions you got wrong');
      recommendations.push('Practice similar questions to reinforce your knowledge');
    } else if (accuracy < 85) {
      recommendations.push('Excellent work! Focus on the areas where you made mistakes');
      recommendations.push('Try increasing your practice frequency to maintain momentum');
    } else {
      recommendations.push('Outstanding performance! You\'ve mastered this section');
      recommendations.push('Consider moving to a more challenging section');
    }

    if (previousBest && currentSession.score && previousBest.score) {
      const improvement = currentSession.score - previousBest.score;
      if (improvement > 10) {
        recommendations.push('Great improvement from your previous attempt!');
      } else if (improvement < -10) {
        recommendations.push('Consider taking a break and reviewing the material');
      }
    }

    // Add mode-specific recommendations
    if (currentSession.mode === 'test') {
      recommendations.push('Practice similar test conditions to improve your test performance');
    } else {
      recommendations.push('Consider taking a timed test to simulate exam conditions');
    }

    return recommendations;
  }

  /**
   * Save current session state to localStorage
   */
  private saveSessionState(): void {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) return;
    
    try {
      const stateToSave = {
        session: currentSession,
        lastAnswerTimestamp: this.lastAnswerTimestamp,
        pausedAt: this.pausedAt,
        totalPausedTime: this.totalPausedTime,
        timestamp: Date.now()
      };
      localStorage.setItem(this.SESSION_STATE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Error saving session state
    }
  }

  /**
   * Restore session state from localStorage
   */
  private restoreSessionState(): CurrentSessionProgress | null {
    try {
      const savedState = localStorage.getItem(this.SESSION_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Check if state is too old
        if (Date.now() - parsed.timestamp > this.SESSION_STATE_MAX_AGE) {
          localStorage.removeItem(this.SESSION_STATE_KEY);
          return null;
        }
        
        // Restore pause tracking state
        this.pausedAt = parsed.pausedAt || null;
        this.totalPausedTime = parsed.totalPausedTime || 0;
        
        // Don't recalculate time elapsed - use the stored value
        const session = parsed.session;
        if (session && session.isActive) {
          // Keep the stored timeElapsed value, don't recalculate from start time
          session.lastAnswerTimestamp = parsed.lastAnswerTimestamp;
          this.lastAnswerTimestamp = parsed.lastAnswerTimestamp || null;
          return session;
        }
      }
    } catch {
      // Error restoring session state
    }
    return null;
  }

  /**
   * Clear saved session state from localStorage
   */
  private clearSessionState(): void {
    try {
      localStorage.removeItem(this.SESSION_STATE_KEY);
      // Also reset pause tracking variables when clearing session
      this.pausedAt = null;
      this.totalPausedTime = 0;
    } catch {
      // Error clearing session state
    }
  }
}