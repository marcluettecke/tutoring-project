import { describe, it, expect, beforeEach } from 'vitest';
import { ResultsComponent } from './results.component';
import { TestSession } from '../../models/progress.model';

describe('ResultsComponent', () => {
  let component: ResultsComponent;

  beforeEach(() => {
    component = new ResultsComponent(null as any, null as any, null as any);
  });

  describe('getSessionAccuracyClass', () => {
    it('should return "excellent" for accuracy >= 85%', () => {
      const session: TestSession = {
        id: 'test-1',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 100,
        correctAnswers: 90,
        incorrectAnswers: 10,
        blankAnswers: 0,
        timeSpent: 3600,
        completed: true
      };
      
      expect(component.getSessionAccuracyClass(session)).toBe('excellent');
    });

    it('should return "good" for accuracy >= 70% and < 85%', () => {
      const session: TestSession = {
        id: 'test-2',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 100,
        correctAnswers: 75,
        incorrectAnswers: 25,
        blankAnswers: 0,
        timeSpent: 3600,
        completed: true
      };
      
      expect(component.getSessionAccuracyClass(session)).toBe('good');
    });

    it('should return "needs-improvement" for accuracy < 70%', () => {
      const session: TestSession = {
        id: 'test-3',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 100,
        correctAnswers: 50,
        incorrectAnswers: 50,
        blankAnswers: 0,
        timeSpent: 3600,
        completed: true
      };
      
      expect(component.getSessionAccuracyClass(session)).toBe('needs-improvement');
    });

    it('should handle zero questions answered', () => {
      const session: TestSession = {
        id: 'test-4',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        blankAnswers: 0,
        timeSpent: 0,
        completed: true
      };
      
      expect(component.getSessionAccuracyClass(session)).toBe('needs-improvement');
    });
  });

  describe('getSessionAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      const session: TestSession = {
        id: 'test-5',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 50,
        correctAnswers: 35,
        incorrectAnswers: 15,
        blankAnswers: 0,
        timeSpent: 3600,
        completed: true
      };
      
      expect(component.getSessionAccuracy(session)).toBe(70);
    });

    it('should return 0 for zero questions answered', () => {
      const session: TestSession = {
        id: 'test-6',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        blankAnswers: 0,
        timeSpent: 0,
        completed: true
      };
      
      expect(component.getSessionAccuracy(session)).toBe(0);
    });
  });
});