import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExamConfigurationComponent } from './exam-configuration';
import { QuestionsService } from '../../services/questions.service';
import { TestService } from '../../services/test.service';
import { Question } from '../../models/question.model';

describe('ExamConfigurationComponent', () => {
  let component: ExamConfigurationComponent;
  let questionsService: QuestionsService;
  let testService: TestService;
  let router: Router;

  const mockQuestions: Question[] = [
    // Create 20 administrativo questions
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `admin-${i}`,
      questionText: `Admin Question ${i}`,
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
    // Create 25 medio ambiente questions
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `medio-${i}`,
      questionText: `Medio Question ${i}`,
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
    // Create 20 costas questions
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `costas-${i}`,
      questionText: `Costas Question ${i}`,
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
    // Create 35 aguas questions
    ...Array.from({ length: 35 }, (_, i) => ({
      id: `aguas-${i}`,
      questionText: `Aguas Question ${i}`,
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
    // Create mocked services
    const mockQuestionsService = {
      getQuestions: vi.fn().mockReturnValue(of(mockQuestions))
    };

    const mockTestService = {
      setCustomConfiguration: vi.fn(),
      getCustomConfiguration: vi.fn().mockReturnValue(null)
    };

    const mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: QuestionsService, useValue: mockQuestionsService },
        { provide: TestService, useValue: mockTestService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    const fb = TestBed.inject(FormBuilder);
    questionsService = TestBed.inject(QuestionsService);
    testService = TestBed.inject(TestService);
    router = TestBed.inject(Router);

    // Create component instance with mocked ChangeDetectorRef
    component = new ExamConfigurationComponent(
      fb,
      router,
      questionsService,
      testService,
      { detectChanges: vi.fn() } as any
    );
  });

  describe('Component Basics', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have standard exam weights', () => {
      expect(component.standardExamWeights).toEqual({
        'administrativo': 20,
        'medio ambiente': 25,
        'costas': 20,
        'aguas': 35
      });
    });

    it('should initialize with loading state', () => {
      expect(component.isLoading).toBe(true);
    });
  });

  describe('Standard Exam Preset', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should apply standard exam configuration', () => {
      component.applyStandardExamPreset();
      
      const values = component.selectionsArray.value;
      expect(values.length).toBe(4);
      expect(values[0].mainSection).toBe('administrativo');
      expect(values[0].questionCount).toBe(20);
      expect(values[1].mainSection).toBe('medio ambiente');
      expect(values[1].questionCount).toBe(25);
      expect(values[2].mainSection).toBe('costas');
      expect(values[2].questionCount).toBe(20);
      expect(values[3].mainSection).toBe('aguas');
      expect(values[3].questionCount).toBe(35);
    });

    it('should identify standard exam configuration', () => {
      expect(component.isStandardExamConfiguration).toBe(false);
      
      component.applyStandardExamPreset();
      
      expect(component.isStandardExamConfiguration).toBe(true);
    });

    it('should not identify as standard with different weights', () => {
      component.applyStandardExamPreset();
      component.selectionsArray.at(0).patchValue({ questionCount: 30 });
      
      expect(component.isStandardExamConfiguration).toBe(false);
    });
  });

  describe('Question Options', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should identify standard weight options', () => {
      const selection = component.selectionsArray.at(0);
      selection.patchValue({ mainSection: 'administrativo' });
      
      expect(component.isStandardWeightOption(0, 20)).toBe(true);
      expect(component.isStandardWeightOption(0, 25)).toBe(false);
    });

    it('should label standard weights correctly', () => {
      const selection = component.selectionsArray.at(0);
      selection.patchValue({ mainSection: 'medio ambiente' });
      
      expect(component.getQuestionOptionLabelForSelection(0, 25)).toBe('25 (estándar)');
      expect(component.getQuestionOptionLabelForSelection(0, 20)).toBe('20');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should require at least one section', () => {
      component.validateConfiguration();
      
      expect(component.validationErrors).toContain(
        'Debe seleccionar al menos una sección o subsección'
      );
    });

    it('should validate question counts', async () => {
      // Wait for questions to load
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const selection = component.selectionsArray.at(0);
      selection.patchValue({
        mainSection: 'administrativo',
        questionCount: 50 // More than available
      });
      
      component.validateConfiguration();
      
      expect(component.validationErrors.some(e => 
        e.includes('50 preguntas solicitadas exceden las 20 disponibles')
      )).toBe(true);
    });
  });

  describe('Exam Start', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not start with validation errors', () => {
      component.validationErrors = ['Error'];
      component.startExam();
      
      expect(testService.setCustomConfiguration).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should start exam with valid configuration', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith({
        selections: [
          { mainSection: 'administrativo', subsections: [], questionCount: 20 },
          { mainSection: 'medio ambiente', subsections: [], questionCount: 25 },
          { mainSection: 'costas', subsections: [], questionCount: 20 },
          { mainSection: 'aguas', subsections: [], questionCount: 35 }
        ],
        totalQuestions: 100,
        questionDistribution: 'custom',
        timeInMinutes: 100
      });
      
      expect(router.navigate).toHaveBeenCalledWith(['/test']);
    });
  });

  describe('Timer Configuration', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should initialize with one minute per question as default', () => {
      expect(component.selectedTimeOption).toBe('oneMinutePerQuestion');
    });

    it('should set unlimited time when unlimited option is selected', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.selectedTimeOption = 'unlimited';
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          timeInMinutes: undefined
        })
      );
    });

    it('should set time based on question count for one minute per question', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.selectedTimeOption = 'oneMinutePerQuestion';
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          timeInMinutes: 100 // Total questions = 100
        })
      );
    });

    it('should set 120 minutes for standard exam option', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.selectedTimeOption = 'standard';
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          timeInMinutes: 120
        })
      );
    });

    it('should set custom time when custom option is selected', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.selectedTimeOption = 'custom';
      component.customTimeMinutes = 90;
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          timeInMinutes: 90
        })
      );
    });

    it('should use default 60 minutes if custom time is not set', async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      component.applyStandardExamPreset();
      component.calculateTotalQuestions();
      component.selectedTimeOption = 'custom';
      component.customTimeMinutes = 0; // Invalid value
      component.startExam();
      
      expect(testService.setCustomConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          timeInMinutes: 60
        })
      );
    });
  });
});