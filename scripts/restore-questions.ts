import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { environment } from '../src/environments/environment';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const db = getFirestore(app);

async function restoreQuestions(backupFile: string) {
  console.log(`Starting restore from backup file: ${backupFile}\n`);
  
  // Check if backup file exists
  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }
  
  // Read backup file
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`Found ${backupData.length} questions in backup`);
  
  // Confirm before proceeding
  console.log('\n⚠️  WARNING: This will OVERWRITE all existing questions in the database!');
  console.log('Press Ctrl+C within 10 seconds to cancel...');
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\nProceeding with restore...\n');
  
  // Restore in batches
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalRestored = 0;
  
  for (const questionData of backupData) {
    const { id, ...data } = questionData;
    const questionRef = doc(db, 'questions', id);
    
    batch.set(questionRef, data);
    batchCount++;
    
    // Firestore limit is 500 operations per batch
    if (batchCount >= 400) {
      await batch.commit();
      totalRestored += batchCount;
      console.log(`Restored ${totalRestored} questions...`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  // Commit remaining batch
  if (batchCount > 0) {
    await batch.commit();
    totalRestored += batchCount;
  }
  
  console.log(`\nRestore completed! Total questions restored: ${totalRestored}`);
}

// Get backup file from command line argument
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run restore:questions <backup-file-path>');
  console.error('Example: npm run restore:questions backups/questions-backup-2025-07-23T10-30-00-000Z.json');
  process.exit(1);
}

const backupFile = args[0];

// Run the restore
restoreQuestions(backupFile)
  .then(() => {
    console.log('\nRestore completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during restore:', error);
    process.exit(1);
  });