import { Question, Questions } from './question.model';

describe('Question Models', () => {
  describe('Question Interface', () => {
    it('should create Question with all required properties', () => {
      const question: Question = {
        id: 'q1',
        questionText: 'What is the capital of Spain?',
        questionIndex: 1,
        answers: [
          { id: 'q1-a1', text: 'Madrid' },
          { id: 'q1-a2', text: 'Barcelona' },
          { id: 'q1-a3', text: 'Seville' },
          { id: 'q1-a4', text: 'Valencia' },
        ],
        correctAnswer: 'q1-a1',
        explanation: 'Madrid is the capital and largest city of Spain.',
        mainSection: 'administrativo',
        subSection: 'general',
        subSectionIndex: 1,
      };

      expect(question.id).toBe('q1');
      expect(question.questionText).toBe('What is the capital of Spain?');
      expect(question.questionIndex).toBe(1);
      expect(question.answers).toHaveLength(4);
      expect(question.correctAnswer).toBe('q1-a1');
      expect(question.explanation).toBe(
        'Madrid is the capital and largest city of Spain.',
      );
      expect(question.mainSection).toBe('administrativo');
      expect(question.subSection).toBe('general');
      expect(question.subSectionIndex).toBe(1);
    });

    it('should maintain proper typing for Question properties', () => {
      const question: Question = {
        id: 'test-q',
        questionText: 'Test question?',
        questionIndex: 5,
        answers: [
          { id: 'a1', text: 'Answer 1' },
          { id: 'a2', text: 'Answer 2' },
        ],
        correctAnswer: 'a1',
        explanation: 'Test explanation',
        mainSection: 'test',
        subSection: 'basic',
        subSectionIndex: 2,
      };

      expect(typeof question.id).toBe('string');
      expect(typeof question.questionText).toBe('string');
      expect(typeof question.questionIndex).toBe('number');
      expect(Array.isArray(question.answers)).toBe(true);
      expect(typeof question.correctAnswer).toBe('string');
      expect(typeof question.explanation).toBe('string');
      expect(typeof question.mainSection).toBe('string');
      expect(typeof question.subSection).toBe('string');
      expect(typeof question.subSectionIndex).toBe('number');
    });

    it('should handle answers array correctly', () => {
      const question: Question = {
        id: 'q2',
        questionText: 'Which color is primary?',
        questionIndex: 2,
        answers: [
          { id: 'q2-a1', text: 'Red' },
          { id: 'q2-a2', text: 'Green' },
          { id: 'q2-a3', text: 'Purple' },
        ],
        correctAnswer: 'q2-a1',
        explanation: 'Red is a primary color.',
        mainSection: 'colors',
        subSection: 'primary',
        subSectionIndex: 1,
      };

      expect(question.answers).toHaveLength(3);
      expect(question.answers[0].id).toBe('q2-a1');
      expect(question.answers[0].text).toBe('Red');
      expect(question.answers[1].id).toBe('q2-a2');
      expect(question.answers[1].text).toBe('Green');
      expect(question.answers[2].id).toBe('q2-a3');
      expect(question.answers[2].text).toBe('Purple');
    });

    it('should handle empty answers array', () => {
      const question: Question = {
        id: 'q3',
        questionText: 'Question with no answers',
        questionIndex: 3,
        answers: [],
        correctAnswer: '',
        explanation: 'No answers provided',
        mainSection: 'test',
        subSection: 'empty',
        subSectionIndex: 1,
      };

      expect(question.answers).toHaveLength(0);
      expect(Array.isArray(question.answers)).toBe(true);
    });

    it('should handle special characters in question text', () => {
      const question: Question = {
        id: 'q4',
        questionText: '¿Cuál es la capital de España?',
        questionIndex: 4,
        answers: [
          { id: 'q4-a1', text: 'Madrid' },
          { id: 'q4-a2', text: 'Barcelona' },
        ],
        correctAnswer: 'q4-a1',
        explanation: 'Madrid es la capital de España.',
        mainSection: 'español',
        subSection: 'geografía',
        subSectionIndex: 1,
      };

      expect(question.questionText).toBe('¿Cuál es la capital de España?');
      expect(question.explanation).toBe('Madrid es la capital de España.');
      expect(question.mainSection).toBe('español');
      expect(question.subSection).toBe('geografía');
    });
  });

  describe('Questions Interface', () => {
    it('should create Questions with array of Question objects', () => {
      const questionList: Question[] = [
        {
          id: 'q1',
          questionText: 'First question?',
          questionIndex: 1,
          answers: [
            { id: 'q1-a1', text: 'Answer 1' },
            { id: 'q1-a2', text: 'Answer 2' },
          ],
          correctAnswer: 'q1-a1',
          explanation: 'First explanation',
          mainSection: 'section1',
          subSection: 'sub1',
          subSectionIndex: 1,
        },
        {
          id: 'q2',
          questionText: 'Second question?',
          questionIndex: 2,
          answers: [
            { id: 'q2-a1', text: 'Answer A' },
            { id: 'q2-a2', text: 'Answer B' },
          ],
          correctAnswer: 'q2-a2',
          explanation: 'Second explanation',
          mainSection: 'section1',
          subSection: 'sub1',
          subSectionIndex: 1,
        },
      ];

      const questions: Questions = {
        questions: questionList,
      };

      expect(questions.questions).toHaveLength(2);
      expect(questions.questions[0].id).toBe('q1');
      expect(questions.questions[1].id).toBe('q2');
    });

    it('should handle empty Questions array', () => {
      const questions: Questions = {
        questions: [],
      };

      expect(questions.questions).toHaveLength(0);
      expect(Array.isArray(questions.questions)).toBe(true);
    });

    it('should maintain proper typing for Questions', () => {
      const questions: Questions = {
        questions: [
          {
            id: 'test-q',
            questionText: 'Test?',
            questionIndex: 1,
            answers: [{ id: 'a1', text: 'Answer' }],
            correctAnswer: 'a1',
            explanation: 'Test explanation',
            mainSection: 'test',
            subSection: 'basic',
            subSectionIndex: 1,
          },
        ],
      };

      expect(Array.isArray(questions.questions)).toBe(true);
      expect(questions.questions[0]).toBeDefined();
      expect(typeof questions.questions[0].id).toBe('string');
    });
  });

  describe('Answer Interface (Internal)', () => {
    it('should handle Answer objects correctly', () => {
      const question: Question = {
        id: 'q5',
        questionText: 'Test question for answers?',
        questionIndex: 5,
        answers: [
          { id: 'q5-a1', text: 'First answer' },
          { id: 'q5-a2', text: 'Second answer' },
          { id: 'q5-a3', text: 'Third answer' },
        ],
        correctAnswer: 'q5-a2',
        explanation: 'Second answer is correct',
        mainSection: 'test',
        subSection: 'answers',
        subSectionIndex: 1,
      };

      question.answers.forEach((answer) => {
        expect(typeof answer.id).toBe('string');
        expect(typeof answer.text).toBe('string');
        expect(answer.id).toBeTruthy();
        expect(answer.text).toBeTruthy();
      });
    });

    it('should handle answers with special characters', () => {
      const question: Question = {
        id: 'q6',
        questionText: 'Special characters test?',
        questionIndex: 6,
        answers: [
          { id: 'q6-a1', text: 'Answer with áéíóú' },
          { id: 'q6-a2', text: 'Answer with ñ and ü' },
          { id: 'q6-a3', text: 'Answer with 10% & symbols!' },
        ],
        correctAnswer: 'q6-a1',
        explanation: 'Special characters are supported',
        mainSection: 'special',
        subSection: 'chars',
        subSectionIndex: 1,
      };

      expect(question.answers[0].text).toBe('Answer with áéíóú');
      expect(question.answers[1].text).toBe('Answer with ñ and ü');
      expect(question.answers[2].text).toBe('Answer with 10% & symbols!');
    });
  });

  describe('Data Validation Scenarios', () => {
    it('should validate correct answer exists in answers array', () => {
      const question: Question = {
        id: 'q7',
        questionText: 'Validation test?',
        questionIndex: 7,
        answers: [
          { id: 'q7-a1', text: 'Answer 1' },
          { id: 'q7-a2', text: 'Answer 2' },
          { id: 'q7-a3', text: 'Answer 3' },
        ],
        correctAnswer: 'q7-a2',
        explanation: 'Answer 2 is correct',
        mainSection: 'validation',
        subSection: 'test',
        subSectionIndex: 1,
      };

      const correctAnswerExists = question.answers.some(
        (answer) => answer.id === question.correctAnswer,
      );

      expect(correctAnswerExists).toBe(true);
    });

    it('should handle question sorting by index', () => {
      const questions: Question[] = [
        {
          id: 'q3',
          questionText: 'Third question?',
          questionIndex: 3,
          answers: [{ id: 'a1', text: 'Answer' }],
          correctAnswer: 'a1',
          explanation: 'Third',
          mainSection: 'sort',
          subSection: 'test',
          subSectionIndex: 1,
        },
        {
          id: 'q1',
          questionText: 'First question?',
          questionIndex: 1,
          answers: [{ id: 'a1', text: 'Answer' }],
          correctAnswer: 'a1',
          explanation: 'First',
          mainSection: 'sort',
          subSection: 'test',
          subSectionIndex: 1,
        },
        {
          id: 'q2',
          questionText: 'Second question?',
          questionIndex: 2,
          answers: [{ id: 'a1', text: 'Answer' }],
          correctAnswer: 'a1',
          explanation: 'Second',
          mainSection: 'sort',
          subSection: 'test',
          subSectionIndex: 1,
        },
      ];

      const sortedQuestions = questions.sort(
        (a, b) => a.questionIndex - b.questionIndex,
      );

      expect(sortedQuestions[0].questionIndex).toBe(1);
      expect(sortedQuestions[1].questionIndex).toBe(2);
      expect(sortedQuestions[2].questionIndex).toBe(3);
      expect(sortedQuestions[0].id).toBe('q1');
      expect(sortedQuestions[1].id).toBe('q2');
      expect(sortedQuestions[2].id).toBe('q3');
    });

    it('should handle questions grouped by section', () => {
      const questions: Question[] = [
        {
          id: 'q1',
          questionText: 'Admin question?',
          questionIndex: 1,
          answers: [{ id: 'a1', text: 'Answer' }],
          correctAnswer: 'a1',
          explanation: 'Admin explanation',
          mainSection: 'administrativo',
          subSection: 'general',
          subSectionIndex: 1,
        },
        {
          id: 'q2',
          questionText: 'Environment question?',
          questionIndex: 2,
          answers: [{ id: 'a1', text: 'Answer' }],
          correctAnswer: 'a1',
          explanation: 'Environment explanation',
          mainSection: 'medio ambiente',
          subSection: 'basic',
          subSectionIndex: 1,
        },
      ];

      const adminQuestions = questions.filter(
        (q) => q.mainSection === 'administrativo',
      );
      const envQuestions = questions.filter(
        (q) => q.mainSection === 'medio ambiente',
      );

      expect(adminQuestions).toHaveLength(1);
      expect(envQuestions).toHaveLength(1);
      expect(adminQuestions[0].id).toBe('q1');
      expect(envQuestions[0].id).toBe('q2');
    });
  });
});
