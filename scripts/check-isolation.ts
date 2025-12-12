#!/usr/bin/env bun
/**
 * Script Isolation Checker
 * 
 * Verifies that scripts/ directory doesn't depend on browser-specific code from src/
 * This can be run manually or integrated into CI/CD
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const SCRIPTS_DIR = join(process.cwd(), 'scripts');
const ALLOWED_SRC_IMPORTS: RegExp[] = [
    // Add patterns here if you create a shared/ directory
    // Example: /^@\/shared\//
];

const FORBIDDEN_PATTERNS = [
    /from ['"]@\/components\//,
    /from ['"]@\/hooks\//,
    /from ['"]@\/app\//,
    /from ['"]@\/services\//,
    /from ['"]\.\.\/src\/components\//,
    /from ['"]\.\.\/src\/hooks\//,
    /from ['"]\.\.\/src\/app\//,
    /from ['"]\.\.\/src\/services\//,
    /require\(['"]@\/components\//,
    /require\(['"]@\/hooks\//,
    /require\(['"]\.\.\/src\/components\//,
    /require\(['"]\.\.\/src\/hooks\//,
];

interface Violation {
    file: string;
    line: number;
    pattern: string;
    content: string;
}

async function getScriptFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                return getScriptFiles(path);
            }
            return /\.(ts|js|mjs|cjs)$/.test(entry.name) ? [path] : [];
        })
    );
    return files.flat();
}

async function checkFile(filePath: string): Promise<Violation[]> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: Violation[] = [];

    lines.forEach((line, index) => {
        FORBIDDEN_PATTERNS.forEach(pattern => {
            if (pattern.test(line)) {
                // Check if it's allowed
                const isAllowed = ALLOWED_SRC_IMPORTS.some(allowed => allowed.test(line));
                if (!isAllowed) {
                    violations.push({
                        file: filePath,
                        line: index + 1,
                        pattern: pattern.source,
                        content: line.trim()
                    });
                }
            }
        });
    });

    return violations;
}

async function main() {
    console.log('🔍 Checking script isolation...\n');

    const files = await getScriptFiles(SCRIPTS_DIR);
    console.log(`📂 Found ${files.length} script file(s)\n`);

    const allViolations: Violation[] = [];

    for (const file of files) {
        const violations = await checkFile(file);
        allViolations.push(...violations);
    }

    if (allViolations.length === 0) {
        console.log('✅ All scripts are properly isolated!');
        console.log('   No forbidden imports from src/ detected.\n');
        process.exit(0);
    } else {
        console.log('❌ Script isolation violations detected:\n');

        allViolations.forEach(v => {
            console.log(`   File: ${v.file}`);
            console.log(`   Line: ${v.line}`);
            console.log(`   Code: ${v.content}`);
            console.log(`   Rule: ${v.pattern}\n`);
        });

        console.log(`\n❌ Total violations: ${allViolations.length}`);
        console.log('\n💡 Scripts should only import from:');
        console.log('   - Node.js built-in modules (fs, path, etc.)');
        console.log('   - Platform-agnostic npm packages (typescript, etc.)');
        console.log('   - src/shared/ if it exists (platform-agnostic code only)');
        console.log('   - src/lib/domain/ (pure functions only)\n');

        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error running isolation check:', err);
    process.exit(1);
});
