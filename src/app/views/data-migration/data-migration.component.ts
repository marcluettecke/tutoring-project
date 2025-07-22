import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionsService } from '../../services/questions.service';
import { Question } from '../../models/question.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-data-migration',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './data-migration.component.html',
  styleUrls: ['./data-migration.component.scss']
})
export class DataMigrationComponent implements OnInit {
  // Icons
  faDownload = faDownload;
  faSearch = faSearch;
  faExclamationTriangle = faExclamationTriangle;

  // Migration settings (editable)
  OLD_SUBSECTION = 'Igualdad, Violencia de Género y Dependencia'; // Note: Capital G
  NEW_SUBSECTION = 'Leyes de Derechos Sociales';
  MAIN_SECTION = 'administrativo';

  // State
  isLoading = false;
  affectedQuestions: Question[] = [];
  hasSearched = false;
  backupCreated = false;
  allSubsections: string[] = [];
  isMigrating = false;
  migrationComplete = false;
  migrationError = '';
  migrationProgress = 0;

  constructor(private questionsService: QuestionsService) {}

  ngOnInit(): void {
    // Component is ready
  }

  /**
   * Search for questions with the old subsection name
   */
  async searchAffectedQuestions(): Promise<void> {
    this.isLoading = true;
    this.hasSearched = false;
    this.backupCreated = false;
    this.migrationComplete = false;
    this.migrationError = '';
    this.migrationProgress = 0;
    
    try {
      // Get all questions and filter for the specific subsection
      this.questionsService.getQuestions().subscribe(questions => {
        console.log('Total questions fetched:', questions.length);
        
        // Log unique subsections for debugging
        const subsectionsInAdmin = questions
          .filter(q => q.mainSection === this.MAIN_SECTION)
          .map(q => q.subSection)
          .filter((v, i, a) => a.indexOf(v) === i);
        
        console.log('Unique subsections in administrativo:', subsectionsInAdmin);
        this.allSubsections = subsectionsInAdmin.sort();
        
        this.affectedQuestions = questions.filter(q => 
          q.mainSection === this.MAIN_SECTION && 
          q.subSection === this.OLD_SUBSECTION
        );
        
        console.log('Questions with old subsection:', this.affectedQuestions.length);
        
        this.hasSearched = true;
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error searching questions:', error);
      this.isLoading = false;
    }
  }

  /**
   * Export affected questions as markdown
   */
  exportAsMarkdown(): void {
    if (this.affectedQuestions.length === 0) return;

    let markdown = `# Questions Backup - ${new Date().toISOString()}\n\n`;
    markdown += `## Migration Details\n\n`;
    markdown += `- **Date**: ${new Date().toLocaleString()}\n`;
    markdown += `- **From**: "${this.OLD_SUBSECTION}"\n`;
    markdown += `- **To**: "${this.NEW_SUBSECTION}"\n`;
    markdown += `- **Main Section**: ${this.MAIN_SECTION}\n`;
    markdown += `- **Total Questions**: ${this.affectedQuestions.length}\n\n`;
    markdown += `---\n\n`;
    markdown += `## Affected Questions\n\n`;

    this.affectedQuestions.forEach((q, index) => {
      markdown += `### Question ${index + 1}\n\n`;
      markdown += `**ID**: ${q.id}\n\n`;
      markdown += `**Question Text**:\n${q.questionText}\n\n`;
      markdown += `**Answers**:\n`;
      q.answers.forEach((answer, i) => {
        markdown += `${i + 1}. ${answer.text}${answer.id === q.correctAnswer ? ' ✓' : ''}\n`;
      });
      markdown += `\n**Correct Answer ID**: ${q.correctAnswer}\n\n`;
      if (q.explanation) {
        markdown += `**Explanation**:\n${q.explanation}\n\n`;
      }
      markdown += `**Metadata**:\n`;
      markdown += `- Main Section: ${q.mainSection}\n`;
      markdown += `- Sub Section: ${q.subSection}\n`;
      markdown += `- Sub Section Index: ${q.subSectionIndex}\n`;
      markdown += `- Question Index: ${q.questionIndex}\n`;
      markdown += `\n---\n\n`;
    });

    this.downloadFile(`questions-backup-${Date.now()}.md`, markdown, 'text/markdown');
    this.backupCreated = true;
  }

  /**
   * Export affected questions as JSON
   */
  exportAsJson(): void {
    if (this.affectedQuestions.length === 0) return;

    const backup = {
      metadata: {
        backupDate: new Date().toISOString(),
        backupTimestamp: Date.now(),
        migration: {
          from: this.OLD_SUBSECTION,
          to: this.NEW_SUBSECTION,
          mainSection: this.MAIN_SECTION
        },
        totalQuestions: this.affectedQuestions.length
      },
      questions: this.affectedQuestions
    };

    const jsonString = JSON.stringify(backup, null, 2);
    this.downloadFile(`questions-backup-${Date.now()}.json`, jsonString, 'application/json');
    this.backupCreated = true;
  }

  /**
   * Download file helper
   */
  private downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get summary text for display
   */
  get summaryText(): string {
    if (!this.hasSearched) {
      return 'Click "Search Affected Questions" to begin';
    }
    if (this.affectedQuestions.length === 0) {
      return 'No questions found with the old subsection name';
    }
    return `Found ${this.affectedQuestions.length} questions that need migration`;
  }

  /**
   * Execute the migration
   */
  async executeMigration(): Promise<void> {
    if (this.affectedQuestions.length === 0 || !this.backupCreated) {
      this.migrationError = 'Please create a backup before migrating';
      return;
    }

    if (!confirm(`Are you sure you want to migrate ${this.affectedQuestions.length} questions?\n\nThis will change the subsection from:\n"${this.OLD_SUBSECTION}"\n\nto:\n"${this.NEW_SUBSECTION}"`)) {
      return;
    }

    this.isMigrating = true;
    this.migrationError = '';
    this.migrationProgress = 0;

    try {
      let successCount = 0;
      const totalQuestions = this.affectedQuestions.length;

      for (const question of this.affectedQuestions) {
        try {
          // Update the question with new subsection
          await this.questionsService.updateQuestionSubsection(
            question.id, 
            this.NEW_SUBSECTION
          );
          
          successCount++;
          this.migrationProgress = Math.floor((successCount / totalQuestions) * 100);
          
          console.log(`Updated question ${question.id}: ${successCount}/${totalQuestions}`);
        } catch (error) {
          console.error(`Failed to update question ${question.id}:`, error);
          this.migrationError += `Failed to update question ${question.id}\n`;
        }
      }

      if (successCount === totalQuestions) {
        this.migrationComplete = true;
        console.log('Migration completed successfully!');
        
        // Clear the affected questions list since they're migrated
        this.affectedQuestions = [];
        this.hasSearched = false;
      } else {
        this.migrationError = `Migration partially complete. ${successCount}/${totalQuestions} questions updated.`;
      }
    } catch (error) {
      console.error('Migration failed:', error);
      this.migrationError = 'Migration failed. Please check the console for details.';
    } finally {
      this.isMigrating = false;
    }
  }
}