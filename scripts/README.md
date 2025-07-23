# Database Maintenance Scripts

These scripts help maintain the Firestore database, particularly for managing subsection names and preventing data loss.

## Available Scripts

### 1. Backup Questions
**ALWAYS RUN THIS FIRST BEFORE ANY DATABASE MODIFICATIONS!**

```bash
npm run backup:questions
```

This creates a timestamped backup of all questions in the `backups/` directory.

### 2. Analyze Subsections
View current subsection names and identify potential duplicates:

```bash
npm run analyze:subsections
```

This script:
- Shows all subsections grouped by main section
- Identifies potential duplicates (different capitalization)
- Does NOT modify any data

### 3. Fix Subsection Duplicates
**⚠️ DANGEROUS: Only run after backing up!**

```bash
npm run fix:subsections
```

This script:
- Fixes capitalization of subsection names (Spanish rules)
- Merges duplicate subsections
- Updates all affected questions
- Has a 5-second delay before making changes

### 4. Restore Questions
Emergency restore from backup:

```bash
npm run restore:questions backups/questions-backup-TIMESTAMP.json
```

**⚠️ WARNING: This OVERWRITES all existing questions!**

## Spanish Capitalization Rules

The fix script applies these rules:
- First word is always capitalized
- Acronyms remain uppercase (LCSP, EBEP, TRLA, etc.)
- These words stay lowercase: y, e, o, u, de, del, a, al, en, el, la, las, los, por, para, con, sin, sobre
- All other words are capitalized

Examples:
- "ley de costas" → "Ley de Costas"  
- "residuos y economía circular" → "Residuos y Economía Circular"
- "TRLA título III" → "TRLA Título III"

## Safety Guidelines

1. **ALWAYS backup first**: `npm run backup:questions`
2. **Analyze before fixing**: `npm run analyze:subsections`
3. **Keep backup files safe**: Store in multiple locations
4. **Test in development first**: If possible
5. **Have restore plan ready**: Know how to restore from backup

## Backup File Location

Backups are saved to: `tutoring-project/backups/questions-backup-TIMESTAMP.json`