import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faPlay, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { QuestionsService } from '../../services/questions.service';
import { TestService } from '../../services/test.service';
import { MAINSECTIONS, SUBSECTIONS } from '../../constants/sections';
import { 
  ExamConfiguration, 
  SectionQuestionInfo,
  ExamQuestionOption 
} from '../../models/exam-configuration.model';
import { Question } from '../../models/question.model';

@Component({
  selector: 'app-exam-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  templateUrl: './exam-configuration.html',
  styleUrl: './exam-configuration.scss'
})
export class ExamConfigurationComponent implements OnInit, OnDestroy {
  // Icons
  faPlus = faPlus;
  faTrash = faTrash;
  faPlay = faPlay;
  faInfoCircle = faInfoCircle;

  // Form
  examForm!: FormGroup;

  // Data
  mainSections = MAINSECTIONS;
  subsections: { [key: string]: { name: string; index: number }[] } = SUBSECTIONS;
  questionOptions: ExamQuestionOption[] = ['full', 100, 50, 35, 25, 20];
  standardExamWeights: { [key: string]: number } = {
    'administrativo': 20,
    'medio ambiente': 25,
    'costas': 20,
    'aguas': 35
  };
  
  // Question counts per section/subsection
  availableQuestionCounts: { [key: string]: number } = {};
  totalAvailableQuestions = 0;
  totalSelectedQuestions = 0;

  // Component state
  isLoading = true;
  validationErrors: string[] = [];
  
  // Subscriptions
  private destroy$ = new Subject<void>();

  // Check if current configuration matches standard exam
  get isStandardExamConfiguration(): boolean {
    const selections = this.selectionsArray.value;
    
    // Must have exactly 4 selections
    if (selections.length !== 4) return false;
    
    // Check if all sections are present with correct weights
    const sectionWeights: { [key: string]: number } = {};
    
    for (const selection of selections) {
      if (!selection.mainSection || !selection.includeAllSubsections) return false;
      if (selection.selectedSubsections && selection.selectedSubsections.length > 0) return false;
      
      sectionWeights[selection.mainSection] = selection.questionCount;
    }
    
    // Check if all standard sections are present with correct weights
    return Object.keys(this.standardExamWeights).every(section => 
      sectionWeights[section] === this.standardExamWeights[section]
    );
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private questionsService: QuestionsService,
    private testService: TestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadQuestionCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.examForm = this.fb.group({
      selections: this.fb.array([this.createSectionSelection()])
    });

    // Subscribe to form changes
    this.examForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculateTotalQuestions();
        this.validateConfiguration();
      });
  }

  private createSectionSelection(): FormGroup {
    return this.fb.group({
      mainSection: [''],
      includeAllSubsections: [true],
      selectedSubsections: [[]],
      questionCount: ['full']
    });
  }

  get selectionsArray(): FormArray {
    return this.examForm.get('selections') as FormArray;
  }

  addSection(): void {
    this.selectionsArray.push(this.createSectionSelection());
  }

  removeSection(index: number): void {
    this.selectionsArray.removeAt(index);
  }

  private loadQuestionCounts(): void {
    this.isLoading = true;
    
    // Get all questions to count them per section/subsection
    this.questionsService.getQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((questions: Question[]) => {
        this.calculateAvailableQuestions(questions);
        this.isLoading = false;
      });
  }

  private calculateAvailableQuestions(questions: Question[]): void {
    // Reset counts
    this.availableQuestionCounts = {};
    this.totalAvailableQuestions = 0;

    // Count questions per main section
    this.mainSections.forEach(section => {
      const sectionQuestions = questions.filter(q => q.mainSection === section);
      this.availableQuestionCounts[section] = sectionQuestions.length;
      
      // Count questions per subsection
      if (this.subsections[section]) {
        this.subsections[section].forEach((subsection: any) => {
          const key = `${section}_${subsection.name}`;
          const subsectionQuestions = sectionQuestions.filter(
            q => q.subSection === subsection.name
          );
          this.availableQuestionCounts[key] = subsectionQuestions.length;
        });
      }
    });

    this.totalAvailableQuestions = questions.length;
  }

  getAvailableQuestions(mainSection: string, subsection?: string): number {
    if (subsection) {
      return this.availableQuestionCounts[`${mainSection}_${subsection}`] || 0;
    }
    return this.availableQuestionCounts[mainSection] || 0;
  }

  onMainSectionChange(index: number): void {
    const selection = this.selectionsArray.at(index);
    selection.patchValue({
      selectedSubsections: [],
      includeAllSubsections: true
    });
  }

  toggleSubsection(selectionIndex: number, subsectionName: string): void {
    const selection = this.selectionsArray.at(selectionIndex);
    const currentSubsections = selection.get('selectedSubsections')?.value || [];
    
    const index = currentSubsections.indexOf(subsectionName);
    if (index > -1) {
      currentSubsections.splice(index, 1);
    } else {
      currentSubsections.push(subsectionName);
    }
    
    selection.patchValue({
      selectedSubsections: currentSubsections,
      includeAllSubsections: false
    });
  }

  isSubsectionSelected(selectionIndex: number, subsectionName: string): boolean {
    const selection = this.selectionsArray.at(selectionIndex);
    const includeAll = selection.get('includeAllSubsections')?.value;
    
    if (includeAll) return true;
    
    const selectedSubsections = selection.get('selectedSubsections')?.value || [];
    return selectedSubsections.includes(subsectionName);
  }

  private calculateTotalQuestions(): void {
    const selections = this.selectionsArray.value;
    let total = 0;

    selections.forEach((selection: any) => {
      if (!selection.mainSection) return;
      
      const questionCount = selection.questionCount;
      if (questionCount === 'full') {
        if (selection.includeAllSubsections) {
          total += this.getAvailableQuestions(selection.mainSection);
        } else {
          selection.selectedSubsections.forEach((subsection: string) => {
            total += this.getAvailableQuestions(selection.mainSection, subsection);
          });
        }
      } else {
        total += questionCount;
      }
    });

    this.totalSelectedQuestions = total;
  }

  calculateMaxQuestionsForSelections(selections: any[]): number {
    let total = 0;
    const countedSections = new Set<string>();

    selections.forEach(selection => {
      if (!selection.mainSection) return;
      
      if (selection.includeAllSubsections) {
        // Add all questions from the main section if not already counted
        if (!countedSections.has(selection.mainSection)) {
          total += this.getAvailableQuestions(selection.mainSection);
          countedSections.add(selection.mainSection);
        }
      } else {
        // Add questions from selected subsections
        selection.selectedSubsections.forEach((subsection: string) => {
          const key = `${selection.mainSection}_${subsection}`;
          if (!countedSections.has(key)) {
            total += this.getAvailableQuestions(selection.mainSection, subsection);
            countedSections.add(key);
          }
        });
      }
    });

    return total;
  }

  private validateConfiguration(): void {
    this.validationErrors = [];
    const selections = this.selectionsArray.value;

    // Check if at least one section is selected
    const hasValidSelection = selections.some((s: any) => 
      s.mainSection && (s.includeAllSubsections || s.selectedSubsections.length > 0)
    );

    if (!hasValidSelection) {
      this.validationErrors.push('Debe seleccionar al menos una sección o subsección');
    }

    // Check each selection for validity
    selections.forEach((selection: any, index: number) => {
      if (!selection.mainSection) return;

      const questionCount = selection.questionCount;
      if (questionCount !== 'full') {
        const maxAvailable = this.getMaxQuestionsForSelection(index);
        if (questionCount > maxAvailable) {
          const sectionName = selection.mainSection;
          this.validationErrors.push(
            `${sectionName}: ${questionCount} preguntas solicitadas exceden las ${maxAvailable} disponibles`
          );
        }
      }
    });

    // Check if at least one question will be selected
    if (this.totalSelectedQuestions === 0) {
      this.validationErrors.push('Debe seleccionar al menos una pregunta');
    }
  }

  isQuestionOptionDisabled(option: ExamQuestionOption): boolean {
    if (option === 'full') return false;
    
    const selections = this.selectionsArray.value;
    const maxAvailable = this.calculateMaxQuestionsForSelections(selections);
    return option > maxAvailable;
  }

  getQuestionOptionLabel(option: ExamQuestionOption): string {
    if (option === 'full') {
      const selections = this.selectionsArray.value;
      const max = this.calculateMaxQuestionsForSelections(selections);
      return `Todas (${max} preguntas)`;
    }
    return `${option} preguntas`;
  }


  getSectionInfo(): SectionQuestionInfo[] {
    const selections = this.selectionsArray.value;
    const info: SectionQuestionInfo[] = [];

    selections.forEach((selection: any) => {
      if (!selection.mainSection) return;

      const questionCount = selection.questionCount;
      
      if (selection.includeAllSubsections) {
        const available = this.getAvailableQuestions(selection.mainSection);
        const selected = questionCount === 'full' ? available : questionCount;
        
        info.push({
          mainSection: selection.mainSection,
          availableQuestions: available,
          selectedQuestions: selected
        });
      } else {
        // When specific subsections are selected, show total for the section
        const selectedSubsections = selection.selectedSubsections;
        const totalAvailable = selectedSubsections.reduce((sum: number, subsection: string) => {
          return sum + this.getAvailableQuestions(selection.mainSection, subsection);
        }, 0);
        
        const totalSelected = questionCount === 'full' ? totalAvailable : questionCount;
        
        // Create a single entry for the section with subsections listed
        info.push({
          mainSection: selection.mainSection,
          subsection: selectedSubsections.join(', '), // List all selected subsections
          availableQuestions: totalAvailable,
          selectedQuestions: totalSelected
        });
      }
    });

    return info;
  }

  /**
   * Apply standard exam preset with most frequent distribution
   */
  applyStandardExamPreset(): void {
    // Clear existing selections
    while (this.selectionsArray.length > 0) {
      this.selectionsArray.removeAt(0);
    }

    // Add all four main sections with standard weights
    const sections = ['administrativo', 'medio ambiente', 'costas', 'aguas'];
    sections.forEach(section => {
      const questionCount = this.standardExamWeights[section];
      const selectionForm = this.fb.group({
        mainSection: [section],
        includeAllSubsections: [true],
        selectedSubsections: [[]],
        questionCount: [questionCount]
      });
      this.selectionsArray.push(selectionForm);
    });

    // Force change detection to update the view
    this.cdr.detectChanges();
    
    // Trigger calculations after view update
    this.calculateTotalQuestions();
    this.validateConfiguration();
  }

  /**
   * Get question options for a specific selection
   */
  getQuestionOptionsForSelection(index: number): ExamQuestionOption[] {
    const selection = this.selectionsArray.at(index);
    if (!selection) return [];

    const maxAvailable = this.getMaxQuestionsForSelection(index);
    
    // Return options that don't exceed available questions
    return this.questionOptions.filter(option => 
      option === 'full' || option <= maxAvailable
    );
  }

  /**
   * Get maximum questions available for a selection
   */
  private getMaxQuestionsForSelection(index: number): number {
    const selection = this.selectionsArray.at(index).value;
    if (!selection.mainSection) return 0;

    let total = 0;
    if (selection.includeAllSubsections) {
      total = this.getAvailableQuestions(selection.mainSection);
    } else {
      selection.selectedSubsections.forEach((subsection: string) => {
        total += this.getAvailableQuestions(selection.mainSection, subsection);
      });
    }

    return total;
  }

  /**
   * Check if a question option is available for a selection
   */
  isQuestionOptionAvailable(index: number, option: ExamQuestionOption): boolean {
    if (option === 'full') return true;
    
    const maxAvailable = this.getMaxQuestionsForSelection(index);
    return option <= maxAvailable;
  }

  /**
   * Get label for question option in a selection
   */
  getQuestionOptionLabelForSelection(index: number, option: ExamQuestionOption): string {
    if (option === 'full') {
      const max = this.getMaxQuestionsForSelection(index);
      return `Todas (${max})`;
    }
    
    // Check if this option matches the standard exam weight for the current section
    const selection = this.selectionsArray.at(index).value;
    const standardWeight = this.standardExamWeights[selection.mainSection];
    
    if (option === standardWeight) {
      return `${option} (estándar)`;
    }
    
    return option.toString();
  }

  /**
   * Check if an option is the standard weight for a section
   */
  isStandardWeightOption(index: number, option: ExamQuestionOption): boolean {
    if (option === 'full') return false;
    
    const selection = this.selectionsArray.at(index).value;
    const standardWeight = this.standardExamWeights[selection.mainSection];
    
    return option === standardWeight;
  }

  /**
   * Update the exam configuration for submission
   */
  startExam(): void {
    if (this.validationErrors.length > 0) return;

    const configuration: ExamConfiguration = {
      selections: this.selectionsArray.value.map((s: any) => ({
        mainSection: s.mainSection,
        subsections: s.includeAllSubsections ? [] : s.selectedSubsections,
        questionCount: s.questionCount === 'full' ? undefined : s.questionCount
      })),
      totalQuestions: this.totalSelectedQuestions,
      questionDistribution: 'custom'
    };

    // Store configuration in test service
    this.testService.setCustomConfiguration(configuration);
    
    // Navigate to test view
    this.router.navigate(['/test']);
  }
}