import { Question } from '../app/models/question.model';
import { Account, UserInfo } from '../app/models/User.model';

/**
 * Test fixtures for creating consistent test data
 */
export class TestFixtures {
  
  /**
   * Creates a sample question with required properties
   */
  static createQuestion(overrides: Partial<Question> = {}): Question {
    return {
      id: 'q1',
      questionText: 'What is the capital of Spain?',
      questionIndex: 1,
      answers: [
        { id: 'q1-a1', text: 'Madrid' },
        { id: 'q1-a2', text: 'Barcelona' },
        { id: 'q1-a3', text: 'Seville' },
        { id: 'q1-a4', text: 'Valencia' }
      ],
      correctAnswer: 'q1-a1',
      explanation: 'Madrid is the capital and largest city of Spain.',
      mainSection: 'administrativo',
      subSection: 'general',
      subSectionIndex: 1,
      ...overrides
    };
  }

  /**
   * Creates multiple questions for testing lists and filtering
   */
  static createQuestionList(count: number = 3): Question[] {
    const sections = ['administrativo', 'medio ambiente', 'costas', 'aguas'];
    const subSections = ['general', 'specific', 'advanced'];
    
    return Array.from({ length: count }, (_, i) => this.createQuestion({
      id: `q${i + 1}`,
      questionIndex: i + 1,
      questionText: `Test question ${i + 1}?`,
      mainSection: sections[i % sections.length],
      subSection: subSections[i % subSections.length],
      subSectionIndex: (i % 3) + 1,
      answers: [
        { id: `q${i + 1}-a1`, text: `Answer A${i + 1}` },
        { id: `q${i + 1}-a2`, text: `Answer B${i + 1}` },
        { id: `q${i + 1}-a3`, text: `Answer C${i + 1}` },
        { id: `q${i + 1}-a4`, text: `Answer D${i + 1}` }
      ],
      correctAnswer: `q${i + 1}-a1`
    }));
  }

  /**
   * Creates a test user account
   */
  static createAccount(overrides: Partial<Account> = {}): Account {
    return {
      id: 'test-account-123',
      email: 'test@example.com',
      isAdmin: false,
      ...overrides
    };
  }

  /**
   * Creates admin account
   */
  static createAdminAccount(overrides: Partial<Account> = {}): Account {
    return this.createAccount({
      email: 'admin@example.com',
      isAdmin: true,
      ...overrides
    });
  }

  /**
   * Creates user info for authentication
   */
  static createUserInfo(overrides: Partial<UserInfo> = {}): UserInfo {
    return {
      uid: 'test-uid-123',
      email: 'test@example.com',
      phoneNumber: null,
      displayName: 'Test User',
      ...overrides
    };
  }

  /**
   * Creates admin user info
   */
  static createAdminUserInfo(overrides: Partial<UserInfo> = {}): UserInfo {
    return this.createUserInfo({
      uid: 'admin-uid-123',
      email: 'admin@example.com',
      displayName: 'Admin User',
      ...overrides
    });
  }

  /**
   * Creates test answers for testing scenarios
   */
  static createTestAnswers() {
    return {
      administrativo: { blank: 2, correct: 18, incorrect: 5 },
      'medio ambiente': { blank: 1, correct: 22, incorrect: 2 },
      costas: { blank: 0, correct: 20, incorrect: 5 },
      aguas: { blank: 3, correct: 27, incorrect: 5 },
      total: { blank: 6, correct: 87, incorrect: 17 }
    };
  }

  /**
   * Creates section structure for navigation testing
   */
  static createSectionStructure() {
    return {
      administrativo: [
        { name: 'general', index: 1 },
        { name: 'specific', index: 2 },
        { name: 'advanced', index: 3 }
      ],
      'medio ambiente': [
        { name: 'basic', index: 1 },
        { name: 'intermediate', index: 2 }
      ],
      costas: [
        { name: 'theory', index: 1 },
        { name: 'practice', index: 2 }
      ],
      aguas: [
        { name: 'fundamentals', index: 1 },
        { name: 'applications', index: 2 },
        { name: 'regulations', index: 3 }
      ]
    };
  }

  /**
   * Creates active section state for testing
   */
  static createActiveSection(overrides: Partial<{
    mainSection: string;
    subSection: string;
    mainSectionNumber: number;
    subSectionNumber: number;
  }> = {}) {
    return {
      mainSection: 'administrativo',
      subSection: 'general',
      mainSectionNumber: 1,
      subSectionNumber: 1,
      ...overrides
    };
  }
}