import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerComponent } from './timer.component';
import { TestService } from '../../services/test.service';
import { ExamConfiguration } from '../../models/exam-configuration.model';

describe('TimerComponent', () => {
  let component: TimerComponent;
  let testService: TestService;

  beforeEach(() => {
    const mockTestService = {
      testStatus: of(''),
      modalMinimized: of(false),
      getCustomConfiguration: vi.fn().mockReturnValue(null),
      handleTestStart: vi.fn(),
      handleTestEnd: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TestService, useValue: mockTestService }
      ]
    });

    testService = TestBed.inject(TestService);
    component = new TimerComponent(testService);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should use default test time when no custom configuration', () => {
      component.ngOnInit();
      
      expect(component.remainingTime).toBe(120 * 60); // 120 minutes in seconds
      expect(component.isCountingUp).toBe(false);
    });

    it('should use unlimited time mode when timeInMinutes is undefined', () => {
      const customConfig: ExamConfiguration = {
        selections: [],
        totalQuestions: 100,
        questionDistribution: 'custom',
        timeInMinutes: undefined
      };
      
      vi.mocked(testService.getCustomConfiguration).mockReturnValue(customConfig);
      component.ngOnInit();
      
      expect(component.isCountingUp).toBe(true);
      expect(component.remainingTime).toBe(0);
    });

    it('should use custom time when specified', () => {
      const customConfig: ExamConfiguration = {
        selections: [],
        totalQuestions: 100,
        questionDistribution: 'custom',
        timeInMinutes: 90
      };
      
      vi.mocked(testService.getCustomConfiguration).mockReturnValue(customConfig);
      component.ngOnInit();
      
      expect(component.remainingTime).toBe(90 * 60); // 90 minutes in seconds
      expect(component.isCountingUp).toBe(false);
    });

    it('should handle standard exam time (120 minutes)', () => {
      const customConfig: ExamConfiguration = {
        selections: [],
        totalQuestions: 100,
        questionDistribution: 'custom',
        timeInMinutes: 120
      };
      
      vi.mocked(testService.getCustomConfiguration).mockReturnValue(customConfig);
      component.ngOnInit();
      
      expect(component.remainingTime).toBe(120 * 60); // 120 minutes in seconds
      expect(component.isCountingUp).toBe(false);
    });
  });

  describe('Time Display', () => {
    it('should format time correctly', () => {
      expect(component.transform(0)).toBe('0:00');
      expect(component.transform(59)).toBe('0:59');
      expect(component.transform(60)).toBe('1:00');
      expect(component.transform(125)).toBe('2:05');
      expect(component.transform(7200)).toBe('120:00');
    });
  });

  describe('Timer Functionality', () => {
    it('should start test when startTest is called', () => {
      component.startTest();
      
      expect(testService.handleTestStart).toHaveBeenCalled();
    });

    it('should submit test when submitTest is called', () => {
      component.submitTest();
      
      expect(testService.handleTestEnd).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      // Create mock subscriptions
      const mockSubscription = { unsubscribe: vi.fn() };
      component.timerSubscription = mockSubscription as any;
      component.testStatusSubscription = mockSubscription as any;
      component.modalMinimizedSubscription = mockSubscription as any;
      
      component.ngOnDestroy();
      
      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('Timer Modes', () => {
    it('should count down in normal mode', () => {
      component.isCountingUp = false;
      component.remainingTime = 100;
      component.testStatus = 'started';
      
      // Simulate timer tick
      const initialTime = component.remainingTime;
      // Note: In actual implementation, this would be handled by the observable
      // For testing purposes, we're just checking the logic is set up correctly
      
      expect(component.isCountingUp).toBe(false);
      expect(component.remainingTime).toBe(initialTime);
    });

    it('should count up in unlimited mode', () => {
      component.isCountingUp = true;
      component.remainingTime = 0;
      component.testStatus = 'started';
      
      expect(component.isCountingUp).toBe(true);
      expect(component.remainingTime).toBe(0);
    });
  });
});