#!/usr/bin/env node

/**
 * Migration script for updating subsection names in Firebase
 * 
 * IMPORTANT: This script requires Firebase Admin SDK credentials
 * 
 * Usage:
 * 1. First, use the admin panel at /data-migration to export backups
 * 2. Place your service account key in ./service-account-key.json
 * 3. Run: node scripts/migrate-subsection.js --dry-run
 * 4. Review the output
 * 5. Run: node scripts/migrate-subsection.js --execute
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const OLD_SUBSECTION = 'Igualdad, Violencia de Género y Dependencia'; // Note: Capital G
const NEW_SUBSECTION = 'Leyes de Derechos Sociales';
const MAIN_SECTION = 'administrativo';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldExecute = args.includes('--execute');

if (!isDryRun && !shouldExecute) {
  console.error('Please specify either --dry-run or --execute');
  process.exit(1);
}

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    const serviceAccount = require('../service-account-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return admin.firestore();
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:');
    console.error('Make sure service-account-key.json exists in the project root');
    console.error(error.message);
    process.exit(1);
  }
}

async function migrateSubsection() {
  const db = initializeFirebase();
  
  console.log('Starting subsection migration...');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`From: "${OLD_SUBSECTION}"`);
  console.log(`To: "${NEW_SUBSECTION}"`);
  console.log(`Main Section: ${MAIN_SECTION}`);
  console.log('---');

  try {
    // Query affected questions
    const snapshot = await db.collection('questions')
      .where('mainSection', '==', MAIN_SECTION)
      .where('subSection', '==', OLD_SUBSECTION)
      .get();

    console.log(`Found ${snapshot.size} questions to migrate`);

    if (snapshot.size === 0) {
      console.log('No questions found with the old subsection name. Migration not needed.');
      return;
    }

    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `backup-${timestamp}.json`);
    const backup = [];

    snapshot.forEach(doc => {
      backup.push({
        id: doc.id,
        data: doc.data()
      });
    });

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup saved to: ${backupFile}`);

    if (isDryRun) {
      console.log('\nDRY RUN - No changes will be made');
      console.log('\nQuestions that would be updated:');
      
      backup.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   Question: ${item.data.questionText ? item.data.questionText.substring(0, 80) + '...' : 'No question text'}`);
      });
      
      console.log('\nTo execute the migration, run with --execute flag');
      return;
    }

    // Execute migration
    console.log('\nExecuting migration...');
    
    let successCount = 0;
    let errorCount = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      try {
        batch.update(doc.ref, {
          subSection: NEW_SUBSECTION
        });
        
        batchCount++;
        
        // Firestore batch limit is 500
        if (batchCount === 500) {
          await batch.commit();
          successCount += batchCount;
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } catch (error) {
        console.error(`Error updating document ${doc.id}:`, error.message);
        errorCount++;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      successCount += batchCount;
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully updated: ${successCount} questions`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Backup file: ${backupFile}`);

    // Verify migration
    console.log('\nVerifying migration...');
    const verifySnapshot = await db.collection('questions')
      .where('mainSection', '==', MAIN_SECTION)
      .where('subSection', '==', OLD_SUBSECTION)
      .get();

    console.log(`Questions still with old subsection: ${verifySnapshot.size}`);
    
    if (verifySnapshot.size === 0) {
      console.log('✓ Migration verified successfully!');
    } else {
      console.log('⚠️  Some questions may not have been migrated. Please check the logs.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateSubsection()
  .then(() => {
    console.log('\nMigration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });