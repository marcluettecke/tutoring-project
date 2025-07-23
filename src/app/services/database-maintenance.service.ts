import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, doc, writeBatch } from '@angular/fire/firestore';

// Spanish words that should not be capitalized (articles, prepositions, conjunctions)
const lowercaseWords = new Set(['y', 'e', 'o', 'u', 'de', 'del', 'a', 'al', 'en', 'el', 'la', 'las', 'los', 'por', 'para', 'con', 'sin', 'sobre']);

export interface SubsectionInfo {
  name: string;
  mainSection: string;
  subSectionIndex: number;
  count: number;
  questionIds: string[];
}

export interface SubsectionAnalysis {
  totalQuestions: number;
  uniqueSubsections: number;
  duplicateGroups: DuplicateGroup[];
  capitalizationIssues: CapitalizationIssue[];
}

export interface DuplicateGroup {
  normalizedKey: string;
  mainSection: string;
  variations: SubsectionInfo[];
}

export interface CapitalizationIssue {
  current: string;
  suggested: string;
  mainSection: string;
  questionCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseMaintenanceService {
  constructor(private firestore: Firestore) {}

  /**
   * Properly capitalizes a Spanish title
   */
  private properCapitalize(text: string): string {
    if (!text) return text;
    
    // Handle special cases and acronyms
    const specialCases: { [key: string]: string } = {
      'LCSP': 'LCSP',
      'EBEP': 'EBEP',
      'LC': 'LC',
      'TRLA': 'TRLA',
      'RPH': 'RPH',
      'IPH': 'IPH',
      'PHN': 'PHN',
      'DMA': 'DMA',
      'RD': 'RD',
      'MA': 'MA',
      'PNyB': 'PNyB',
    };
    
    // Split by spaces but preserve special patterns
    const words = text.split(/\s+/);
    
    return words.map((word, index) => {
      // Check if word contains special cases
      for (const [key, value] of Object.entries(specialCases)) {
        if (word.toUpperCase().includes(key)) {
          return word.replace(new RegExp(key, 'gi'), value);
        }
      }
      
      // First word is always capitalized
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Check if it's a lowercase word
      if (lowercaseWords.has(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Capitalize first letter, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  /**
   * Backup all questions to JSON
   */
  async backupQuestions(): Promise<{ data: Record<string, unknown>[], timestamp: string }> {
    const questionsRef = collection(this.firestore, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    const questions: Record<string, unknown>[] = [];
    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const timestamp = new Date().toISOString();
    
    return { data: questions, timestamp };
  }

  /**
   * Analyze subsections for duplicates and capitalization issues
   */
  async analyzeSubsections(): Promise<SubsectionAnalysis> {
    const subsectionMap = new Map<string, SubsectionInfo>();
    const questionsRef = collection(this.firestore, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    // Collect all subsections
    snapshot.forEach((questionDoc) => {
      const data = questionDoc.data();
      if (data['subSection']) {
        const key = `${data['mainSection']}::${data['subSection']}`;
        
        if (!subsectionMap.has(key)) {
          subsectionMap.set(key, {
            name: data['subSection'],
            mainSection: data['mainSection'],
            subSectionIndex: data['subSectionIndex'] || 0,
            count: 0,
            questionIds: []
          });
        }
        
        const info = subsectionMap.get(key)!;
        info.count++;
        info.questionIds.push(questionDoc.id);
      }
    });
    
    // Group by normalized name to find duplicates
    const normalizedGroups = new Map<string, SubsectionInfo[]>();
    
    subsectionMap.forEach((info) => {
      const normalizedName = info.name.toLowerCase().trim();
      const normalizedKey = `${info.mainSection}::${normalizedName}`;
      
      if (!normalizedGroups.has(normalizedKey)) {
        normalizedGroups.set(normalizedKey, []);
      }
      normalizedGroups.get(normalizedKey)!.push(info);
    });
    
    // Identify duplicates and capitalization issues
    const duplicateGroups: DuplicateGroup[] = [];
    const capitalizationIssues: CapitalizationIssue[] = [];
    
    normalizedGroups.forEach((group) => {
      if (group.length > 1) {
        const [mainSection] = group[0].mainSection.split('::');
        duplicateGroups.push({
          normalizedKey: `${mainSection}::${group[0].name.toLowerCase().trim()}`,
          mainSection,
          variations: group
        });
      }
      
      // Check capitalization
      group.forEach(info => {
        const properName = this.properCapitalize(info.name);
        if (properName !== info.name) {
          capitalizationIssues.push({
            current: info.name,
            suggested: properName,
            mainSection: info.mainSection,
            questionCount: info.count
          });
        }
      });
    });
    
    return {
      totalQuestions: snapshot.size,
      uniqueSubsections: subsectionMap.size,
      duplicateGroups,
      capitalizationIssues
    };
  }

  /**
   * Fix subsection duplicates and capitalization
   */
  async fixSubsections(dryRun: boolean = true): Promise<{ updated: number, message: string }> {
    const subsectionMap = new Map<string, SubsectionInfo>();
    const questionsRef = collection(this.firestore, 'questions');
    const snapshot = await getDocs(questionsRef);
    
    // Collect all subsections
    snapshot.forEach((questionDoc) => {
      const data = questionDoc.data();
      if (data['subSection']) {
        const key = `${data['mainSection']}::${data['subSection']}`;
        
        if (!subsectionMap.has(key)) {
          subsectionMap.set(key, {
            name: data['subSection'],
            mainSection: data['mainSection'],
            subSectionIndex: data['subSectionIndex'] || 0,
            count: 0,
            questionIds: []
          });
        }
        
        const info = subsectionMap.get(key)!;
        info.questionIds.push(questionDoc.id);
        info.count++;
      }
    });
    
    // Group by normalized name
    const normalizedGroups = new Map<string, SubsectionInfo[]>();
    
    subsectionMap.forEach((info) => {
      const normalizedKey = `${info.mainSection}::${info.name.toLowerCase().trim()}`;
      
      if (!normalizedGroups.has(normalizedKey)) {
        normalizedGroups.set(normalizedKey, []);
      }
      normalizedGroups.get(normalizedKey)!.push(info);
    });
    
    // Apply fixes
    let updateCount = 0;
    const batch = writeBatch(this.firestore);
    
    for (const [, group] of normalizedGroups) {
      // Determine the correct subsection name and index
      let correctName = '';
      let correctIndex = 0;
      
      if (group.length > 1) {
        // Prefer the one with proper capitalization
        const properName = this.properCapitalize(group[0].name);
        const bestMatch = group.find(info => info.name === properName) || group[0];
        correctName = properName;
        correctIndex = bestMatch.subSectionIndex;
      } else {
        correctName = this.properCapitalize(group[0].name);
        correctIndex = group[0].subSectionIndex;
      }
      
      // Update all questions in this group
      for (const info of group) {
        if (info.name !== correctName) {
          for (const questionId of info.questionIds) {
            if (!dryRun) {
              const questionRef = doc(this.firestore, 'questions', questionId);
              batch.update(questionRef, {
                subSection: correctName,
                subSectionIndex: correctIndex
              });
            }
            updateCount++;
            
            // Firestore has a limit of 500 operations per batch
            if (updateCount >= 400 && !dryRun) {
              await batch.commit();
              updateCount = 0;
            }
          }
        }
      }
    }
    
    // Commit any remaining updates
    if (updateCount > 0 && !dryRun) {
      await batch.commit();
    }
    
    const message = dryRun 
      ? `Dry run complete. Would update ${updateCount} questions.`
      : `Successfully updated ${updateCount} questions.`;
    
    return { updated: updateCount, message };
  }
}