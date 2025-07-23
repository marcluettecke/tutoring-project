import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressIndicatorComponent } from './progress-indicator.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { CurrentSessionProgress } from '../../models/progress.model';
import { NavigationEnd } from '@angular/router';

describe('ProgressIndicatorComponent', () => {
  let component: ProgressIndicatorComponent;
  let mockProgressService: any;
  let mockTestService: any;
  let mockRouter: any;
  let currentSessionSubject: BehaviorSubject<CurrentSessionProgress | null>;
  let routerEventsSubject: Subject<any>;

  beforeEach(() => {
    currentSessionSubject = new BehaviorSubject<CurrentSessionProgress | null>(null);
    routerEventsSubject = new Subject();

    mockProgressService = {
      currentSession$: currentSessionSubject,
      isTrackingEnabled: true,
      updateSessionProgress: vi.fn(),
      getElapsedTime: vi.fn().mockReturnValue(0)
    };

    mockTestService = {
      correctAnswers: {
        total: { correct: 0, incorrect: 0, blank: 0 }
      },
      modalMinimized: new BehaviorSubject<boolean>(false)
    };

    mockRouter = {
      url: '/home',
      events: routerEventsSubject
    };

    component = new ProgressIndicatorComponent(
      mockProgressService,
      mockTestService,
      mockRouter
    );
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with hidden state', () => {
      expect(component.isVisible).toBe(false);
      expect(component.isCollapsed).toBe(false);
    });
  });

  describe('Visibility Rules', () => {
    const activeSession: CurrentSessionProgress = {
      sessionId: 'test-session',
      startTime: Date.now(),
      mainSection: 'administrativo',
      isActive: true,
      questionsAnswered: 5,
      correctAnswers: 3,
      incorrectAnswers: 2,
      totalQuestions: 100,
      timeElapsed: 300000,
      sectionBreakdown: [],
      currentStreak: 0,
      longestStreak: 0,
      mode: 'practice'
    };

    beforeEach(() => {
      component.ngOnInit();
    });

    it('should be visible on home route with active tracking session', () => {
      mockRouter.url = '/home';
      mockProgressService.isTrackingEnabled = true;
      currentSessionSubject.next(activeSession);
      
      expect(component.isVisible).toBe(true);
    });

    it('should be hidden on restricted routes even with active session', () => {
      const hiddenRoutes = ['/login', '/admin', '/test', '/results', '/exam-configuration'];
      mockProgressService.isTrackingEnabled = true;
      currentSessionSubject.next(activeSession);
      
      hiddenRoutes.forEach(route => {
        mockRouter.url = route;
        component['updateVisibility']();
        expect(component.isVisible).toBe(false);
      });
    });

    it('should be hidden when no active session', () => {
      mockRouter.url = '/home';
      mockProgressService.isTrackingEnabled = false;
      currentSessionSubject.next(null);
      
      expect(component.isVisible).toBe(false);
    });

    it('should update visibility on route navigation', () => {
      mockProgressService.isTrackingEnabled = true;
      currentSessionSubject.next(activeSession);
      
      // Start on home (visible)
      mockRouter.url = '/home';
      routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
      expect(component.isVisible).toBe(true);
      
      // Navigate to results (hidden)
      mockRouter.url = '/results';
      routerEventsSubject.next(new NavigationEnd(2, '/results', '/results'));
      expect(component.isVisible).toBe(false);
      
      // Navigate back to home (visible again)
      mockRouter.url = '/home';
      routerEventsSubject.next(new NavigationEnd(3, '/home', '/home'));
      expect(component.isVisible).toBe(true);
    });
  });

  describe('Session Progress', () => {
    it('should update session when receiving new data', () => {
      const session: CurrentSessionProgress = {
        sessionId: 'test-session',
          startTime: Date.now(),
          mainSection: 'administrativo',
        isActive: true,
        questionsAnswered: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
        totalQuestions: 100,
        timeElapsed: 600000,
        sectionBreakdown: [],
      currentStreak: 0,
      longestStreak: 0,
      mode: 'practice'
      };

      component.ngOnInit();
      currentSessionSubject.next(session);
      
      expect(component.currentSession).toEqual(session);
    });

    it('should calculate accuracy percentage correctly', () => {
      const session: CurrentSessionProgress = {
        sessionId: 'test-session',
          startTime: Date.now(),
          mainSection: 'administrativo',
        isActive: true,
        questionsAnswered: 20,
        correctAnswers: 15,
        incorrectAnswers: 5,
        totalQuestions: 100,
        timeElapsed: 1200000,
        sectionBreakdown: [],
      currentStreak: 0,
      longestStreak: 0,
      mode: 'practice'
      };

      component.currentSession = session;
      expect(component.accuracyPercentage).toBe(75);
    });

    it('should handle zero questions answered', () => {
      const session: CurrentSessionProgress = {
        sessionId: 'test-session',
          startTime: Date.now(),
          mainSection: 'administrativo',
        isActive: true,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalQuestions: 100,
        timeElapsed: 0,
        sectionBreakdown: [],
      currentStreak: 0,
      longestStreak: 0,
      mode: 'practice'
      };

      component.currentSession = session;
      expect(component.accuracyPercentage).toBe(0);
    });
  });

  describe('Time Formatting', () => {
    it('should format elapsed time correctly', () => {
      const session: CurrentSessionProgress = {
        sessionId: 'test-session',
          startTime: Date.now() - 125000, // 2 minutes 5 seconds ago
          mainSection: 'administrativo',
        isActive: true,
        questionsAnswered: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        totalQuestions: 100,
        timeElapsed: 125000,
        sectionBreakdown: [],
      currentStreak: 0,
      longestStreak: 0,
      mode: 'practice'
      };

      // Mock getElapsedTime to return 125000ms (2:05)
      mockProgressService.getElapsedTime.mockReturnValue(125000);
      
      component.currentSession = session;
      expect(component.elapsedTimeText).toBe('2:05');
    });

    it('should handle null session', () => {
      component.currentSession = null;
      expect(component.elapsedTimeText).toBe('0:00');
    });
  });

  describe('Collapse Functionality', () => {
    it('should toggle collapsed state', () => {
      expect(component.isCollapsed).toBe(false);
      
      component.toggleCollapsed();
      expect(component.isCollapsed).toBe(true);
      
      component.toggleCollapsed();
      expect(component.isCollapsed).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});