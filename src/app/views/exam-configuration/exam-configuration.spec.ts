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
      question: `Admin Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      mainSection: 'administrativo',
      subSection: 'general'
    })),
    // Create 25 medio ambiente questions
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `medio-${i}`,
      question: `Medio Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      mainSection: 'medio ambiente',
      subSection: 'general'
    })),
    // Create 20 costas questions
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `costas-${i}`,
      question: `Costas Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'C',
      mainSection: 'costas',
      subSection: 'general'
    })),
    // Create 35 aguas questions
    ...Array.from({ length: 35 }, (_, i) => ({
      id: `aguas-${i}`,
      question: `Aguas Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'D',
      mainSection: 'aguas',
      subSection: 'general'
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
        questionDistribution: 'custom'
      });
      
      expect(router.navigate).toHaveBeenCalledWith(['/test']);
    });
  });
});