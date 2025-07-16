import { Injectable } from '@angular/core';
import { TestSession, SectionProgressData, TestServiceAnswers } from '../models/progress.model';

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {

  /**
   * Convert TestServiceAnswers to SectionProgressData format for charts
   */
  convertTestServiceAnswersToChartData(correctAnswers: TestServiceAnswers): SectionProgressData[] {
    const sectionsInOrder = ['administrativo', 'medio ambiente', 'costas', 'aguas', 'total'];
    
    return sectionsInOrder.map(section => {
      const sectionData = correctAnswers[section];
      if (!sectionData) return null;
      
      const questionsAnswered = sectionData.correct + sectionData.incorrect;
      return {
        sectionName: section,
        subSection: undefined,
        questionsAnswered,
        correctAnswers: sectionData.correct,
        incorrectAnswers: sectionData.incorrect,
        blankAnswers: sectionData.blank || 0,
        timeSpent: 0, // Time data not available for test exams
        accuracy: questionsAnswered > 0 ? (sectionData.correct / questionsAnswered) * 100 : 0,
        avgTimePerQuestion: 0
      };
    }).filter(Boolean) as SectionProgressData[];
  }

  /**
   * Convert TestSession to SectionProgressData format for charts
   */
  convertSessionToChartData(session: TestSession): SectionProgressData[] {
    // For test exams, create section data based on typical distribution
    if (session.mode === 'test') {
      return this.createTestExamSectionData(session);
    } else {
      // For practice sessions, return simple total data
      return [{
        sectionName: session.mainSection || 'total',
        subSection: session.subSection,
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        blankAnswers: session.blankAnswers || 0,
        timeSpent: session.timeSpent * 1000,
        accuracy: session.questionsAnswered > 0 ? (session.correctAnswers / session.questionsAnswered) * 100 : 0,
        avgTimePerQuestion: session.questionsAnswered > 0 ? (session.timeSpent * 1000) / session.questionsAnswered : 0
      }];
    }
  }

  /**
   * Create section data for test exams with typical distribution
   */
  private createTestExamSectionData(session: TestSession): SectionProgressData[] {
    const totalQuestions = session.questionsAnswered;
    const totalCorrect = session.correctAnswers;
    const totalIncorrect = session.incorrectAnswers;
    
    // Simple distribution for display purposes
    const sectionDistribution = {
      'administrativo': 0.4,
      'medio ambiente': 0.25,
      'costas': 0.2,
      'aguas': 0.15
    };
    
    const result: SectionProgressData[] = [];
    
    // Create individual sections
    for (const section of Object.keys(sectionDistribution)) {
      const ratio = sectionDistribution[section as keyof typeof sectionDistribution];
      const sectionQuestions = Math.round(totalQuestions * ratio);
      const sectionCorrect = Math.round(totalCorrect * ratio);
      const sectionIncorrect = sectionQuestions - sectionCorrect;
      
      result.push({
        sectionName: section,
        subSection: undefined,
        questionsAnswered: sectionQuestions,
        correctAnswers: sectionCorrect,
        incorrectAnswers: sectionIncorrect,
        blankAnswers: 0,
        timeSpent: session.timeSpent > 0 ? session.timeSpent * 1000 * ratio : 0,
        accuracy: sectionQuestions > 0 ? (sectionCorrect / sectionQuestions) * 100 : 0,
        avgTimePerQuestion: sectionQuestions > 0 && session.timeSpent > 0 ? (session.timeSpent * 1000 * ratio) / sectionQuestions : 0
      });
    }
    
    // Add total section
    result.push({
      sectionName: 'total',
      subSection: undefined,
      questionsAnswered: totalQuestions,
      correctAnswers: totalCorrect,
      incorrectAnswers: totalIncorrect,
      blankAnswers: session.blankAnswers || 0,
      timeSpent: session.timeSpent > 0 ? session.timeSpent * 1000 : 0,
      accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      avgTimePerQuestion: totalQuestions > 0 && session.timeSpent > 0 ? (session.timeSpent * 1000) / totalQuestions : 0
    });
    
    return result;
  }

  /**
   * Build section data from progress session
   */
  buildSectionDataFromProgressSession(progressSession: any): SectionProgressData[] {
    // If no section breakdown, create it from the session data
    if (!progressSession.sectionBreakdown || progressSession.sectionBreakdown.length === 0) {
      return [{
        sectionName: progressSession.mainSection || 'total',
        subSection: progressSession.subSection,
        questionsAnswered: progressSession.questionsAnswered,
        correctAnswers: progressSession.correctAnswers,
        incorrectAnswers: progressSession.incorrectAnswers,
        blankAnswers: progressSession.totalQuestions - progressSession.questionsAnswered,
        timeSpent: progressSession.timeElapsed,
        accuracy: progressSession.questionsAnswered > 0 ? 
          (progressSession.correctAnswers / progressSession.questionsAnswered) * 100 : 0,
        avgTimePerQuestion: progressSession.questionsAnswered > 0 ? 
          progressSession.timeElapsed / progressSession.questionsAnswered : 0
      }];
    } else {
      return progressSession.sectionBreakdown;
    }
  }

  /**
   * Format session for dropdown display
   */
  formatSessionForDropdown(session: TestSession): string {
    const date = new Date(session.timestamp);
    const modeText = session.mode === 'test' ? 'Examen' : 'Práctica';
    return `${modeText} - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
}