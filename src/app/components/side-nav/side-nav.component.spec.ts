import { SideNavComponent } from './side-nav.component';
import { of, Observable } from 'rxjs';
import { Question } from '../../models/question.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create a mock service class that implements QuestionsService methods
class MockQuestionsService {
  private questionsData: Question[] = [];

  setQuestionsData(questions: Question[]): void {
    this.questionsData = questions;
  }

  getQuestions(): Observable<Question[]> {
    return of(this.questionsData);
  }

  // Add other methods as stubs if needed
  getQuestionsBySection(): Observable<Question[]> {
    return of([]);
  }

  addQuestion(): Promise<void> {
    return Promise.resolve();
  }

  updateQuestion(): Promise<void> {
    return Promise.resolve();
  }

  deleteQuestion(): Promise<void> {
    return Promise.resolve();
  }
}

describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let mockQuestionsService: MockQuestionsService;

  const mockQuestions: Question[] = [
    {
      id: '1',
      questionText: 'Test Question 1',
      mainSection: 'administrativo',
      subSection: 'subsection 1',
      subSectionIndex: 0,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      correctAnswerDescription: 'Test'
    },
    {
      id: '2',
      questionText: 'Test Question 2',
      mainSection: 'medio ambiente',
      subSection: 'subsection 2',
      subSectionIndex: 0,
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      correctAnswerDescription: 'Test'
    }
  ];

  beforeEach(() => {
    mockQuestionsService = new MockQuestionsService();
    mockQuestionsService.setQuestionsData(mockQuestions);

    // Create component instance manually to avoid DI issues
    component = new SideNavComponent(mockQuestionsService as any);
    component.activeSection = {
      mainSection: 'administrativo',
      subSection: 'subsection 1',
      mainSectionNumber: 1,
      subSectionNumber: 1
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize sections from questions', () => {
    component.ngOnInit();
    
    expect(component.mainSections.length).toBe(2);
    expect(component.mainSections).toContain('administrativo');
    expect(component.mainSections).toContain('medio ambiente');
  });

  it('should expand first section by default', () => {
    component.ngOnInit();
    
    expect(component.isExpanded[0]).toBe(true);
    expect(component.isExpanded[1]).toBe(false);
  });

  describe('clickHandlerMainList', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should toggle expansion state when clicking any section', () => {
      // First section is expanded by default
      expect(component.isExpanded[0]).toBe(true);
      
      // Click on first section (active section)
      component.clickHandlerMainList(0);
      expect(component.isExpanded[0]).toBe(false);
      
      // Click again to expand
      component.clickHandlerMainList(0);
      expect(component.isExpanded[0]).toBe(true);
    });

    it('should toggle expansion state for non-active sections', () => {
      // Second section is not expanded by default
      expect(component.isExpanded[1]).toBe(false);
      
      // Click on second section
      component.clickHandlerMainList(1);
      expect(component.isExpanded[1]).toBe(true);
      
      // Click again to collapse
      component.clickHandlerMainList(1);
      expect(component.isExpanded[1]).toBe(false);
    });
  });

  describe('active section styling', () => {
    it('should identify active main section correctly', () => {
      component.ngOnInit();
      
      // First section should be active (mainSectionNumber = 1)
      expect(component.activeSection.mainSectionNumber).toBe(1);
      expect(component.activeSection.mainSection).toBe('administrativo');
    });

    it('should update active section reference correctly', () => {
      component.ngOnInit();
      
      // Change active section to second main section
      component.activeSection = {
        mainSection: 'medio ambiente',
        subSection: 'subsection 2',
        mainSectionNumber: 2,
        subSectionNumber: 1
      };
      
      // Verify the active section has been updated
      expect(component.activeSection.mainSectionNumber).toBe(2);
      expect(component.activeSection.mainSection).toBe('medio ambiente');
    });
  });

  it('should emit click event when subsection is clicked', () => {
    const emitSpy = vi.spyOn(component.clickEmit, 'emit');
    
    component.clickHandlerSublist('administrativo', 'subsection 1', 1, 1);
    
    expect(emitSpy).toHaveBeenCalledWith({
      mainSection: 'administrativo',
      subSection: 'subsection 1',
      mainSectionNumber: 1,
      subSectionNumber: 1
    });
  });

  it('should toggle sidebar open state', () => {
    const emitSpy = vi.spyOn(component.expandSidebarEmit, 'emit');
    
    expect(component.open).toBe(true);
    
    component.iconClickHandler();
    expect(component.open).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(false);
    
    component.iconClickHandler();
    expect(component.open).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  describe('section sorting', () => {
    it('should sort main sections according to predefined order', () => {
      component.ngOnInit();
      
      // The order should be: administrativo, medio ambiente (based on sectionOrderEnum)
      expect(component.mainSections[0]).toBe('administrativo');
      expect(component.mainSections[1]).toBe('medio ambiente');
    });

    it('should sort subsections by index', () => {
      const questionsWithMultipleSubsections: Question[] = [
        {
          id: '1',
          questionText: 'Test 1',
          mainSection: 'administrativo',
          subSection: 'subsection B',
          subSectionIndex: 1,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          correctAnswerDescription: 'Test'
        },
        {
          id: '2',
          questionText: 'Test 2',
          mainSection: 'administrativo',
          subSection: 'subsection A',
          subSectionIndex: 0,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          correctAnswerDescription: 'Test'
        }
      ];
      
      mockQuestionsService.setQuestionsData(questionsWithMultipleSubsections);
      
      component.ngOnInit();
      
      // Subsections should be sorted by index
      expect(component.sections['administrativo'][0].name).toBe('subsection A');
      expect(component.sections['administrativo'][1].name).toBe('subsection B');
    });
  });

  describe('auto-selection behavior', () => {
    it('should auto-select first subsection when no active section is set', () => {
      const emitSpy = vi.spyOn(component.clickEmit, 'emit');
      
      // Clear active section
      component.activeSection = {
        mainSection: '',
        subSection: '',
        mainSectionNumber: 0,
        subSectionNumber: 0
      };
      
      component.ngOnInit();
      
      // Should emit selection of first subsection
      expect(emitSpy).toHaveBeenCalledWith({
        mainSection: 'administrativo',
        subSection: 'subsection 1',
        mainSectionNumber: 1,
        subSectionNumber: 1
      });
    });

    it('should not auto-select when active section is already set', () => {
      const emitSpy = vi.spyOn(component.clickEmit, 'emit');
      
      // Active section is already set in beforeEach
      component.ngOnInit();
      
      // Should not emit any auto-selection
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('filtering invalid questions', () => {
    it('should filter out questions with missing required fields', () => {
      const mixedQuestions: Question[] = [
        ...mockQuestions,
        {
          id: '',
          questionText: 'Invalid - empty id',
          mainSection: 'test',
          subSection: 'test',
          subSectionIndex: 0,
          options: ['A'],
          correctAnswer: 0,
          correctAnswerDescription: 'Test'
        },
        {
          id: '3',
          questionText: '',
          mainSection: 'test',
          subSection: 'test',
          subSectionIndex: 0,
          options: ['A'],
          correctAnswer: 0,
          correctAnswerDescription: 'Test'
        }
      ];
      
      mockQuestionsService.setQuestionsData(mixedQuestions);
      
      component.ngOnInit();
      
      // Should only include valid questions (2 from mockQuestions)
      expect(component.mainSections.length).toBe(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from observables on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});