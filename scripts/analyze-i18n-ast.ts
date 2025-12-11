
import { readdir, readFile } from 'fs/promises';
import { join, extname, relative, resolve } from 'path';
import * as ts from 'typescript';

// Configuration
const CONFIG = {
    srcDir: 'src',
    // Files to ignore
    ignore: [
        'node_modules',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/i18n.ts',
        '**/legacy-tags.ts',
        '**/subject-tags.ts',
        '**/utils.ts', // Utils often have internal strings
    ],
    // UI Attributes to check specifically
    uiAttributes: new Set([
        'title',
        'placeholder',
        'label',
        'aria-label',
        'alt',
        'description',
        'tooltip'
    ]),
    // Function calls that usually contain UI text
    uiFunctions: new Set([
        'toast',
        'alert',
        'confirm',
        't', // i18n function itself, we might want to check if it's NOT used, but here we are looking for raw strings
        'showToast'
    ]),
    // Strings to always ignore (safe patterns)
    safeStrings: new Set([
        'px', 'rem', 'em', '%', 'vh', 'vw', // CSS units
        'auto', 'hidden', 'visible', // CSS values
        'button', 'submit', 'reset', // HTML types
        'GET', 'POST', 'PUT', 'DELETE', // HTTP methods
    ])
};

interface I18nIssue {
    file: string;
    line: number;
    column: number;
    type: 'chinese' | 'english-ui';
    context: 'jsx-text' | 'jsx-attr' | 'string-literal' | 'template';
    content: string;
    snippet: string;
}

// Regex for Chinese characters
const CHINESE_REGEX = /[\u4e00-\u9fa5]+/;

/**
 * Check if a string contains Chinese
 */
function hasChinese(text: string): boolean {
    return CHINESE_REGEX.test(text);
}

/**
 * Heuristic to check if a string looks like English UI text
 */
function isPotentialEnglishUI(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    if (trimmed.length < 2) return false;

    // Ignore common technical strings
    if (CONFIG.safeStrings.has(trimmed)) return false;

    // Ignore technical formats
    if (trimmed.includes('/') || trimmed.includes('\\')) return false; // Paths
    if (trimmed.startsWith('http')) return false; // URLs
    if (/^[\d\s.,%()]+$/.test(trimmed)) return false; // Numbers/symbols only
    if (/^[a-z]+[A-Z]/.test(trimmed) && !trimmed.includes(' ')) return false; // camelCase variable names
    if (/^[A-Z0-9_]+$/.test(trimmed)) return false; // CONSTANTS
    if (trimmed.includes('_') && !trimmed.includes(' ')) return false; // snake_case
    if (trimmed.startsWith('rgba(') || trimmed.startsWith('#')) return false; // Colors

    // UI text usually has spaces or starts with Capital letter
    const hasSpace = trimmed.includes(' ');
    const isCapitalized = /^[A-Z]/.test(trimmed);

    // If it's a single word, it must be capitalized and not a technical keyword
    if (!hasSpace) {
        return isCapitalized && /^[a-zA-Z]+$/.test(trimmed);
    }

    // If it has spaces, it's likely a sentence or phrase
    // But filter out code-like strings "prop1 prop2"
    if (trimmed.split(' ').every(w => /^[a-z0-9]+=[^ ]+/.test(w))) return false;

    return true;
}

/**
 * Recursively get all .ts/.tsx files
 */
async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat().filter(f =>
        /\.(ts|tsx)$/.test(f) &&
        !f.includes('node_modules') &&
        !CONFIG.ignore.some(pattern => {
            // Simple glob-like matching (very basic)
            if (pattern.startsWith('**/')) return f.includes(pattern.slice(3));
            return f.includes(pattern);
        })
    );
}

/**
 * Analyze a single file for i18n issues using AST
 */
function analyzeFile(filePath: string, sourceFile: ts.SourceFile): I18nIssue[] {
    const issues: I18nIssue[] = [];
    const relativePath = relative(process.cwd(), filePath);

    function visit(node: ts.Node) {
        // 1. JSX Text Content: <div>你好</div>
        if (ts.isJsxText(node)) {
            const text = node.text.trim();
            if (text) {
                if (hasChinese(text)) {
                    addIssue(node, 'chinese', 'jsx-text', text);
                } else if (isPotentialEnglishUI(text)) {
                    // For English, we are strictly checking JSX Text, which is almost always UI
                    addIssue(node, 'english-ui', 'jsx-text', text);
                }
            }
        }

        // 2. JSX Attributes: <Input placeholder="请输入" />
        else if (ts.isJsxAttribute(node)) {
            if (node.initializer && ts.isStringLiteral(node.initializer)) {
                const attrName = node.name.getText();
                const text = node.initializer.text;

                // Strict check for attributes: only check known UI attributes
                if (CONFIG.uiAttributes.has(attrName)) {
                    if (hasChinese(text)) {
                        addIssue(node.initializer, 'chinese', 'jsx-attr', text);
                    } else if (isPotentialEnglishUI(text)) {
                        addIssue(node.initializer, 'english-ui', 'jsx-attr', text);
                    }
                }
                // If it's chinese, even in non-standard attributes, it's suspicious, BUT
                // some libraries use custom props. Let's be aggressive on Chinese but lenient on English.
                else if (hasChinese(text)) {
                    // Exclude common safe attributes that might take strings but aren't visible
                    if (!['key', 'id', 'ref', 'className', 'type', 'name', 'value', 'testId'].includes(attrName)) {
                        addIssue(node.initializer, 'chinese', 'jsx-attr', text);
                    }
                }
            }
        }

        // 3. String Literals (The hardest part)
        else if (ts.isStringLiteral(node)) {
            // Only verify strings that contain Chinese for now to reduce false positives for English
            // We skip English detection in random string literals because code is full of English strings
            const text = node.text;

            if (hasChinese(text)) {
                // Check context to avoid false positives
                if (shouldCheckStringLiteral(node)) {
                    addIssue(node, 'chinese', 'string-literal', text);
                }
            }
        }

        // 4. Template Expressions: `你好 ${name}`
        else if (ts.isTemplateExpression(node)) {
            if (node.head.text && hasChinese(node.head.text)) {
                addIssue(node, 'chinese', 'template', node.head.text + '...');
            }
            for (const span of node.templateSpans) {
                if (span.literal.text && hasChinese(span.literal.text)) {
                    addIssue(node, 'chinese', 'template', '...' + span.literal.text);
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    function shouldCheckStringLiteral(node: ts.Node): boolean {
        const parent = node.parent;

        // Ignore imports
        if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isModuleDeclaration(parent)) return false;
        if (ts.isExternalModuleReference(parent)) return false;

        // Ignore property keys: { "中文key": value } - usually data, not UI
        if (ts.isPropertyAssignment(parent) && parent.name === node) return false;

        // Ignore console.log, console.error, etc.
        if (ts.isCallExpression(parent)) {
            const expression = parent.expression;
            if (ts.isPropertyAccessExpression(expression)) {
                if (expression.expression.getText() === 'console') return false;
            }
            // Ignore specific technical functions if needed
            if (ts.isIdentifier(expression)) {
                if (expression.text === 'require') return false;
            }
        }

        // Ignore thrown errors: throw new Error("中文") - debatable, but usually dev-facing
        if (ts.isNewExpression(parent)) {
            if (ts.isIdentifier(parent.expression) && parent.expression.text === 'Error') return false;
        }

        // Allow if it's inside a function call that is a known UI function
        if (ts.isCallExpression(parent)) {
            // simple check: functionName("string")
            if (ts.isIdentifier(parent.expression) && CONFIG.uiFunctions.has(parent.expression.text)) {
                return true;
            }
        }

        // If it's a return value of a component or hook, it might be UI, but hard to trace.
        // Default: If it has Chinese, we flag it unless we are sure it's safe.
        // The previous ignore rules cover most non-UI cases.

        return true;
    }

    function addIssue(node: ts.Node, type: 'chinese' | 'english-ui', context: any, content: string) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
            file: relativePath,
            line: line + 1,
            column: character + 1,
            type,
            context,
            content,
            snippet: node.getText().slice(0, 50)
        });
    }

    visit(sourceFile);
    return issues;
}

async function main() {
    console.log('🔍 Starting AST-based i18n analysis...');
    const start = performance.now();

    const srcDir = resolve(process.cwd(), CONFIG.srcDir);
    const files = await getFiles(srcDir);

    console.log(`📂 Scanning ${files.length} files...`);

    let chineseCount = 0;
    let englishCount = 0;
    const issuesMap: Record<string, I18nIssue[]> = {};

    for (const file of files) {
        const content = await readFile(file, 'utf-8');
        const sourceFile = ts.createSourceFile(
            file,
            content,
            ts.ScriptTarget.Latest,
            true
        );

        const issues = analyzeFile(file, sourceFile);
        if (issues.length > 0) {
            issuesMap[relative(process.cwd(), file)] = issues;
            issues.forEach(i => {
                if (i.type === 'chinese') chineseCount++;
                else englishCount++;
            });
        }
    }

    const end = performance.now();

    // -- Report Generation --
    console.log('\n' + '='.repeat(60));
    console.log('📊 i18n AST Inspection Report');
    console.log('='.repeat(60));

    if (chineseCount === 0 && englishCount === 0) {
        console.log('✅ No i18n issues found!');
        return;
    }

    Object.entries(issuesMap).forEach(([file, issues]) => {
        const chineseIssues = issues.filter(i => i.type === 'chinese');
        const englishIssues = issues.filter(i => i.type === 'english-ui');

        if (chineseIssues.length > 0) {
            console.log(`\n📄 ${file}`);
            chineseIssues.forEach(i => {
                console.log(`   🔴 [Line ${i.line}] "${i.content}" (Chinese in ${i.context})`);
            });
        }

        // Group English issues to avoid spam if there are many
        if (englishIssues.length > 0) {
            if (chineseIssues.length === 0) console.log(`\n📄 ${file}`);
            englishIssues.forEach(i => {
                console.log(`   🟡 [Line ${i.line}] "${i.content}" (Possible English UI in ${i.context})`);
            });
        }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`Summary:`);
    console.log(`🔴 Chinese Hardcoded: ${chineseCount}`);
    console.log(`🟡 English Potential: ${englishCount}`);
    console.log(`⏱️  Time: ${(end - start).toFixed(2)}ms`);
}

main().catch(console.error);
