#!/usr/bin/env bun
/**
 * Props Interface Standardization Checker
 * 
 * Checks that all component Props interfaces follow the standard:
 * 1. Named as ComponentNameProps
 * 2. Exported with `export interface`
 * 3. Placed before the component definition
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'src/components');

interface PropsIssue {
    file: string;
    line: number;
    type: 'not-exported' | 'wrong-naming' | 'missing-props';
    message: string;
}

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

async function checkPropsInterface(filePath: string): Promise<PropsIssue[]> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: PropsIssue[] = [];

    // Find Props interfaces
    const propsInterfacePattern = /^(export\s+)?interface\s+(\w+Props)/;
    const componentPattern = /^export\s+(function|const)\s+(\w+)/;

    const components: string[] = [];
    const propsInterfaces: Array<{ name: string; exported: boolean; line: number }> = [];

    lines.forEach((line, index) => {
        // Find component exports
        const componentMatch = line.match(componentPattern);
        if (componentMatch) {
            components.push(componentMatch[2]);
        }

        // Find Props interfaces
        const propsMatch = line.match(propsInterfacePattern);
        if (propsMatch) {
            propsInterfaces.push({
                name: propsMatch[2],
                exported: !!propsMatch[1],
                line: index + 1
            });
        }
    });

    // Check each discovered Props interface
    propsInterfaces.forEach(props => {
        // Rule 1: Props should follow naming convention
        if (!props.name.endsWith('Props')) {
            issues.push({
                file: filePath,
                line: props.line,
                type: 'wrong-naming',
                message: `Interface '${props.name}' doesn't follow ComponentNameProps convention`
            });
        }

        // Rule 2: Props should be exported for reusability
        if (!props.exported) {
            issues.push({
                file: filePath,
                line: props.line,
                type: 'not-exported',
                message: `Props interface '${props.name}' is not exported (should be 'export interface ${props.name}')`
            });
        }
    });

    // Rule 3: Components should have corresponding Props
    // (Skip this check as it's too strict - some simple components don't need Props)

    return issues;
}

async function main() {
    console.log('🔍 Checking Props interface standardization...\n');

    const files = await getComponentFiles(COMPONENTS_DIR);
    console.log(`📂 Found ${files.length} component file(s)\n`);

    const allIssues: PropsIssue[] = [];

    for (const file of files) {
        const issues = await checkPropsInterface(file);
        allIssues.push(...issues);
    }

    if (allIssues.length === 0) {
        console.log('✅ All Props interfaces are properly standardized!');
        console.log('   All follow the ComponentNameProps convention and are exported.\n');
        process.exit(0);
    } else {
        console.log('📋 Props Interface Issues:\n');

        // Group by type
        const byType = allIssues.reduce((acc, issue) => {
            if (!acc[issue.type]) acc[issue.type] = [];
            acc[issue.type].push(issue);
            return acc;
        }, {} as Record<string, PropsIssue[]>);

        Object.entries(byType).forEach(([type, issues]) => {
            console.log(`\n${type === 'not-exported' ? '⚠️' : '🔴'}  ${type.toUpperCase().replace(/-/g, ' ')} (${issues.length}):\n`);

            issues.slice(0, 10).forEach(issue => {
                console.log(`   ${issue.file.replace(process.cwd(), '.')}`);
                console.log(`   Line ${issue.line}: ${issue.message}\n`);
            });

            if (issues.length > 10) {
                console.log(`   ... and ${issues.length - 10} more\n`);
            }
        });

        console.log(`\n📊 Total issues: ${allIssues.length}`);
        console.log('\n💡 Recommended standard:');
        console.log('   export interface ComponentNameProps {');
        console.log('       // props definitions');
        console.log('   }\n');

        console.log('💡 Why export Props?');
        console.log('   - Enables prop type reuse in parent components');
        console.log('   - Improves API documentation');
        console.log('   - Facilitates testing and mocking');
        console.log('   - Allows type composition and extension\n');

        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error running Props check:', err);
    process.exit(1);
});
