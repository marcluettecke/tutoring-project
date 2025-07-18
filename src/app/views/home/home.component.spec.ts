import { describe, it, expect, vi, beforeEach, MockedObject } from 'vitest';
import { HomeComponent } from './home.component';
import { of, throwError, Subject } from 'rxjs';
import { QuestionsService } from '../../services/questions.service';
import { TestService } from '../../services/test.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let mockQuestionService: MockedObject<QuestionsService>;
  let mockTestService: MockedObject<TestService>;

  beforeEach(() => {
    mockQuestionService = {
      getSpecificQuestions: vi.fn().mockReturnValue(of([
        { id: '1', question: 'Q1', questionIndex: 2 },
        { id: '2', question: 'Q2', questionIndex: 1 },
        { id: '3', question: 'Q3', questionIndex: 3 }
      ]))
    } as unknown as MockedObject<QuestionsService>;

    mockTestService = {
      resetAllAnswers: vi.fn()
    } as unknown as MockedObject<TestService>;

    component = new HomeComponent(
      mockQuestionService as unknown as QuestionsService, 
      mockTestService as unknown as TestService
    );
  });

  describe('Initialization', () => {
    it('should reset test service on init', () => {
      component.ngOnInit();

      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
    });

    it('should reset test service before any other operations', () => {
      const callOrder: string[] = [];
      
      mockTestService.resetAllAnswers.mockImplementation(() => {
        callOrder.push('resetAllAnswers');
      });

      mockQuestionService.getSpecificQuestions.mockImplementation(() => {
        callOrder.push('getSpecificQuestions');
        return of([]);
      });

      component.ngOnInit();
      component.updateData();

      // Verify reset happens first
      expect(callOrder[0]).toBe('resetAllAnswers');
    });
  });

  describe('Question Loading', () => {
    it('should load and sort questions by index', () => {
      component.activeSection = {
        mainSection: 'administrativo',
        subSection: 'sub1',
        mainSectionNumber: 1,
        subSectionNumber: 1
      };

      component.updateData();

      expect(mockQuestionService.getSpecificQuestions).toHaveBeenCalledWith('administrativo', 'sub1');
      expect(component.questions).toHaveLength(3);
      expect(component.questions[0].questionIndex).toBe(1);
      expect(component.questions[1].questionIndex).toBe(2);
      expect(component.questions[2].questionIndex).toBe(3);
    });

    it('should handle errors when loading questions', () => {
      mockQuestionService.getSpecificQuestions.mockReturnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.activeSection = {
        mainSection: 'administrativo',
        subSection: 'sub1',
        mainSectionNumber: 1,
        subSectionNumber: 1
      };

      component.updateData();

      expect(component.errorMessage).toBeTruthy();
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar expanded state', () => {
      expect(component.sidebarExpanded).toBe(true);
      
      component.toggleSidebarExpanded(false);
      expect(component.sidebarExpanded).toBe(false);
      
      component.toggleSidebarExpanded(true);
      expect(component.sidebarExpanded).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroy$ = new Subject<void>();
      const nextSpy = vi.spyOn(destroy$, 'next');
      const completeSpy = vi.spyOn(destroy$, 'complete');
      
      // Replace the private destroy$ with our spy
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