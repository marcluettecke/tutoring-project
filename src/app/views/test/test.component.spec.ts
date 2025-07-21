import { describe, it, expect, vi, beforeEach, MockedObject } from 'vitest';
import { TestComponent } from './test.component';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { QUESTIONWEIGHTS } from './constants';
import { QuestionsService } from '../../services/questions.service';
import { TestService } from '../../services/test.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

describe('TestComponent', () => {
  let component: TestComponent;
  let mockQuestionsService: MockedObject<QuestionsService>;
  let mockTestService: MockedObject<TestService>;
  let mockAuthService: MockedObject<AuthService>;
  let mockRouter: MockedObject<Router>;

  const mockQuestions = [
    // Administrativo questions (25 total)
    ...Array(25).fill(0).map((_, i) => ({
      id: `admin-${i}`,
      questionText: `Admin question ${i}`,
      questionIndex: i,
      answers: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' }
      ],
      correctAnswer: 'a',
      explanation: 'Test explanation',
      mainSection: 'administrativo',
      subSection: 'general',
      subSectionIndex: 0
    })),
    // Medio ambiente questions (30 total)
    ...Array(30).fill(0).map((_, i) => ({
      id: `medio-${i}`,
      questionText: `Medio ambiente question ${i}`,
      questionIndex: i,
      answers: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' }
      ],
      correctAnswer: 'b',
      explanation: 'Test explanation',
      mainSection: 'medio ambiente',
      subSection: 'general',
      subSectionIndex: 0
    })),
    // Costas questions (25 total)
    ...Array(25).fill(0).map((_, i) => ({
      id: `costas-${i}`,
      questionText: `Costas question ${i}`,
      questionIndex: i,
      answers: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' }
      ],
      correctAnswer: 'c',
      explanation: 'Test explanation',
      mainSection: 'costas',
      subSection: 'general',
      subSectionIndex: 0
    })),
    // Aguas questions (40 total)
    ...Array(40).fill(0).map((_, i) => ({
      id: `aguas-${i}`,
      questionText: `Aguas question ${i}`,
      questionIndex: i,
      answers: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' }
      ],
      correctAnswer: 'd',
      explanation: 'Test explanation',
      mainSection: 'aguas',
      subSection: 'general',
      subSectionIndex: 0
    }))
  ];

  beforeEach(() => {
    mockQuestionsService = {
      getQuestions: vi.fn().mockReturnValue(of(mockQuestions))
    } as unknown as MockedObject<QuestionsService>;

    mockTestService = {
      testStatus: new BehaviorSubject<string>('idle'),
      resetAllAnswers: vi.fn(),
      handleTestStart: vi.fn(),
      getCustomConfiguration: vi.fn().mockReturnValue(null),
      clearCustomConfiguration: vi.fn(),
      updateCustomQuestionCount: vi.fn()
    } as unknown as MockedObject<TestService>;

    mockAuthService = {
      loginChanged: { value: { uid: 'test-user-id' } }
    } as unknown as MockedObject<AuthService>;

    mockRouter = {
      navigate: vi.fn()
    } as unknown as MockedObject<Router>;

    component = new TestComponent(
      mockQuestionsService as unknown as QuestionsService,
      mockTestService as unknown as TestService,
      mockAuthService as unknown as AuthService,
      mockRouter as unknown as Router
    );
  });

  describe('Initialization', () => {
    it('should redirect to exam configuration if no custom config exists', () => {
      mockTestService.getCustomConfiguration = vi.fn().mockReturnValue(null);
      
      component.ngOnInit();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/exam-configuration']);
    });
  });

  describe('Question Filtering', () => {
    beforeEach(() => {
      // Mock custom configuration for standard exam
      const customConfig = {
        selections: [
          { mainSection: 'administrativo', subsections: [], questionCount: 20 },
          { mainSection: 'medio ambiente', subsections: [], questionCount: 25 },
          { mainSection: 'costas', subsections: [], questionCount: 20 },
          { mainSection: 'aguas', subsections: [], questionCount: 35 }
        ],
        totalQuestions: 100,
        questionDistribution: 'custom'
      };
      mockTestService.getCustomConfiguration = vi.fn().mockReturnValue(customConfig);
    });

    it('should filter questions according to QUESTIONWEIGHTS', () => {
      component.ngOnInit();

      // Total filtered questions should match sum of QUESTIONWEIGHTS
      const expectedTotal = Object.values(QUESTIONWEIGHTS).reduce((sum, val) => sum + val, 0);
      expect(component.filteredQuestions.length).toBe(expectedTotal);

      // Check each section has correct number of questions
      const adminQuestions = component.filteredQuestions.filter(q => q.mainSection === 'administrativo');
      const medioQuestions = component.filteredQuestions.filter(q => q.mainSection === 'medio ambiente');
      const costasQuestions = component.filteredQuestions.filter(q => q.mainSection === 'costas');
      const aguasQuestions = component.filteredQuestions.filter(q => q.mainSection === 'aguas');

      expect(adminQuestions.length).toBe(QUESTIONWEIGHTS['administrativo']);
      expect(medioQuestions.length).toBe(QUESTIONWEIGHTS['medio ambiente']);
      expect(costasQuestions.length).toBe(QUESTIONWEIGHTS['costas']);
      expect(aguasQuestions.length).toBe(QUESTIONWEIGHTS['aguas']);
    });

    it('should handle sections with fewer questions than QUESTIONWEIGHTS', () => {
      // Create a scenario where we have fewer questions than weights require
      const limitedQuestions = [
        // Only 10 administrativo questions (weight requires 20)
        ...Array(10).fill(0).map((_, i) => ({
          id: `admin-${i}`,
          questionText: `Admin question ${i}`,
          questionIndex: i,
          answers: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
            { id: 'c', text: 'C' },
            { id: 'd', text: 'D' }
          ],
          correctAnswer: 'a',
          explanation: 'Test explanation',
          mainSection: 'administrativo',
          subSection: 'general',
          subSectionIndex: 0
        })),
        // Sufficient questions for other sections
        ...Array(30).fill(0).map((_, i) => ({
          id: `medio-${i}`,
          questionText: `Medio ambiente question ${i}`,
          questionIndex: i,
          answers: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
            { id: 'c', text: 'C' },
            { id: 'd', text: 'D' }
          ],
          correctAnswer: 'b',
          explanation: 'Test explanation',
          mainSection: 'medio ambiente',
          subSection: 'general',
          subSectionIndex: 0
        }))
      ];

      mockQuestionsService.getQuestions.mockReturnValue(of(limitedQuestions));
      component.ngOnInit();

      // Should only include available questions
      const adminQuestions = component.filteredQuestions.filter(q => q.mainSection === 'administrativo');
      expect(adminQuestions.length).toBe(10); // Only 10 available, not 20 from weights
    });

    it('should randomize question selection', () => {
      component.ngOnInit();
      const firstRun = [...component.filteredQuestions];

      // Reset and run again
      component.filteredQuestions = [];
      component.filterQuestions();
      const secondRun = [...component.filteredQuestions];

      // While total count should be same, order should likely be different
      expect(firstRun.length).toBe(secondRun.length);
      
      // Check if at least some questions are in different positions
      // (small chance they could be identical by random chance)
      let differences = 0;
      for (let i = 0; i < firstRun.length; i++) {
        if (firstRun[i]?.id !== secondRun[i]?.id) {
          differences++;
        }
      }
      
      // Expect at least some differences (statistical test, not guaranteed)
      expect(differences).toBeGreaterThan(0);
    });

    it('should use 0-based array indexing correctly', () => {
      component.ngOnInit();

      // All filtered questions should be defined (no undefined due to off-by-one errors)
      component.filteredQuestions.forEach(question => {
        expect(question).toBeDefined();
        expect(question.id).toBeDefined();
        expect(question.mainSection).toBeDefined();
      });
    });
  });

  describe('Test Lifecycle', () => {
    beforeEach(() => {
      // Mock custom configuration for standard exam
      const customConfig = {
        selections: [
          { mainSection: 'administrativo', subsections: [], questionCount: 20 },
          { mainSection: 'medio ambiente', subsections: [], questionCount: 25 },
          { mainSection: 'costas', subsections: [], questionCount: 20 },
          { mainSection: 'aguas', subsections: [], questionCount: 35 }
        ],
        totalQuestions: 100,
        questionDistribution: 'custom'
      };
      mockTestService.getCustomConfiguration = vi.fn().mockReturnValue(customConfig);
    });

    it('should reset test service when retrying', () => {
      component.ngOnInit();
      const initialQuestions = [...component.filteredQuestions];

      component.onRetryTest();

      expect(mockTestService.resetAllAnswers).toHaveBeenCalled();
      expect(mockTestService.handleTestStart).toHaveBeenCalled();
      expect(component.modalOpen).toBe(false);
      
      // Should have new set of filtered questions
      expect(component.filteredQuestions.length).toBe(initialQuestions.length);
    });

    it('should navigate to exam configuration when continuing after test', () => {
      component.onContinueTest();

      expect(mockTestService.clearCustomConfiguration).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/exam-configuration']);
      expect(component.modalOpen).toBe(false);
    });

    it('should navigate home when closing modal', () => {
      component.onModalClose();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
      expect(component.modalOpen).toBe(false);
    });
  });

  describe('Modal Management', () => {
    beforeEach(() => {
      // Mock custom configuration for standard exam
      const customConfig = {
        selections: [
          { mainSection: 'administrativo', subsections: [], questionCount: 20 },
          { mainSection: 'medio ambiente', subsections: [], questionCount: 25 },
          { mainSection: 'costas', subsections: [], questionCount: 20 },
          { mainSection: 'aguas', subsections: [], questionCount: 35 }
        ],
        totalQuestions: 100,
        questionDistribution: 'custom'
      };
      mockTestService.getCustomConfiguration = vi.fn().mockReturnValue(customConfig);
    });

    it('should open modal when test ends', async () => {
      const testStatusSubject = new BehaviorSubject<string>('idle');
      mockTestService.testStatus = testStatusSubject;
      
      component = new TestComponent(
        mockQuestionsService as unknown as QuestionsService,
        mockTestService as unknown as TestService,
        mockAuthService as unknown as AuthService,
        mockRouter as unknown as Router
      );

      component.ngOnInit();
      
      // Emit test ended status
      testStatusSubject.next('ended');
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(component.modalOpen).toBe(true);
      expect(component.testStatus).toBe('ended');
    });

    it('should track current user ID', () => {
      component.ngOnInit();
      expect(component.currentUserId).toBe('test-user-id');
    });
  });
});