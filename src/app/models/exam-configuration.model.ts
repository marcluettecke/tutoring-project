export interface SectionSelection {
  mainSection: string;
  subsections?: string[]; // Empty array means all subsections
  questionCount?: number; // Custom question count for this section
}

export interface ExamConfiguration {
  selections: SectionSelection[];
  totalQuestions: number | 'full'; // 'full' means all available questions
  questionDistribution: 'proportional' | 'custom'; // proportional distributes based on available questions
  customDistribution?: { [key: string]: number }; // Custom question counts per section/subsection
}

export interface SectionQuestionInfo {
  mainSection: string;
  subsection?: string;
  availableQuestions: number;
  selectedQuestions: number;
}

export type ExamQuestionOption = 'full' | 100 | 50 | 35 | 25 | 20;