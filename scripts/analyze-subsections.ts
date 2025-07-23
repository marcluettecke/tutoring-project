import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { environment } from '../src/environments/environment';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const db = getFirestore(app);

interface SubsectionInfo {
  name: string;
  mainSection: string;
  subSectionIndex: number;
  count: number;
  sampleQuestionIds: string[];
}

async function analyzeSubsections() {
  console.log('Analyzing subsections in database...\n');
  
  const subsectionMap = new Map<string, SubsectionInfo>();
  const questionsRef = collection(db, 'questions');
  const questionsSnapshot = await getDocs(questionsRef);
  
  console.log(`Total questions in database: ${questionsSnapshot.size}\n`);
  
  // Collect all subsections
  questionsSnapshot.forEach((questionDoc) => {
    const data = questionDoc.data();
    if (data.subSection) {
      const key = `${data.mainSection}::${data.subSection}`;
      
      if (!subsectionMap.has(key)) {
        subsectionMap.set(key, {
          name: data.subSection,
          mainSection: data.mainSection,
          subSectionIndex: data.subSectionIndex || 0,
          count: 0,
          sampleQuestionIds: []
        });
      }
      
      const info = subsectionMap.get(key)!;
      info.count++;
      if (info.sampleQuestionIds.length < 3) {
        info.sampleQuestionIds.push(questionDoc.id);
      }
    }
  });
  
  // Group by normalized name to find potential duplicates
  const normalizedGroups = new Map<string, SubsectionInfo[]>();
  
  subsectionMap.forEach((info) => {
    // Normalize: lowercase and trim
    const normalizedName = info.name.toLowerCase().trim();
    const normalizedKey = `${info.mainSection}::${normalizedName}`;
    
    if (!normalizedGroups.has(normalizedKey)) {
      normalizedGroups.set(normalizedKey, []);
    }
    normalizedGroups.get(normalizedKey)!.push(info);
  });
  
  // Report duplicates
  console.log('=== POTENTIAL DUPLICATES (different capitalization/spacing) ===\n');
  let duplicateCount = 0;
  
  normalizedGroups.forEach((group, normalizedKey) => {
    if (group.length > 1) {
      duplicateCount++;
      const [mainSection, normalizedName] = normalizedKey.split('::');
      console.log(`Duplicate group ${duplicateCount}: ${mainSection} > "${normalizedName}"`);
      
      group.forEach(info => {
        console.log(`  - "${info.name}"`);
        console.log(`    Questions: ${info.count}, Index: ${info.subSectionIndex}`);
        console.log(`    Sample IDs: ${info.sampleQuestionIds.join(', ')}`);
      });
      console.log('');
    }
  });
  
  if (duplicateCount === 0) {
    console.log('No duplicates found based on normalized names.\n');
  }
  
  // Report all subsections by main section
  console.log('\n=== ALL SUBSECTIONS BY MAIN SECTION ===\n');
  
  const mainSections = ['administrativo', 'medio ambiente', 'costas', 'aguas'];
  
  mainSections.forEach(mainSection => {
    console.log(`\n${mainSection.toUpperCase()}:`);
    
    const sectionSubsections = Array.from(subsectionMap.values())
      .filter(info => info.mainSection === mainSection)
      .sort((a, b) => a.subSectionIndex - b.subSectionIndex);
    
    sectionSubsections.forEach(info => {
      console.log(`  ${info.subSectionIndex}. "${info.name}" (${info.count} questions)`);
    });
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total unique subsections: ${subsectionMap.size}`);
  console.log(`Potential duplicate groups: ${duplicateCount}`);
}

// Run the analysis
analyzeSubsections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });