import { describe, it, expect, beforeEach } from 'vitest';
import { SessionDataTableComponent } from './session-data-table.component';
import { TestSession } from '../../models/progress.model';

describe('SessionDataTableComponent', () => {
  let component: SessionDataTableComponent;

  beforeEach(() => {
    component = new SessionDataTableComponent();
  });

  describe('formatBlankCount', () => {
    it('should return "-" for practice sessions', () => {
      const practiceSession: TestSession = {
        id: 'test-1',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'practice',
        mainSection: 'administrativo',
        questionsAnswered: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
        blankAnswers: 0,
        timeSpent: 300,
        completed: true
      };
      
      component.session = practiceSession;
      
      expect(component.formatBlankCount(0)).toBe('-');
      expect(component.formatBlankCount(5)).toBe('-');
      expect(component.formatBlankCount(undefined)).toBe('-');
    });

    it('should return actual count for test sessions', () => {
      const testSession: TestSession = {
        id: 'test-2',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'administrativo',
        questionsAnswered: 80,
        correctAnswers: 60,
        incorrectAnswers: 20,
        blankAnswers: 20,
        timeSpent: 3600,
        completed: true
      };
      
      component.session = testSession;
      
      expect(component.formatBlankCount(20)).toBe('20');
      expect(component.formatBlankCount(0)).toBe('0');
      expect(component.formatBlankCount(undefined)).toBe('0');
    });

    it('should return actual count when no session info is available', () => {
      component.session = null;
      
      expect(component.formatBlankCount(15)).toBe('15');
      expect(component.formatBlankCount(0)).toBe('0');
      expect(component.formatBlankCount(undefined)).toBe('0');
    });
  });
});