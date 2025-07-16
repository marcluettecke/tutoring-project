import { TestBed } from '@angular/core/testing';
import { TestService } from './test.service';
import { QUESTIONWEIGHTS } from '../views/test/constants';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TestService', () => {
  let service: TestService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(service.correctAnswers.total.blank).toBe(100);
    expect(service.correctAnswers.total.correct).toBe(0);
    expect(service.correctAnswers.total.incorrect).toBe(0);
  });

  it('should update counts when answer is clicked', () => {
    const mockQuestion = {
      id: 'q1',
      question: 'Test question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      mainSection: 'administrativo'
    };

    // First click - correct answer
    service.addClickedAnswer(mockQuestion, 'A', true, false);
    
    expect(service.correctAnswers.total.correct).toBe(1);
    expect(service.correctAnswers.total.blank).toBe(99);
    expect(service.correctAnswers.administrativo.correct).toBe(1);
  });

  it('should reset all answers', () => {
    // Add some answers first
    const mockQuestion = {
      id: 'q1',
      question: 'Test question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      mainSection: 'administrativo'
    };
    
    service.addClickedAnswer(mockQuestion, 'B', true, false);
    service.saveQuestionAnswer('q1', 'B');
    
    // Reset
    service.resetAllAnswers();
    
    expect(service.correctAnswers.total.blank).toBe(100);
    expect(service.correctAnswers.total.correct).toBe(0);
    expect(service.correctAnswers.total.incorrect).toBe(0);
    expect(service.getSavedAnswer('q1')).toBeUndefined();
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', () => {
      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        mainSection: 'administrativo'
      };
      
      service.addClickedAnswer(mockQuestion, 'A', true, false);
      
      const savedState = localStorage.getItem('testServiceState');
      expect(savedState).toBeTruthy();
      
      const parsed = JSON.parse(savedState!);
      expect(parsed.correctAnswers.total.correct).toBe(1);
    });

    it('should restore state from localStorage on creation', () => {
      // Save state to localStorage
      const stateToSave = {
        correctAnswers: {
          total: { blank: 98, correct: 2, incorrect: 0 },
          'administrativo': { blank: 48, correct: 2, incorrect: 0 },
          'medio ambiente': { blank: QUESTIONWEIGHTS['medio ambiente'], correct: 0, incorrect: 0 },
          'costas': { blank: QUESTIONWEIGHTS['costas'], correct: 0, incorrect: 0 },
          'aguas': { blank: QUESTIONWEIGHTS['aguas'], correct: 0, incorrect: 0 }
        },
        timestamp: Date.now()
      };
      
      localStorage.setItem('testServiceState', JSON.stringify(stateToSave));
      
      // Create new service instance
      const newService = new TestService();
      
      expect(newService.correctAnswers.total.correct).toBe(2);
      expect(newService.correctAnswers.total.blank).toBe(98);
    });

    it('should not restore state older than 12 hours', () => {
      const oldState = {
        correctAnswers: {
          total: { blank: 98, correct: 2, incorrect: 0 },
          'administrativo': { blank: 48, correct: 2, incorrect: 0 },
          'medio ambiente': { blank: QUESTIONWEIGHTS['medio ambiente'], correct: 0, incorrect: 0 },
          'costas': { blank: QUESTIONWEIGHTS['costas'], correct: 0, incorrect: 0 },
          'aguas': { blank: QUESTIONWEIGHTS['aguas'], correct: 0, incorrect: 0 }
        },
        timestamp: Date.now() - (13 * 60 * 60 * 1000) // 13 hours ago
      };
      
      localStorage.setItem('testServiceState', JSON.stringify(oldState));
      
      const newService = new TestService();
      
      // Should have default state, not the old saved state
      expect(newService.correctAnswers.total.correct).toBe(0);
      expect(newService.correctAnswers.total.blank).toBe(100);
    });
  });

  describe('Question Answer Persistence', () => {
    it('should save question answers', () => {
      service.saveQuestionAnswer('q1', 'A');
      service.saveQuestionAnswer('q2', 'B');
      
      expect(service.getSavedAnswer('q1')).toBe('A');
      expect(service.getSavedAnswer('q2')).toBe('B');
    });

    it('should persist question answers to localStorage', () => {
      service.saveQuestionAnswer('q1', 'A');
      
      const saved = localStorage.getItem('answeredQuestions');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.questions).toContainEqual(['q1', 'A']);
    });

    it('should restore question answers from localStorage', () => {
      const answersToSave = {
        questions: [['q1', 'A'], ['q2', 'B']],
        timestamp: Date.now()
      };
      
      localStorage.setItem('answeredQuestions', JSON.stringify(answersToSave));
      
      const newService = new TestService();
      
      expect(newService.getSavedAnswer('q1')).toBe('A');
      expect(newService.getSavedAnswer('q2')).toBe('B');
    });

    it('should clear old question answers after 12 hours', () => {
      const oldAnswers = {
        questions: [['q1', 'A'], ['q2', 'B']],
        timestamp: Date.now() - (13 * 60 * 60 * 1000) // 13 hours ago
      };
      
      localStorage.setItem('answeredQuestions', JSON.stringify(oldAnswers));
      
      const newService = new TestService();
      
      expect(newService.getSavedAnswer('q1')).toBeUndefined();
      expect(newService.getSavedAnswer('q2')).toBeUndefined();
    });

    it('should check if question has been answered', () => {
      service.saveQuestionAnswer('q1', 'A');
      
      expect(service.hasAnsweredQuestion('q1')).toBe(true);
      expect(service.hasAnsweredQuestion('q2')).toBe(false);
    });

    it('should clear answered questions on reset', () => {
      service.saveQuestionAnswer('q1', 'A');
      service.saveQuestionAnswer('q2', 'B');
      
      service.resetAllAnswers();
      
      expect(service.getSavedAnswer('q1')).toBeUndefined();
      expect(service.getSavedAnswer('q2')).toBeUndefined();
      expect(localStorage.getItem('answeredQuestions')).toBeNull();
    });
  });

  describe('Navigation and Status', () => {
    it('should emit test started status', () => {
      return new Promise<void>((resolve) => {
        service.testStatus.subscribe(status => {
          expect(status).toBe('started');
          resolve();
        });
        
        service.handleTestStart();
      });
    });

    it('should emit test ended status', () => {
      return new Promise<void>((resolve) => {
        service.testStatus.subscribe(status => {
          expect(status).toBe('ended');
          resolve();
        });
        
        service.handleTestEnd();
      });
    });

    it('should emit reset event', () => {
      return new Promise<void>((resolve) => {
        service.resetAnswers.subscribe(() => {
          expect(true).toBe(true);
          resolve();
        });
        
        service.resetAllAnswers();
      });
    });
  });

  describe('Answer Change Handling', () => {
    const mockQuestion = {
      id: 'q1',
      question: 'Test question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      mainSection: 'administrativo'
    };

    it('should handle changing from wrong to correct answer', () => {
      // First click - wrong answer
      service.addClickedAnswer(mockQuestion, 'B', true, false);
      expect(service.correctAnswers.total.incorrect).toBe(1);
      expect(service.correctAnswers.total.correct).toBe(0);
      
      // Change to correct answer
      service.addClickedAnswer(mockQuestion, 'A', false, true);
      expect(service.correctAnswers.total.incorrect).toBe(0);
      expect(service.correctAnswers.total.correct).toBe(1);
    });

    it('should handle changing from correct to wrong answer', () => {
      // First click - correct answer
      service.addClickedAnswer(mockQuestion, 'A', true, false);
      expect(service.correctAnswers.total.correct).toBe(1);
      expect(service.correctAnswers.total.incorrect).toBe(0);
      
      // Change to wrong answer
      service.addClickedAnswer(mockQuestion, 'B', false, false);
      expect(service.correctAnswers.total.correct).toBe(0);
      expect(service.correctAnswers.total.incorrect).toBe(1);
    });

    it('should not change counts when selecting same wrong answer again', () => {
      // First click - wrong answer
      service.addClickedAnswer(mockQuestion, 'B', true, false);
      
      // Click same wrong answer again
      service.addClickedAnswer(mockQuestion, 'B', false, true);
      
      expect(service.correctAnswers.total.incorrect).toBe(1);
      expect(service.correctAnswers.total.correct).toBe(0);
    });
  });
});