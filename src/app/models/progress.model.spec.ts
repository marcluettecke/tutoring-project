import {
  TestSession,
  SectionProgress,
  UserProgress,
  PerformanceMetrics,
  Achievement,
  SectionProgressData,
  SectionProgressDataWithComparison,
  CurrentSessionProgress,
  SectionSummary,
  DashboardStats,
  QuestionAttempt,
  StudyGoal,
  UserNotification,
  TestServiceAnswers
} from './progress.model';

describe('Progress Models', () => {
  describe('TestSession', () => {
    it('should create a valid TestSession object', () => {
      const testSession: TestSession = {
        id: 'test-session-1',
        userId: 'user-123',
        timestamp: Date.now(),
        mode: 'practice',
        mainSection: 'administrativo',
        subSection: 'subtest',
        questionsAnswered: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
        blankAnswers: 0,
        timeSpent: 300,
        completed: true,
        score: 70,
        testScore: 6
      };

      expect(testSession.id).toBe('test-session-1');
      expect(testSession.mode).toBe('practice');
      expect(testSession.questionsAnswered).toBe(10);
      expect(testSession.completed).toBe(true);
    });

    it('should allow optional properties to be undefined', () => {
      const minimalSession: TestSession = {
        id: 'test-session-2',
        userId: 'user-456',
        timestamp: Date.now(),
        mode: 'test',
        mainSection: 'costas',
        questionsAnswered: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        blankAnswers: 0,
        timeSpent: 150,
        completed: false
      };

      expect(minimalSession.subSection).toBeUndefined();
      expect(minimalSession.score).toBeUndefined();
      expect(minimalSession.testScore).toBeUndefined();
    });

    it('should validate mode enum values', () => {
      const practiceSession: TestSession = {
        id: 'test-1',
        userId: 'user-1',
        timestamp: Date.now(),
        mode: 'practice',
        mainSection: 'aguas',
        questionsAnswered: 1,
        correctAnswers: 1,
        incorrectAnswers: 0,
        blankAnswers: 0,
        timeSpent: 30,
        completed: true
      };

      const testSession: TestSession = {
        ...practiceSession,
        id: 'test-2',
        mode: 'test'
      };

      expect(practiceSession.mode).toBe('practice');
      expect(testSession.mode).toBe('test');
    });
  });

  describe('SectionProgress', () => {
    it('should create a valid SectionProgress object', () => {
      const sectionProgress: SectionProgress = {
        mainSection: 'medio ambiente',
        subSection: 'agua potable',
        totalQuestions: 50,
        questionsAnswered: 30,
        correctAnswers: 25,
        incorrectAnswers: 5,
        blankAnswers: 20,
        accuracyRate: 83.33,
        lastUpdated: Date.now(),
        bestScore: 90,
        attemptsCount: 3,
        averageTimePerQuestion: 45,
        improvementTrend: 15.5
      };

      expect(sectionProgress.mainSection).toBe('medio ambiente');
      expect(sectionProgress.accuracyRate).toBeCloseTo(83.33);
      expect(sectionProgress.improvementTrend).toBeGreaterThan(0);
    });

    it('should handle negative improvement trend', () => {
      const decliningSection: SectionProgress = {
        mainSection: 'costas',
        totalQuestions: 25,
        questionsAnswered: 15,
        correctAnswers: 8,
        incorrectAnswers: 7,
        blankAnswers: 10,
        accuracyRate: 53.33,
        lastUpdated: Date.now(),
        bestScore: 70,
        attemptsCount: 5,
        averageTimePerQuestion: 60,
        improvementTrend: -12.3
      };

      expect(decliningSection.improvementTrend).toBeLessThan(0);
      expect(decliningSection.accuracyRate).toBeLessThan(60);
    });
  });

  describe('UserProgress', () => {
    it('should create a valid UserProgress object', () => {
      const userProgress: UserProgress = {
        userId: 'user-789',
        overallStats: {
          totalSessions: 10,
          totalQuestionsAnswered: 150,
          totalCorrectAnswers: 120,
          totalIncorrectAnswers: 30,
          totalBlankAnswers: 0,
          overallAccuracy: 80,
          totalTimeSpent: 3600,
          averageSessionTime: 360,
          lastActivityDate: Date.now(),
          firstActivityDate: Date.now() - (7 * 24 * 60 * 60 * 1000)
        },
        sectionProgress: [],
        recentSessions: [],
        achievements: []
      };

      expect(userProgress.userId).toBe('user-789');
      expect(userProgress.overallStats.overallAccuracy).toBe(80);
      expect(userProgress.overallStats.totalSessions).toBe(10);
    });
  });

  describe('Achievement', () => {
    it('should create a valid Achievement object', () => {
      const achievement: Achievement = {
        id: 'first-100-questions',
        name: 'Century Club',
        description: 'Answer 100 questions correctly',
        icon: 'fa-trophy',
        unlockedAt: Date.now(),
        category: 'completion',
        progress: 100,
        target: 100,
        isUnlocked: true
      };

      expect(achievement.name).toBe('Century Club');
      expect(achievement.category).toBe('completion');
      expect(achievement.isUnlocked).toBe(true);
      expect(achievement.progress).toBe(achievement.target);
    });

    it('should support all category types', () => {
      const categories: Achievement['category'][] = [
        'accuracy', 'consistency', 'improvement', 'completion', 'testing'
      ];

      categories.forEach(category => {
        const achievement: Achievement = {
          id: `test-${category}`,
          name: 'Test Achievement',
          description: 'Test Description',
          icon: 'fa-star',
          unlockedAt: Date.now(),
          category,
          progress: 50,
          target: 100,
          isUnlocked: false
        };

        expect(achievement.category).toBe(category);
      });
    });
  });

  describe('SectionProgressData', () => {
    it('should create a valid SectionProgressData object', () => {
      const sectionData: SectionProgressData = {
        sectionName: 'administrativo',
        subSection: 'procedimiento',
        questionsAnswered: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        timeSpent: 300000, // 5 minutes in milliseconds
        firstQuestionTime: Date.now() - 300000,
        lastQuestionTime: Date.now(),
        accuracy: 80,
        avgTimePerQuestion: 60000 // 1 minute per question
      };

      expect(sectionData.sectionName).toBe('administrativo');
      expect(sectionData.accuracy).toBe(80);
      expect(sectionData.timeSpent).toBe(300000);
    });

    it('should allow optional properties to be undefined', () => {
      const minimalData: SectionProgressData = {
        sectionName: 'aguas',
        questionsAnswered: 3,
        correctAnswers: 2,
        incorrectAnswers: 1,
        timeSpent: 180000
      };

      expect(minimalData.subSection).toBeUndefined();
      expect(minimalData.accuracy).toBeUndefined();
      expect(minimalData.avgTimePerQuestion).toBeUndefined();
    });
  });

  describe('SectionProgressDataWithComparison', () => {
    it('should extend SectionProgressData with comparison fields', () => {
      const comparisonData: SectionProgressDataWithComparison = {
        sectionName: 'costas',
        questionsAnswered: 8,
        correctAnswers: 6,
        incorrectAnswers: 2,
        timeSpent: 480000,
        accuracy: 75,
        historical: {
          sectionName: 'costas',
          questionsAnswered: 6,
          correctAnswers: 3,
          incorrectAnswers: 3,
          timeSpent: 360000,
          accuracy: 50
        },
        accuracyDiff: 25,
        timeDiff: 120000,
        questionsDiff: 2,
        correctDiff: 3,
        incorrectDiff: -1
      };

      expect(comparisonData.accuracyDiff).toBe(25);
      expect(comparisonData.historical?.accuracy).toBe(50);
      expect(comparisonData.correctDiff).toBe(3);
    });

    it('should allow comparison fields to be null', () => {
      const dataWithNulls: SectionProgressDataWithComparison = {
        sectionName: 'medio ambiente',
        questionsAnswered: 4,
        correctAnswers: 4,
        incorrectAnswers: 0,
        timeSpent: 240000,
        historical: null,
        accuracyDiff: null,
        timeDiff: null,
        questionsDiff: null,
        correctDiff: null,
        incorrectDiff: null
      };

      expect(dataWithNulls.historical).toBeNull();
      expect(dataWithNulls.accuracyDiff).toBeNull();
    });
  });

  describe('CurrentSessionProgress', () => {
    it('should create a valid CurrentSessionProgress object', () => {
      const sessionProgress: CurrentSessionProgress = {
        sessionId: 'session-456',
        mainSection: 'aguas',
        subSection: 'calidad del agua',
        totalQuestions: 20,
        questionsAnswered: 8,
        correctAnswers: 6,
        incorrectAnswers: 2,
        currentStreak: 3,
        longestStreak: 5,
        timeElapsed: 480000,
        startTime: Date.now() - 480000,
        isActive: true,
        mode: 'practice',
        currentQuestionIndex: 8,
        sectionBreakdown: []
      };

      expect(sessionProgress.sessionId).toBe('session-456');
      expect(sessionProgress.isActive).toBe(true);
      expect(sessionProgress.currentStreak).toBeLessThanOrEqual(sessionProgress.longestStreak);
      expect(sessionProgress.mode).toBe('practice');
    });

    it('should validate that questionsAnswered equals correct + incorrect', () => {
      const session: CurrentSessionProgress = {
        sessionId: 'validation-test',
        mainSection: 'test',
        totalQuestions: 10,
        questionsAnswered: 5,
        correctAnswers: 3,
        incorrectAnswers: 2,
        currentStreak: 0,
        longestStreak: 2,
        timeElapsed: 300000,
        startTime: Date.now(),
        isActive: true,
        mode: 'test',
        sectionBreakdown: []
      };

      expect(session.correctAnswers + session.incorrectAnswers).toBe(session.questionsAnswered);
    });
  });

  describe('TestServiceAnswers', () => {
    it('should create a valid TestServiceAnswers object', () => {
      const answers: TestServiceAnswers = {
        'administrativo': {
          blank: 2,
          correct: 15,
          incorrect: 3
        },
        'medio ambiente': {
          blank: 1,
          correct: 18,
          incorrect: 1
        },
        'total': {
          blank: 3,
          correct: 33,
          incorrect: 4
        }
      };

      expect(answers.administrativo.correct).toBe(15);
      expect(answers.total.blank).toBe(3);
      expect(Object.keys(answers)).toContain('total');
    });

    it('should support dynamic section keys', () => {
      const dynamicAnswers: TestServiceAnswers = {};
      
      dynamicAnswers['costas'] = {
        blank: 0,
        correct: 10,
        incorrect: 2
      };

      dynamicAnswers['custom-section'] = {
        blank: 5,
        correct: 5,
        incorrect: 0
      };

      expect(dynamicAnswers['costas']).toBeDefined();
      expect(dynamicAnswers['custom-section'].blank).toBe(5);
    });
  });

  describe('StudyGoal', () => {
    it('should create a valid StudyGoal object', () => {
      const goal: StudyGoal = {
        id: 'daily-goal-1',
        userId: 'user-123',
        type: 'daily',
        target: 50,
        unit: 'questions',
        currentProgress: 25,
        deadline: Date.now() + (24 * 60 * 60 * 1000),
        isActive: true,
        achieved: false,
        createdAt: Date.now()
      };

      expect(goal.type).toBe('daily');
      expect(goal.unit).toBe('questions');
      expect(goal.currentProgress).toBeLessThan(goal.target);
      expect(goal.achieved).toBe(false);
    });

    it('should support all goal types and units', () => {
      const types: StudyGoal['type'][] = ['daily', 'weekly', 'monthly'];
      const units: StudyGoal['unit'][] = ['questions', 'minutes', 'accuracy'];

      types.forEach(type => {
        units.forEach(unit => {
          const goal: StudyGoal = {
            id: `goal-${type}-${unit}`,
            userId: 'user-test',
            type,
            target: 100,
            unit,
            currentProgress: 0,
            deadline: Date.now() + 86400000,
            isActive: true,
            achieved: false,
            createdAt: Date.now()
          };

          expect(goal.type).toBe(type);
          expect(goal.unit).toBe(unit);
        });
      });
    });
  });

  describe('UserNotification', () => {
    it('should create a valid UserNotification object', () => {
      const notification: UserNotification = {
        id: 'notif-1',
        userId: 'user-456',
        type: 'achievement',
        title: '¡Nueva insignia desbloqueada!',
        message: 'Has completado 100 preguntas consecutivas correctamente',
        timestamp: Date.now(),
        read: false,
        actionUrl: '/achievements',
        priority: 'high'
      };

      expect(notification.type).toBe('achievement');
      expect(notification.priority).toBe('high');
      expect(notification.read).toBe(false);
    });

    it('should support all notification types and priorities', () => {
      const types: UserNotification['type'][] = ['achievement', 'goal', 'reminder', 'improvement'];
      const priorities: UserNotification['priority'][] = ['low', 'medium', 'high'];

      types.forEach(type => {
        priorities.forEach(priority => {
          const notification: UserNotification = {
            id: `notif-${type}-${priority}`,
            userId: 'user-test',
            type,
            title: 'Test Notification',
            message: 'Test message',
            timestamp: Date.now(),
            read: false,
            priority
          };

          expect(notification.type).toBe(type);
          expect(notification.priority).toBe(priority);
        });
      });
    });
  });
});