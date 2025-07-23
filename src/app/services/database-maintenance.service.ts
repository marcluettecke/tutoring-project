import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, doc, writeBatch, query, where, deleteDoc, setDoc } from '@angular/fire/firestore';

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

export interface BackupQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  mainSection: string;
  subSection?: string;
  subSectionIndex?: number;
  [key: string]: unknown;
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
    
    // Roman numerals pattern
    const romanNumeralPattern = /^[IVX]+$/i;
    
    // Split by spaces
    const words = text.split(' ');
    
    return words.map((word, index) => {
      // Handle special cases that should be preserved exactly
      // Check for PNyB specifically (with or without punctuation)
      if (word.toLowerCase() === 'pnyb' || word.toLowerCase().startsWith('pnyb,')) {
        const punct = word.match(/[,;:.!?]$/)?.[0] || '';
        return 'PNyB' + punct;
      }
      
      // Check for acronyms that should stay uppercase
      const upperAcronyms = ['LCSP', 'EBEP', 'LC', 'TRLA', 'RPH', 'IPH', 'PHN', 'DMA', 'RD', 'MA'];
      const wordUpper = word.toUpperCase();
      if (upperAcronyms.includes(wordUpper)) {
        return wordUpper;
      }
      
      // Check for Roman numerals
      if (romanNumeralPattern.test(word)) {
        return word.toUpperCase();
      }
      
      // Handle "Título" specially to preserve accent
      if (word.toLowerCase() === 'título') {
        return 'Título';
      }
      
      // Handle words with special punctuation (like commas)
      const punctuation = word.match(/[,;:.!?]$/);
      const cleanWord = punctuation ? word.slice(0, -1) : word;
      const punct = punctuation ? punctuation[0] : '';
      
      // First word is always capitalized
      if (index === 0) {
        // Special handling for words with accents
        if (cleanWord.toLowerCase() === 'título') return 'Título' + punct;
        return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase() + punct;
      }
      
      // Check if it's a lowercase word
      if (lowercaseWords.has(cleanWord.toLowerCase())) {
        return cleanWord.toLowerCase() + punct;
      }
      
      // Special words that should maintain their accents
      const accentWords: { [key: string]: string } = {
        'título': 'Título',
        'técnicas': 'Técnicas',
        'técnico': 'Técnico',
        'climático': 'Climático',
        'sequías': 'Sequías',
        'reutilización': 'Reutilización',
        'depuración': 'Depuración',
        'hidrología': 'Hidrología',
        'marino': 'Marino'
      };
      
      const lowerClean = cleanWord.toLowerCase();
      if (accentWords[lowerClean]) {
        return accentWords[lowerClean] + punct;
      }
      
      // Capitalize first letter, rest lowercase
      return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase() + punct;
    }).join(' ');
  }

  /**
   * Get total question count from Firestore
   */
  async getTotalQuestionCount(): Promise<number> {
    const questionsRef = collection(this.firestore, 'questions');
    const snapshot = await getDocs(questionsRef);
    return snapshot.size;
  }

  /**
   * Backup all questions to JSON
   */
  async backupQuestions(): Promise<{ data: Record<string, unknown>[], timestamp: string, totalCount: number }> {
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
    const totalCount = snapshot.size;
    
    console.log(`Backup created with ${totalCount} questions`);
    
    return { data: questions, timestamp, totalCount };
  }

  /**
   * Backup questions by main section
   */
  async backupQuestionsBySection(mainSection: string): Promise<{ data: Record<string, unknown>[], timestamp: string, section: string }> {
    const questionsRef = collection(this.firestore, 'questions');
    const q = query(questionsRef, where('mainSection', '==', mainSection));
    const snapshot = await getDocs(q);
    
    const questions: Record<string, unknown>[] = [];
    snapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const timestamp = new Date().toISOString();
    
    return { data: questions, timestamp, section: mainSection };
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
  async fixSubsections(dryRun: boolean = true): Promise<{ updated: number, message: string, details?: Array<{from: string, to: string, count: number}> }> {
    try {
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
    let totalUpdateCount = 0;
    let batchUpdateCount = 0;
    const batch = writeBatch(this.firestore);
    const updates: Array<{from: string, to: string, count: number}> = [];
    
    console.log(`Processing ${normalizedGroups.size} groups...`);
    
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
          console.log(`Would update "${info.name}" to "${correctName}" (${info.questionIds.length} questions)`);
          updates.push({from: info.name, to: correctName, count: info.questionIds.length});
          
          for (const questionId of info.questionIds) {
            if (!dryRun) {
              const questionRef = doc(this.firestore, 'questions', questionId);
              batch.update(questionRef, {
                subSection: correctName,
                subSectionIndex: correctIndex
              });
            }
            totalUpdateCount++;
            batchUpdateCount++;
            
            // Firestore has a limit of 500 operations per batch
            if (batchUpdateCount >= 400 && !dryRun) {
              await batch.commit();
              console.log(`Committed batch of ${batchUpdateCount} updates`);
              batchUpdateCount = 0;
            }
          }
        }
      }
    }
    
    // Commit any remaining updates
    if (batchUpdateCount > 0 && !dryRun) {
      await batch.commit();
      console.log(`Committed final batch of ${batchUpdateCount} updates`);
    }
    
    console.log(`Total updates: ${totalUpdateCount}`);
    console.log('Update summary:', updates);
    
    const message = dryRun 
      ? `Simulación completa. Se actualizarían ${totalUpdateCount} preguntas.`
      : `Se actualizaron correctamente ${totalUpdateCount} preguntas.`;
    
    return { updated: totalUpdateCount, message, details: updates };
    } catch (error) {
      console.error('Error in fixSubsections:', error);
      throw new Error('Error al procesar las subsecciones: ' + (error as Error).message);
    }
  }

  /**
   * Restore questions from a backup file
   * WARNING: This will DELETE all existing questions and replace them with the backup
   */
  async restoreFromBackup(backupData: BackupQuestion[]): Promise<{ restored: number, message: string }> {
    try {
      console.log(`Starting restore of ${backupData.length} questions...`);
      
      // First, delete all existing questions
      console.log('Deleting existing questions...');
      const questionsRef = collection(this.firestore, 'questions');
      const snapshot = await getDocs(questionsRef);
      
      let deleteCount = 0;
      const deleteBatch = writeBatch(this.firestore);
      
      snapshot.forEach((docSnapshot) => {
        deleteBatch.delete(docSnapshot.ref);
        deleteCount++;
        
        // Firestore batch limit
        if (deleteCount % 400 === 0) {
          console.log(`Deleting batch of ${deleteCount} questions...`);
        }
      });
      
      if (deleteCount > 0) {
        await deleteBatch.commit();
        console.log(`Deleted ${deleteCount} existing questions`);
      }
      
      // Now restore from backup
      console.log('Restoring questions from backup...');
      let restoreCount = 0;
      let batchCount = 0;
      const restoreBatch = writeBatch(this.firestore);
      
      for (const question of backupData) {
        const { id, ...questionData } = question;
        const questionRef = doc(this.firestore, 'questions', id);
        
        // Ensure required fields are present
        const dataToStore = {
          question: questionData.question || '',
          options: questionData.options || [],
          correctAnswer: questionData.correctAnswer ?? 0,
          mainSection: questionData.mainSection || '',
          ...(questionData.subSection && { subSection: questionData.subSection }),
          ...(questionData.subSectionIndex !== undefined && { subSectionIndex: questionData.subSectionIndex })
        };
        
        restoreBatch.set(questionRef, dataToStore);
        restoreCount++;
        batchCount++;
        
        // Commit batch if limit reached
        if (batchCount >= 400) {
          await restoreBatch.commit();
          console.log(`Restored batch of ${batchCount} questions (${restoreCount} total)...`);
          batchCount = 0;
        }
      }
      
      // Commit remaining questions
      if (batchCount > 0) {
        await restoreBatch.commit();
        console.log(`Restored final batch of ${batchCount} questions`);
      }
      
      const message = `Restauración completa. Se restauraron ${restoreCount} preguntas desde la copia de seguridad.`;
      console.log(message);
      
      return { restored: restoreCount, message };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw new Error('Error al restaurar desde la copia de seguridad: ' + (error as Error).message);
    }
  }
}