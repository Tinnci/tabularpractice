#!/usr/bin/env bun
/**
 * Props Interface Auto-Fixer
 * 
 * Automatically adds 'export' keyword to all ComponentNameProps interfaces
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'src/components');
let fixedCount = 0;

async function getComponentFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                return getComponentFiles(path);
            }
            return /\.(tsx|ts)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
        })
    );
    return files.flat();
}

async function fixPropsExport(filePath: string): Promise<boolean> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Pattern matches non-exported Props interfaces
    const propsPattern = /^interface\s+(\w+Props)\s*{/;

    const newLines = lines.map(line => {
        const match = line.match(propsPattern);
        if (match) {
            // Add export keyword
            fixedCount++;
            modified = true;
            return line.replace(/^interface\s+/, 'export interface ');
        }
        return line;
    });

    if (modified) {
        await writeFile(filePath, newLines.join('\n'), 'utf-8');
        return true;
    }

    return false;
}

async function main() {
    console.log('🔧 Auto-fixing Props interface exports...\n');

    const files = await getComponentFiles(COMPONENTS_DIR);
    console.log(`📂 Scanning ${files.length} files...\n`);

    const fixedFiles: string[] = [];

    for (const file of files) {
        const fixed = await fixPropsExport(file);
        if (fixed) {
            fixedFiles.push(file);
        }
    }

    if (fixedFiles.length === 0) {
        console.log('✅ No files needed fixing!');
    } else {
        console.log(`✅ Fixed ${fixedCount} Props interfaces in ${fixedFiles.length} files:\n`);
        fixedFiles.forEach(file => {
            console.log(`   ✓ ${file.replace(process.cwd() + '\\\\', '')}`);
        });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files scanned: ${files.length}`);
    console.log(`   Files modified: ${fixedFiles.length}`);
    console.log(`   Props interfaces exported: ${fixedCount}\n`);
}

main().catch(err => {
    console.error('Error running auto-fix:', err);
    process.exit(1);
});
