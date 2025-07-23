import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { environment } from '../src/environments/environment';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const db = getFirestore(app);

async function backupQuestions() {
  console.log('Starting backup of all questions from Firestore...\n');
  
  const questionsRef = collection(db, 'questions');
  const questionsSnapshot = await getDocs(questionsRef);
  
  const questions: any[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  questionsSnapshot.forEach((doc) => {
    questions.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  console.log(`Found ${questions.length} questions to backup`);
  
  // Create backups directory if it doesn't exist
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  // Save to JSON file
  const backupPath = path.join(backupsDir, `questions-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(questions, null, 2));
  
  console.log(`\nBackup saved to: ${backupPath}`);
  console.log(`Total questions backed up: ${questions.length}`);
  
  // Also create a summary of subsections
  const subsectionSummary = new Map<string, number>();
  questions.forEach(q => {
    if (q.subSection) {
      const key = `${q.mainSection}::${q.subSection}`;
      subsectionSummary.set(key, (subsectionSummary.get(key) || 0) + 1);
    }
  });
  
  console.log('\n=== SUBSECTION SUMMARY ===');
  const sortedSummary = Array.from(subsectionSummary.entries()).sort();
  sortedSummary.forEach(([key, count]) => {
    console.log(`${key}: ${count} questions`);
  });
  
  return backupPath;
}

// Run the backup
backupQuestions()
  .then((backupPath) => {
    console.log('\nBackup completed successfully!');
    console.log(`\nIMPORTANT: Keep this backup file safe!`);
    console.log(`Backup location: ${backupPath}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during backup:', error);
    process.exit(1);
  });