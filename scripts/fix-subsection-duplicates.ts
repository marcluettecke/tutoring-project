import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { environment } from '../src/environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const db = getFirestore(app);

// Spanish words that should not be capitalized (articles, prepositions, conjunctions)
const lowercaseWords = new Set(['y', 'e', 'o', 'u', 'de', 'del', 'a', 'al', 'en', 'el', 'la', 'las', 'los', 'por', 'para', 'con', 'sin', 'sobre']);

interface SubsectionInfo {
  name: string;
  mainSection: string;
  subSectionIndex: number;
  questionIds: string[];
  count: number;
}

/**
 * Properly capitalizes a Spanish title
 * - First word is always capitalized
 * - Acronyms remain uppercase
 * - Articles, prepositions, and conjunctions are lowercase (unless first word)
 * - All other words are capitalized
 */
function properCapitalize(text: string): string {
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

async function analyzeAndFixSubsections() {
  console.log('Starting subsection analysis and fix...\n');
  
  // Step 1: Collect all subsections and their questions
  const subsectionMap = new Map<string, SubsectionInfo>();
  const questionsRef = collection(db, 'questions');
  const questionsSnapshot = await getDocs(questionsRef);
  
  console.log(`Total questions in database: ${questionsSnapshot.size}\n`);
  
  questionsSnapshot.forEach((questionDoc) => {
    const data = questionDoc.data();
    if (data.subSection) {
      const key = `${data.mainSection}::${data.subSection}`;
      
      if (!subsectionMap.has(key)) {
        subsectionMap.set(key, {
          name: data.subSection,
          mainSection: data.mainSection,
          subSectionIndex: data.subSectionIndex || 0,
          questionIds: [],
          count: 0
        });
      }
      
      const info = subsectionMap.get(key)!;
      info.questionIds.push(questionDoc.id);
      info.count++;
    }
  });
  
  // Step 2: Group subsections by normalized name to find duplicates
  const normalizedGroups = new Map<string, SubsectionInfo[]>();
  
  subsectionMap.forEach((info, key) => {
    const normalizedKey = `${info.mainSection}::${info.name.toLowerCase().trim()}`;
    
    if (!normalizedGroups.has(normalizedKey)) {
      normalizedGroups.set(normalizedKey, []);
    }
    normalizedGroups.get(normalizedKey)!.push(info);
  });
  
  // Step 3: Identify duplicates and subsections needing capitalization fixes
  const duplicates: string[] = [];
  const needsCapitalizationFix: string[] = [];
  
  normalizedGroups.forEach((group, normalizedKey) => {
    if (group.length > 1) {
      duplicates.push(normalizedKey);
      console.log(`\nDUPLICATE FOUND: ${normalizedKey}`);
      group.forEach(info => {
        console.log(`  - "${info.name}" (${info.count} questions, index: ${info.subSectionIndex})`);
      });
    }
    
    // Check if any need capitalization fix
    group.forEach(info => {
      const properName = properCapitalize(info.name);
      if (properName !== info.name) {
        needsCapitalizationFix.push(`${info.mainSection}::${info.name}`);
        console.log(`\nCAPITALIZATION FIX NEEDED:`);
        console.log(`  From: "${info.name}"`);
        console.log(`  To:   "${properName}"`);
        console.log(`  Questions: ${info.count}`);
      }
    });
  });
  
  console.log(`\n\nSUMMARY:`);
  console.log(`- Total unique subsections: ${subsectionMap.size}`);
  console.log(`- Duplicate groups found: ${duplicates.length}`);
  console.log(`- Subsections needing capitalization fix: ${needsCapitalizationFix.length}`);
  
  // Step 4: Ask for confirmation before proceeding
  console.log('\n\nThis script will:');
  console.log('1. Fix capitalization for all subsection names');
  console.log('2. Merge duplicate subsections (keeping the properly capitalized version)');
  console.log('3. Update all affected questions');
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 5: Apply fixes
  console.log('\nApplying fixes...\n');
  
  const batch = writeBatch(db);
  let updateCount = 0;
  
  // Process each normalized group
  for (const [normalizedKey, group] of normalizedGroups) {
    // Determine the correct subsection name and index
    let correctName = '';
    let correctIndex = 0;
    
    // If there are duplicates, choose the best one
    if (group.length > 1) {
      // Prefer the one with proper capitalization
      const properName = properCapitalize(group[0].name);
      const bestMatch = group.find(info => info.name === properName) || group[0];
      correctName = properName;
      correctIndex = bestMatch.subSectionIndex;
    } else {
      correctName = properCapitalize(group[0].name);
      correctIndex = group[0].subSectionIndex;
    }
    
    // Update all questions in this group
    for (const info of group) {
      if (info.name !== correctName) {
        console.log(`Updating ${info.count} questions from "${info.name}" to "${correctName}"`);
        
        for (const questionId of info.questionIds) {
          const questionRef = doc(db, 'questions', questionId);
          batch.update(questionRef, {
            subSection: correctName,
            subSectionIndex: correctIndex
          });
          updateCount++;
          
          // Firestore has a limit of 500 operations per batch
          if (updateCount >= 400) {
            await batch.commit();
            console.log(`Committed batch of ${updateCount} updates`);
            updateCount = 0;
          }
        }
      }
    }
  }
  
  // Commit any remaining updates
  if (updateCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${updateCount} updates`);
  }
  
  console.log('\n\nSubsection fix completed successfully!');
  
  // Step 6: Verify the fix
  console.log('\nVerifying fix...');
  const verifySnapshot = await getDocs(questionsRef);
  const verifyMap = new Map<string, number>();
  
  verifySnapshot.forEach((questionDoc) => {
    const data = questionDoc.data();
    if (data.subSection) {
      const key = `${data.mainSection}::${data.subSection}`;
      verifyMap.set(key, (verifyMap.get(key) || 0) + 1);
    }
  });
  
  console.log(`\nFinal subsection count: ${verifyMap.size}`);
  
  // Check for any remaining issues
  const remainingIssues: string[] = [];
  verifyMap.forEach((count, key) => {
    const [mainSection, subSection] = key.split('::');
    const properName = properCapitalize(subSection);
    if (properName !== subSection) {
      remainingIssues.push(key);
    }
  });
  
  if (remainingIssues.length > 0) {
    console.log('\nWARNING: Some subsections still have capitalization issues:');
    remainingIssues.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log('\nAll subsections now have proper capitalization!');
  }
}

// Run the script
analyzeAndFixSubsections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });