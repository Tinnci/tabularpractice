import { readdir, readFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import * as ts from 'typescript';

const SRC_DIR = join(process.cwd(), 'src');
const COMPLEXITY_THRESHOLD = 50;
const LINES_THRESHOLD = 300;
const FUNCTION_LINES_THRESHOLD = 50;

interface FileStats {
    path: string;
    lines: number;
    linesOfCode: number; // 不含空行和注释
    complexity: number;
    functions: FunctionStats[];
    imports: string[];
    exports: string[];
    issues: CodeIssue[];
}

interface FunctionStats {
    name: string;
    lines: number;
    complexity: number;
    parameters: number;
    startLine: number;
}

interface CodeIssue {
    type: 'complexity' | 'size' | 'duplication' | 'long-function' | 'many-params' | 'deep-nesting';
    severity: 'high' | 'medium' | 'low';
    message: string;
    location?: string;
}

interface AnalysisReport {
    files: FileStats[];
    totalFiles: number;
    totalLines: number;
    totalLinesOfCode: number;
    avgComplexity: number;
    issues: CodeIssue[];
    hotspots: FileStats[];
}

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat().filter(f => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules'));
}

// 使用 TypeScript AST 计算圈复杂度
function calculateCyclomaticComplexity(sourceFile: ts.SourceFile): number {
    let complexity = 1; // 基础复杂度

    function visit(node: ts.Node) {
        // 分支语句增加复杂度
        switch (node.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.CatchClause:
            case ts.SyntaxKind.ConditionalExpression:
                complexity++;
                break;
            // 逻辑运算符
            case ts.SyntaxKind.AmpersandAmpersandToken:
            case ts.SyntaxKind.BarBarToken:
            case ts.SyntaxKind.QuestionQuestionToken:
                complexity++;
                break;
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return complexity;
}

// 分析函数
function analyzeFunctions(sourceFile: ts.SourceFile, content: string): FunctionStats[] {
    const functions: FunctionStats[] = [];

    function visit(node: ts.Node) {
        if (
            ts.isFunctionDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isArrowFunction(node) ||
            ts.isFunctionExpression(node)
        ) {
            const name = getFunctionName(node);
            const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
            const lines = endLine - startLine;

            // 计算函数内部复杂度
            let funcComplexity = 1;
            function countComplexity(n: ts.Node) {
                switch (n.kind) {
                    case ts.SyntaxKind.IfStatement:
                    case ts.SyntaxKind.WhileStatement:
                    case ts.SyntaxKind.ForStatement:
                    case ts.SyntaxKind.ConditionalExpression:
                        funcComplexity++;
                        break;
                }
                ts.forEachChild(n, countComplexity);
            }
            countComplexity(node);

            const parameters = getParameterCount(node);

            functions.push({
                name,
                lines,
                complexity: funcComplexity,
                parameters,
                startLine
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return functions;
}

function getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) && node.name) {
        return node.name.text;
    }
    if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        return node.name.text;
    }
    if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        return node.parent.name.text;
    }
    return '<anonymous>';
}

function getParameterCount(node: ts.Node): number {
    if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
    ) {
        return node.parameters.length;
    }
    return 0;
}

// 统计实际代码行数（去除空行和注释）
function countLinesOfCode(content: string): number {
    const lines = content.split('\n');
    let linesOfCode = 0;
    let inBlockComment = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // 检查块注释
        if (trimmed.startsWith('/*')) inBlockComment = true;
        if (inBlockComment) {
            if (trimmed.endsWith('*/')) inBlockComment = false;
            continue;
        }

        // 跳过空行和单行注释
        if (trimmed === '' || trimmed.startsWith('//')) continue;

        linesOfCode++;
    }

    return linesOfCode;
}

// 提取导入和导出
function extractImportsExports(sourceFile: ts.SourceFile): { imports: string[], exports: string[] } {
    const imports: string[] = [];
    const exports: string[] = [];

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            imports.push(node.moduleSpecifier.text);
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            exports.push(node.moduleSpecifier.text);
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return { imports, exports };
}

// 检测代码问题
function detectIssues(stats: FileStats): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // 1. 文件复杂度过高
    if (stats.complexity > COMPLEXITY_THRESHOLD) {
        issues.push({
            type: 'complexity',
            severity: stats.complexity > 80 ? 'high' : 'medium',
            message: `File complexity (${stats.complexity}) exceeds threshold (${COMPLEXITY_THRESHOLD})`,
            location: stats.path
        });
    }

    // 2. 文件行数过多
    if (stats.lines > LINES_THRESHOLD) {
        issues.push({
            type: 'size',
            severity: stats.lines > 500 ? 'high' : 'medium',
            message: `File has ${stats.lines} lines (threshold: ${LINES_THRESHOLD})`,
            location: stats.path
        });
    }

    // 3. 函数过长
    stats.functions.forEach(func => {
        if (func.lines > FUNCTION_LINES_THRESHOLD) {
            issues.push({
                type: 'long-function',
                severity: func.lines > 100 ? 'high' : 'medium',
                message: `Function '${func.name}' has ${func.lines} lines (threshold: ${FUNCTION_LINES_THRESHOLD})`,
                location: `${stats.path}:${func.startLine}`
            });
        }

        // 4. 参数过多
        if (func.parameters > 5) {
            issues.push({
                type: 'many-params',
                severity: func.parameters > 7 ? 'high' : 'medium',
                message: `Function '${func.name}' has ${func.parameters} parameters (recommended: ≤5)`,
                location: `${stats.path}:${func.startLine}`
            });
        }

        // 5. 函数复杂度过高
        if (func.complexity > 10) {
            issues.push({
                type: 'complexity',
                severity: func.complexity > 15 ? 'high' : 'medium',
                message: `Function '${func.name}' has complexity ${func.complexity} (recommended: ≤10)`,
                location: `${stats.path}:${func.startLine}`
            });
        }
    });

    return issues;
}

async function analyzeFile(filePath: string): Promise<FileStats> {
    const content = await readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

    const lines = content.split('\n').length;
    const linesOfCode = countLinesOfCode(content);
    const complexity = calculateCyclomaticComplexity(sourceFile);
    const functions = analyzeFunctions(sourceFile, content);
    const { imports, exports } = extractImportsExports(sourceFile);

    const stats: FileStats = {
        path: relative(process.cwd(), filePath),
        lines,
        linesOfCode,
        complexity,
        functions,
        imports,
        exports,
        issues: []
    };

    stats.issues = detectIssues(stats);

    return stats;
}

async function analyze() {
    console.log("🔍 Scanning codebase with TypeScript AST...");
    const files = await getFiles(SRC_DIR);
    const fileStats: FileStats[] = [];

    let processedFiles = 0;
    for (const file of files) {
        try {
            const stats = await analyzeFile(file);
            fileStats.push(stats);
            processedFiles++;
            if (processedFiles % 20 === 0) {
                process.stdout.write(`\r   Processed ${processedFiles}/${files.length} files...`);
            }
        } catch (error) {
            console.error(`\nError analyzing ${file}:`, error);
        }
    }
    console.log(`\r✓  Processed ${processedFiles}/${files.length} files`);

    // 排序
    fileStats.sort((a, b) => b.complexity - a.complexity);

    const totalLines = fileStats.reduce((acc, curr) => acc + curr.lines, 0);
    const totalLinesOfCode = fileStats.reduce((acc, curr) => acc + curr.linesOfCode, 0);
    const avgComplexity = fileStats.reduce((acc, curr) => acc + curr.complexity, 0) / fileStats.length;

    // 收集所有问题
    const allIssues = fileStats.flatMap(f => f.issues);
    const highSeverityIssues = allIssues.filter(i => i.severity === 'high');

    // 识别热点（最需要重构的文件）
    const hotspots = fileStats
        .filter(f => f.complexity > COMPLEXITY_THRESHOLD || f.lines > LINES_THRESHOLD)
        .slice(0, 5);

    // 输出报告
    console.log("\n📊 Enhanced Code Analysis Report");
    console.log("================================");

    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Files: ${fileStats.length}`);
    console.log(`   Total Lines: ${totalLines.toLocaleString()}`);
    console.log(`   Lines of Code: ${totalLinesOfCode.toLocaleString()} (${((totalLinesOfCode / totalLines) * 100).toFixed(1)}%)`);
    console.log(`   Avg Complexity: ${avgComplexity.toFixed(2)}`);
    console.log(`   Total Issues: ${allIssues.length} (${highSeverityIssues.length} high severity)`);

    console.log("\n🔥 Top 10 Most Complex Files:");
    fileStats.slice(0, 10).forEach((f, idx) => {
        const indicator = f.complexity > 80 ? '🔴' : f.complexity > 50 ? '🟡' : '🟢';
        console.log(`${(idx + 1).toString().padStart(2)}. ${indicator} ${f.complexity.toString().padStart(3)} | ${f.lines.toString().padStart(4)} lines | ${f.linesOfCode.toString().padStart(4)} LOC | ${f.path}`);
    });

    console.log("\n📏 Top 10 Largest Files:");
    const bySize = [...fileStats].sort((a, b) => b.lines - a.lines);
    bySize.slice(0, 10).forEach((f, idx) => {
        const indicator = f.lines > 500 ? '🔴' : f.lines > 300 ? '🟡' : '🟢';
        console.log(`${(idx + 1).toString().padStart(2)}. ${indicator} ${f.lines.toString().padStart(4)} lines | ${f.linesOfCode.toString().padStart(4)} LOC | ${f.path}`);
    });

    console.log("\n🔧 Top 10 Longest Functions:");
    const allFunctions = fileStats.flatMap(f =>
        f.functions.map(func => ({ ...func, file: f.path }))
    ).sort((a, b) => b.lines - a.lines);

    allFunctions.slice(0, 10).forEach((f, idx) => {
        const indicator = f.lines > 100 ? '🔴' : f.lines > 50 ? '🟡' : '🟢';
        console.log(`${(idx + 1).toString().padStart(2)}. ${indicator} ${f.lines.toString().padStart(3)} lines | complexity ${f.complexity.toString().padStart(2)} | ${f.name} @ ${f.file}:${f.startLine}`);
    });

    if (highSeverityIssues.length > 0) {
        console.log("\n⚠️  High Severity Issues:");
        const grouped = highSeverityIssues.reduce((acc, issue) => {
            if (!acc[issue.type]) acc[issue.type] = [];
            acc[issue.type].push(issue);
            return acc;
        }, {} as Record<string, CodeIssue[]>);

        Object.entries(grouped).forEach(([type, issues]) => {
            console.log(`   ${type}: ${issues.length} issue(s)`);
            issues.slice(0, 5).forEach(issue => {
                console.log(`      • ${issue.message}`);
            });
            if (issues.length > 5) {
                console.log(`      ... and ${issues.length - 5} more`);
            }
        });
    }

    if (hotspots.length > 0) {
        console.log("\n🎯 Refactoring Hotspots (files needing attention):");
        hotspots.forEach((f, idx) => {
            console.log(`${(idx + 1).toString().padStart(2)}. ${f.path}`);
            console.log(`    Complexity: ${f.complexity}, Lines: ${f.lines}, Issues: ${f.issues.length}`);
        });
    }

    console.log("\n💡 Recommendations:");
    if (avgComplexity > 20) {
        console.log("   • Consider breaking down complex files into smaller modules");
    }
    if (highSeverityIssues.length > 10) {
        console.log("   • Focus on resolving high-severity issues first");
    }
    if (hotspots.length > 0) {
        console.log("   • Prioritize refactoring the identified hotspots");
    }

    const codeToCommentRatio = ((totalLinesOfCode / totalLines) * 100).toFixed(1);
    if (parseFloat(codeToCommentRatio) > 85) {
        console.log("   • Consider adding more documentation and comments");
    }

    console.log("\n✨ Analysis complete!");
}

analyze().catch(console.error);
