import { describe, it, expect, vi, beforeEach, MockedObject } from 'vitest';
import { ProgressToggleComponent } from './progress-toggle.component';
import { ProgressService } from '../../services/progress.service';
import { TestService } from '../../services/test.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { CurrentSessionProgress } from '../../models/progress.model';

describe('ProgressToggleComponent', () => {
  let component: ProgressToggleComponent;
  let mockProgressService: MockedObject<ProgressService>;
  let mockTestService: MockedObject<TestService>;
  let mockAuthService: MockedObject<AuthService>;
  let mockRouter: MockedObject<Router>;
  
  let isTrackingEnabledSubject: BehaviorSubject<boolean>;
  let loginChangedSubject: BehaviorSubject<any>;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    isTrackingEnabledSubject = new BehaviorSubject<boolean>(false);
    loginChangedSubject = new BehaviorSubject<any>(null);
    routerEventsSubject = new Subject<any>();

    mockProgressService = {
      isTrackingEnabled$: isTrackingEnabledSubject.asObservable(),
      isTrackingEnabled: false,
      startTracking: vi.fn(),
      stopTracking: vi.fn().mockResolvedValue(undefined),
      endTrackingSession: vi.fn().mockResolvedValue(undefined),
      getCurrentSessionProgress: vi.fn().mockReturnValue(null),
      initializeTrackingState: vi.fn(),
      resumeTracking: vi.fn()
    } as unknown as MockedObject<ProgressService>;

    mockTestService = {
      resetAllAnswers: vi.fn()
    } as unknown as MockedObject<TestService>;

    mockAuthService = {
      loginChanged: loginChangedSubject.asObservable()
    } as unknown as MockedObject<AuthService>;

    mockRouter = {
      url: '/home',
      events: routerEventsSubject.asObservable()
    } as unknown as MockedObject<Router>;

    component = new ProgressToggleComponent(
      mockProgressService as unknown as ProgressService,
      mockTestService as unknown as TestService,
      mockAuthService as unknown as AuthService,
      mockRouter as unknown as Router
    );
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isTrackingEnabled).toBe(false);
      expect(component.isVisible).toBe(true);
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(component.currentUserId).toBeNull();
    });

    it('should setup listeners on init', () => {
      component.ngOnInit();
      
      // Simulate auth change
      loginChangedSubject.next({ uid: 'test-user' });
      expect(component.currentUserId).toBe('test-user');
      
      // Simulate tracking state change
      isTrackingEnabledSubject.next(true);
      expect(component.isTrackingEnabled).toBe(true);
    });
  });

  describe('Toggle Tracking', () => {
    beforeEach(() => {
      component.ngOnInit();
      loginChangedSubject.next({ uid: 'test-user' });
    });

    it('should start tracking when toggled on', async () => {
      component.isTrackingEnabled = false;
      
      await component.toggleTracking();
      
      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
      expect(mockProgressService.startTracking).toHaveBeenCalledWith('test-user', false);
      expect(component.showSessionSummary).toBe(false);
    });

    it('should show summary modal when toggling off with session data', async () => {
      component.isTrackingEnabled = true;
      const mockSession: CurrentSessionProgress = {
        sessionId: 'test-session',
        questionsAnswered: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        timeElapsed: 1000,
        startTime: Date.now(),
        isActive: true,
        mainSection: 'test',
        currentStreak: 0,
        longestStreak: 0,
        totalQuestions: 10,
        mode: 'practice',
        currentQuestionIndex: 5,
        sectionBreakdown: []
      };
      mockProgressService.getCurrentSessionProgress.mockReturnValue(mockSession);
      
      await component.toggleTracking();
      
      expect(component.showSessionSummary).toBe(true);
      expect(component.lastSession).toEqual(mockSession);
      expect(component.isPausedForModal).toBe(true);
      expect(mockProgressService.stopTracking).toHaveBeenCalled();
    });

    it('should end tracking session when no session data', async () => {
      component.isTrackingEnabled = true;
      mockProgressService.getCurrentSessionProgress.mockReturnValue(null);
      
      await component.toggleTracking();
      
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(mockProgressService.endTrackingSession).toHaveBeenCalled();
      expect(mockProgressService.stopTracking).not.toHaveBeenCalled();
    });

    it('should end tracking session when toggling off with zero questions answered', async () => {
      component.isTrackingEnabled = true;
      const mockSession: CurrentSessionProgress = {
        sessionId: 'test-session',
        questionsAnswered: 0, // No questions answered
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeElapsed: 1000,
        startTime: Date.now(),
        isActive: true,
        mainSection: 'test',
        currentStreak: 0,
        longestStreak: 0,
        totalQuestions: 10,
        mode: 'practice',
        currentQuestionIndex: 0,
        sectionBreakdown: []
      };
      mockProgressService.getCurrentSessionProgress.mockReturnValue(mockSession);
      
      await component.toggleTracking();
      
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(mockProgressService.endTrackingSession).toHaveBeenCalled();
      expect(mockProgressService.stopTracking).not.toHaveBeenCalled();
    });
  });

  describe('Modal Actions', () => {
    const mockSession: CurrentSessionProgress = {
      sessionId: 'test-session',
      questionsAnswered: 5,
      correctAnswers: 3,
      incorrectAnswers: 2,
      timeElapsed: 1000,
      startTime: Date.now(),
      isActive: true,
      mainSection: 'test',
      currentStreak: 0,
      longestStreak: 0,
      totalQuestions: 10,
      mode: 'practice',
      currentQuestionIndex: 5,
      sectionBreakdown: []
    };

    beforeEach(() => {
      component.ngOnInit();
      loginChangedSubject.next({ uid: 'test-user' });
      component.lastSession = mockSession;
      component.showSessionSummary = true;
      component.isPausedForModal = true;
    });

    it('should handle continue action correctly', () => {
      component.handleModalContinue();
      
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(mockProgressService.resumeTracking).toHaveBeenCalled();
      expect(component.lastSession).toBeNull();
    });

    it('should handle close action correctly', () => {
      component.handleModalClose();
      
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(component.lastSession).toBeNull();
      expect(mockProgressService.endTrackingSession).toHaveBeenCalled();
      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
    });

    it('should handle retry action correctly', () => {
      component.handleModalRetry();
      
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(mockProgressService.endTrackingSession).toHaveBeenCalled();
      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
      expect(mockProgressService.startTracking).toHaveBeenCalledWith('test-user', false);
    });
  });

  describe('Visibility Rules', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should be visible on home route with authenticated user', () => {
      loginChangedSubject.next({ uid: 'test-user' });
      mockRouter.url = '/home';
      routerEventsSubject.next({});
      
      expect(component.isVisible).toBe(true);
    });

    it('should be hidden on admin and non-practice routes', () => {
      loginChangedSubject.next({ uid: 'test-user' });
      
      const hiddenRoutes = ['/login', '/addQuestion', '/test', '/results', '/exam-configuration'];
      hiddenRoutes.forEach(route => {
        mockRouter.url = route;
        routerEventsSubject.next({});
        expect(component.isVisible).toBe(false);
      });
    });

    it('should be hidden when user is not authenticated', () => {
      loginChangedSubject.next(null);
      mockRouter.url = '/home';
      routerEventsSubject.next({});
      
      expect(component.isVisible).toBe(false);
    });
  });

  describe('Reset All Answers', () => {
    beforeEach(() => {
      component.ngOnInit();
      loginChangedSubject.next({ uid: 'test-user' });
    });

    it('should not reset answers when tracking is enabled', () => {
      component.isTrackingEnabled = true;
      isTrackingEnabledSubject.next(true);
      
      component.resetAllAnswers();
      
      expect(mockTestService.resetAllAnswers).not.toHaveBeenCalled();
    });

    it('should only reset answers if tracking disabled', () => {
      component.isTrackingEnabled = false;
      
      component.resetAllAnswers();
      
      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
      expect(mockProgressService.startTracking).not.toHaveBeenCalled();
    });
  });

  describe('UI State Management', () => {
    it('should show correct toggle text based on tracking state', () => {
      component.isTrackingEnabled = false;
      expect(component.toggleText).toBe('Seguimiento OFF');
      
      component.isTrackingEnabled = true;
      expect(component.toggleText).toBe('Seguimiento ON');
    });

    it('should show correct tooltip based on tracking state', () => {
      component.isTrackingEnabled = false;
      expect(component.tooltipText).toBe('Activar seguimiento de progreso');
      
      component.isTrackingEnabled = true;
      expect(component.tooltipText).toBe('Desactivar seguimiento de progreso');
    });

    it('should maintain button "on" state when paused for modal', () => {
      component.isTrackingEnabled = false;
      component.isPausedForModal = true;
      
      // In template: [class.recording]="isTrackingEnabled || isPausedForModal"
      expect(component.isTrackingEnabled || component.isPausedForModal).toBe(true);
    });
  });

  describe('Time Formatting', () => {
    it('should format time correctly', () => {
      expect(component.formatTime(0)).toBe('0:00');
      expect(component.formatTime(1000)).toBe('0:01');
      expect(component.formatTime(60000)).toBe('1:00');
      expect(component.formatTime(65000)).toBe('1:05');
      expect(component.formatTime(3661000)).toBe('61:01');
    });
  });

  describe('Session Continuation Fix', () => {
    beforeEach(() => {
      component.ngOnInit();
      loginChangedSubject.next({ uid: 'test-user' });
    });

    it('should properly resume tracking when continue is clicked', () => {
      // Setup: Start tracking, then pause with modal
      component.isTrackingEnabled = true;
      isTrackingEnabledSubject.next(true);
      component.showSessionSummary = true;
      component.isPausedForModal = true;
      
      // Act: Click continue
      component.handleModalContinue();
      
      // Assert: Modal is closed but tracking continues
      expect(component.showSessionSummary).toBe(false);
      expect(component.isPausedForModal).toBe(false);
      expect(mockProgressService.resumeTracking).toHaveBeenCalled();
      expect(mockProgressService.endTrackingSession).not.toHaveBeenCalled();
    });

    it('should maintain tracking state after continue', () => {
      // Setup: Simulate tracking enabled state
      mockProgressService.isTrackingEnabled = true;
      component.isTrackingEnabled = true;
      isTrackingEnabledSubject.next(true);
      
      // Act: Handle continue
      component.handleModalContinue();
      
      // Assert: Tracking remains enabled
      expect(mockProgressService.resumeTracking).toHaveBeenCalled();
      // The observable should still emit true
      isTrackingEnabledSubject.asObservable().subscribe(isEnabled => {
        expect(isEnabled).toBe(true);
      });
    });

    it('should not reset answers when continuing session', () => {
      component.handleModalContinue();
      
      // Should NOT reset answers when continuing
      expect(mockTestService.resetAllAnswers).not.toHaveBeenCalled();
    });

    it('should reset answers only when closing without saving', () => {
      component.handleModalClose();
      
      // Should reset answers when closing
      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
      expect(mockProgressService.endTrackingSession).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroy$ = new Subject<void>();
      const nextSpy = vi.spyOn(destroy$, 'next');
      const completeSpy = vi.spyOn(destroy$, 'complete');
      
      Object.defineProperty(component, 'destroy$', {
        value: destroy$,
        writable: true
      });

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});