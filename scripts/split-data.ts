/**
 * Data Splitting Script
 * 
 * Splits raw questions.json into:
 * 1. Lightweight index.json (for initial app load)
 * 2. Individual paper detail files (lazy-loaded)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ========== Types ==========

interface Question {
    id: string;
    paperId: string;
    number: number;
    type: 'choice' | 'fill' | 'answer';
    tags?: string[];
    [key: string]: unknown; // Allow other properties
}

interface QuestionSummary {
    id: string;
    paperId: string;
    number: number;
    type: string;
    tags?: string[];
}

interface PaperDetail {
    paperId: string;
    year?: string | number;
    subjectKey?: string;
    questions: Record<string, Question>;
}

// ========== Paths ==========

const sourcePath = join(__dirname, '../raw-data/questions.json');
const publicDataDir = join(__dirname, '../public/data');
const papersDir = join(publicDataDir, 'papers');

// ========== Main Logic ==========

function ensureDirectories(): void {
    if (!existsSync(publicDataDir)) {
        mkdirSync(publicDataDir, { recursive: true });
    }
    if (!existsSync(papersDir)) {
        mkdirSync(papersDir, { recursive: true });
    }
}

function readSourceData(): Question[] {
    try {
        const content = readFileSync(sourcePath, 'utf8');
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
            throw new Error('Source data must be an array of questions');
        }

        return data;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.error(`❌ Source file not found: ${sourcePath}`);
            console.log('\n💡 This script expects raw-data/questions.json to exist.');
            console.log('   If you are using the tabularpractice-data repository,');
            console.log('   the data is already split. This script is optional.\n');
        } else {
            console.error(`❌ Error reading source file:`, error);
        }
        process.exit(1);
    }
}

function createIndexFile(questions: Question[]): void {
    const indexData: QuestionSummary[] = questions.map(q => ({
        id: q.id,
        paperId: q.paperId,
        number: q.number,
        type: q.type,
        tags: q.tags
    }));

    const indexPath = join(publicDataDir, 'index.json');
    writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`✓ Generated index.json with ${indexData.length} items`);
}

function createPaperFiles(questions: Question[]): void {
    const papers = new Map<string, PaperDetail>();

    // Group questions by paperId
    questions.forEach(q => {
        if (!papers.has(q.paperId)) {
            papers.set(q.paperId, {
                paperId: q.paperId,
                questions: {}
            });
        }
        const paper = papers.get(q.paperId)!;
        paper.questions[q.id] = q;
    });

    // Write individual paper files
    let fileCount = 0;
    papers.forEach(paper => {
        const paperDirPath = join(papersDir, paper.paperId);
        if (!existsSync(paperDirPath)) {
            mkdirSync(paperDirPath, { recursive: true });
        }

        const filePath = join(paperDirPath, 'index.json');
        writeFileSync(filePath, JSON.stringify(paper, null, 2), 'utf8');
        fileCount++;
    });

    console.log(`✓ Generated ${fileCount} paper detail files`);
}

// ========== Entry Point ==========

function main(): void {
    console.log('📦 Starting data split process...\n');

    ensureDirectories();
    const questions = readSourceData();
    createIndexFile(questions);
    createPaperFiles(questions);

    console.log('\n✨ Data split complete!');
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { main, readSourceData, createIndexFile, createPaperFiles };
