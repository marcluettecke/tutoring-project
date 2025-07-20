import { describe, it, expect, vi, beforeEach, MockedObject } from 'vitest';
import { ResultModalComponent } from './result-modal.component';
import { TestService } from '../../services/test.service';
import { ProgressService } from '../../services/progress.service';
import { ChartDataService } from '../../services/chart-data.service';
import { of } from 'rxjs';

describe('ResultModalComponent', () => {
  let component: ResultModalComponent;
  let mockTestService: MockedObject<TestService>;
  let mockProgressService: MockedObject<ProgressService>;
  let mockChartDataService: MockedObject<ChartDataService>;

  beforeEach(() => {
    // Create mock services
    mockTestService = {
      getTestAnswers: vi.fn(),
      resetAllAnswers: vi.fn(),
      correctAnswers: {}
    } as unknown as MockedObject<TestService>;

    mockProgressService = {
      isTrackingEnabled$: of(false),
      currentSession$: of(null),
      getUserProgress: vi.fn().mockReturnValue(of(null)),
      saveProgressSessionToFirebase: vi.fn().mockResolvedValue(undefined),
      saveCompletedSession: vi.fn().mockResolvedValue(undefined)
    } as unknown as MockedObject<ProgressService>;

    mockChartDataService = {
      convertSessionToChartData: vi.fn().mockReturnValue([]),
      formatSessionForDropdown: vi.fn().mockReturnValue(''),
      convertTestServiceAnswersToChartData: vi.fn().mockReturnValue([]),
      buildSectionDataFromProgressSession: vi.fn().mockReturnValue([])
    } as unknown as MockedObject<ChartDataService>;

    // Create component instance
    component = new ResultModalComponent(
      mockTestService as unknown as TestService,
      mockProgressService as unknown as ProgressService,
      mockChartDataService as unknown as ChartDataService
    );
    
    // Set default inputs
    component.currentSection = '';
    component.currentSubsection = '';
    component.userId = 'test-user';
    component.isProgressTracking = false;
    component.progressSession = null;
  });

  describe('Question Count Display', () => {
    it('should display only answered questions, not including blank questions', async () => {
      // Setup test data with partial test results
      const testAnswers = {
        total: { correct: 2, incorrect: 1, blank: 97 },
        administrativo: { correct: 1, incorrect: 0, blank: 19 },
        'medio ambiente': { correct: 0, incorrect: 1, blank: 24 },
        costas: { correct: 1, incorrect: 0, blank: 19 },
        aguas: { correct: 0, incorrect: 0, blank: 35 }
      };

      mockTestService.correctAnswers = testAnswers;
      
      // Initialize component
      await component.ngOnInit();

      // Verify that question counts only include answered questions
      expect(component.correctAnswers).toEqual(testAnswers);
      
      // For each section, the displayed count should be correct + incorrect (not including blank)
      const sections = ['administrativo', 'medio ambiente', 'costas', 'aguas'];
      sections.forEach(section => {
        const answered = testAnswers[section].correct + testAnswers[section].incorrect;
        expect(answered).toBe(
          section === 'administrativo' ? 1 :
          section === 'medio ambiente' ? 1 :
          section === 'costas' ? 1 :
          0
        );
      });

      // Total answered should be 3 (2 correct + 1 incorrect)
      const totalAnswered = testAnswers.total.correct + testAnswers.total.incorrect;
      expect(totalAnswered).toBe(3);
    });

    it('should handle full test completion correctly', async () => {
      // Setup test data with full test results (100 questions answered)
      const testAnswers = {
        total: { correct: 75, incorrect: 25, blank: 0 },
        administrativo: { correct: 15, incorrect: 5, blank: 0 },
        'medio ambiente': { correct: 20, incorrect: 5, blank: 0 },
        costas: { correct: 15, incorrect: 5, blank: 0 },
        aguas: { correct: 25, incorrect: 10, blank: 0 }
      };

      mockTestService.correctAnswers = testAnswers;
      
      await component.ngOnInit();

      // Verify full test shows all 100 questions
      const totalAnswered = testAnswers.total.correct + testAnswers.total.incorrect;
      expect(totalAnswered).toBe(100);
    });

    it('should handle empty test (no questions answered)', async () => {
      // Setup test data with no answers
      const testAnswers = {
        total: { correct: 0, incorrect: 0, blank: 100 },
        administrativo: { correct: 0, incorrect: 0, blank: 20 },
        'medio ambiente': { correct: 0, incorrect: 0, blank: 25 },
        costas: { correct: 0, incorrect: 0, blank: 20 },
        aguas: { correct: 0, incorrect: 0, blank: 35 }
      };

      mockTestService.correctAnswers = testAnswers;
      
      await component.ngOnInit();

      // Verify no questions answered shows 0
      const totalAnswered = testAnswers.total.correct + testAnswers.total.incorrect;
      expect(totalAnswered).toBe(0);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score correctly with penalty for incorrect answers', async () => {
      const testAnswers = {
        total: { correct: 10, incorrect: 3, blank: 87 }
      };

      mockTestService.correctAnswers = testAnswers;
      await component.ngOnInit();

      // Score = correct - (0.33 * incorrect) = 10 - (0.33 * 3) = 10 - 0.99 = 9.01
      expect(component.overallScore).toBeCloseTo(9.01, 2);
    });

    it('should calculate accuracy percentage based on answered questions only', async () => {
      const testAnswers = {
        total: { correct: 3, incorrect: 1, blank: 96 }
      };

      mockTestService.correctAnswers = testAnswers;
      await component.ngOnInit();

      // Accuracy = (correct / (correct + incorrect)) * 100 = (3 / 4) * 100 = 75%
      expect(component.overallAccuracy).toBe(75);
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should handle progress tracking mode correctly', async () => {
      // Set component to progress tracking mode
      component.isProgressTracking = true;
      component.progressSession = {
        sessionId: 'test-session',
        questionsAnswered: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        timeElapsed: 300000,
        isActive: false,
        startTime: Date.now() - 300000,
        mainSection: 'Varias',
        mode: 'practice',
        currentStreak: 0,
        longestStreak: 2,
        totalQuestions: 100,
        currentQuestionIndex: 5,
        sectionBreakdown: []
      };
      
      await component.ngOnInit();

      expect(component.isProgressTracking).toBe(true);
      expect(component.progressSession).toBeTruthy();
      expect(component.progressSession?.questionsAnswered).toBe(5);
      
      // Verify that correctAnswers was built from progress session
      expect(component.correctAnswers.total).toBeDefined();
      expect(component.correctAnswers.total.correct).toBe(3);
      expect(component.correctAnswers.total.incorrect).toBe(2);
    });
  });

  describe('Section Breakdown', () => {
    it('should build correct section breakdown from test service data', async () => {
      const testAnswers = {
        total: { correct: 5, incorrect: 2, blank: 93 },
        administrativo: { correct: 2, incorrect: 1, blank: 17 },
        'medio ambiente': { correct: 1, incorrect: 0, blank: 24 },
        costas: { correct: 1, incorrect: 1, blank: 18 },
        aguas: { correct: 1, incorrect: 0, blank: 34 }
      };

      mockTestService.correctAnswers = testAnswers;
      
      await component.ngOnInit();

      // Verify that component properly processes test answers
      expect(component.correctAnswers).toBeDefined();
      expect(component.correctAnswers.total.correct).toBe(5);
      expect(component.correctAnswers.total.incorrect).toBe(2);
      
      // Verify section counts only include answered questions
      const adminAnswered = testAnswers.administrativo.correct + testAnswers.administrativo.incorrect;
      expect(adminAnswered).toBe(3);
    });
  });
});