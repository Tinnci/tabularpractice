import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import * as ts from 'typescript';

const SRC_DIR = join(process.cwd(), 'src');
const COMPLEXITY_THRESHOLD = 50;
const LINES_THRESHOLD = 300;
const FUNCTION_LINES_THRESHOLD = 50;
const MAX_NESTING_DEPTH = 4;
const PARALLEL_BATCH_SIZE = 10; // 并行处理批次大小

interface FileStats {
    path: string;
    lines: number;
    linesOfCode: number; // 不含空行和注释
    complexity: number;
    functions: FunctionStats[];
    imports: string[];
    exports: string[];
    issues: CodeIssue[];
    maxNestingDepth: number;
}

interface FunctionStats {
    name: string;
    lines: number;
    complexity: number;
    parameters: number;
    startLine: number;
    maxNestingDepth: number;
}

interface CodeIssue {
    type: 'complexity' | 'size' | 'duplication' | 'long-function' | 'many-params' | 'deep-nesting';
    severity: 'high' | 'medium' | 'low';
    message: string;
    location?: string;
}



// 定义可增加复杂度的节点类型
const COMPLEXITY_NODE_KINDS = new Set([
    ts.SyntaxKind.IfStatement,
    ts.SyntaxKind.WhileStatement,
    ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.ForStatement,
    ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement,
    ts.SyntaxKind.CaseClause,
    ts.SyntaxKind.CatchClause,
    ts.SyntaxKind.ConditionalExpression,
]);

const LOGICAL_OPERATOR_KINDS = new Set([
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.QuestionQuestionToken,
]);

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat().filter(f => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules'));
}

// 通用的复杂度和嵌套深度计算
interface ComplexityMetrics {
    complexity: number;
    maxNestingDepth: number;
}

function calculateComplexityMetrics(node: ts.Node, includeLogicalOps = false): ComplexityMetrics {
    let complexity = 1; // 基础复杂度
    let maxNestingDepth = 0;
    let currentDepth = 0;

    function visit(n: ts.Node) {
        // 计算复杂度
        if (COMPLEXITY_NODE_KINDS.has(n.kind)) {
            complexity++;
            currentDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentDepth);
        }

        // 逻辑运算符（可选）
        if (includeLogicalOps && LOGICAL_OPERATOR_KINDS.has(n.kind)) {
            complexity++;
        }

        ts.forEachChild(n, visit);

        // 离开块作用域时减少深度
        if (COMPLEXITY_NODE_KINDS.has(n.kind)) {
            currentDepth--;
        }
    }

    visit(node);
    return { complexity, maxNestingDepth };
}

// 使用 TypeScript AST 计算圈复杂度
function calculateCyclomaticComplexity(sourceFile: ts.SourceFile): number {
    return calculateComplexityMetrics(sourceFile, true).complexity;
}

// 计算最大嵌套深度
function calculateMaxNestingDepth(sourceFile: ts.SourceFile): number {
    return calculateComplexityMetrics(sourceFile, false).maxNestingDepth;
}

// 分析函数
function analyzeFunctions(sourceFile: ts.SourceFile): FunctionStats[] {
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

            // 使用统一的复杂度计算
            const metrics = calculateComplexityMetrics(node, false);

            const parameters = getParameterCount(node);

            functions.push({
                name,
                lines,
                complexity: metrics.complexity,
                parameters,
                startLine,
                maxNestingDepth: metrics.maxNestingDepth
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
        // 新增：检测导出的变量/函数/类
        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        if (modifiers?.some((m: ts.Modifier) => m.kind === ts.SyntaxKind.ExportKeyword)) {
            if (ts.isFunctionDeclaration(node) && node.name) {
                exports.push(node.name.text);
            } else if (ts.isClassDeclaration(node) && node.name) {
                exports.push(node.name.text);
            } else if (ts.isVariableStatement(node)) {
                node.declarationList.declarations.forEach(decl => {
                    if (ts.isIdentifier(decl.name)) {
                        exports.push(decl.name.text);
                    }
                });
            }
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

    // 3. 文件嵌套深度过深
    if (stats.maxNestingDepth > MAX_NESTING_DEPTH) {
        issues.push({
            type: 'deep-nesting',
            severity: stats.maxNestingDepth > 6 ? 'high' : 'medium',
            message: `File has nesting depth of ${stats.maxNestingDepth} (recommended: ≤${MAX_NESTING_DEPTH})`,
            location: stats.path
        });
    }

    // 4. 函数过长
    stats.functions.forEach(func => {
        if (func.lines > FUNCTION_LINES_THRESHOLD) {
            issues.push({
                type: 'long-function',
                severity: func.lines > 100 ? 'high' : 'medium',
                message: `Function '${func.name}' has ${func.lines} lines (threshold: ${FUNCTION_LINES_THRESHOLD})`,
                location: `${stats.path}:${func.startLine}`
            });
        }

        // 5. 参数过多
        if (func.parameters > 5) {
            issues.push({
                type: 'many-params',
                severity: func.parameters > 7 ? 'high' : 'medium',
                message: `Function '${func.name}' has ${func.parameters} parameters (recommended: ≤5)`,
                location: `${stats.path}:${func.startLine}`
            });
        }

        // 6. 函数复杂度过高
        if (func.complexity > 10) {
            issues.push({
                type: 'complexity',
                severity: func.complexity > 15 ? 'high' : 'medium',
                message: `Function '${func.name}' has complexity ${func.complexity} (recommended: ≤10)`,
                location: `${stats.path}:${func.startLine}`
            });
        }

        // 7. 函数嵌套深度过深
        if (func.maxNestingDepth > MAX_NESTING_DEPTH) {
            issues.push({
                type: 'deep-nesting',
                severity: func.maxNestingDepth > 6 ? 'high' : 'medium',
                message: `Function '${func.name}' has nesting depth of ${func.maxNestingDepth} (recommended: ≤${MAX_NESTING_DEPTH})`,
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
    const maxNestingDepth = calculateMaxNestingDepth(sourceFile);
    const functions = analyzeFunctions(sourceFile);
    const { imports, exports } = extractImportsExports(sourceFile);

    const stats: FileStats = {
        path: relative(process.cwd(), filePath),
        lines,
        linesOfCode,
        complexity,
        functions,
        imports,
        exports,
        issues: [],
        maxNestingDepth
    };

    stats.issues = detectIssues(stats);

    return stats;
}

async function analyze() {
    console.log("🔍 Scanning codebase with TypeScript AST...");
    const files = await getFiles(SRC_DIR);
    const fileStats: FileStats[] = [];
    const errors: Array<{ file: string; error: unknown }> = [];

    let processedFiles = 0;

    // 并行批处理文件分析
    for (let i = 0; i < files.length; i += PARALLEL_BATCH_SIZE) {
        const batch = files.slice(i, i + PARALLEL_BATCH_SIZE);

        const batchResults = await Promise.allSettled(
            batch.map(file => analyzeFile(file))
        );

        batchResults.forEach((result, idx) => {
            const file = batch[idx];
            processedFiles++;

            if (result.status === 'fulfilled') {
                fileStats.push(result.value);
            } else {
                errors.push({ file, error: result.reason });
            }

            if (processedFiles % 20 === 0) {
                process.stdout.write(`\r   Processed ${processedFiles}/${files.length} files...`);
            }
        });
    }

    console.log(`\r✓  Processed ${processedFiles}/${files.length} files`);

    if (errors.length > 0) {
        console.log(`\n⚠️  Failed to analyze ${errors.length} file(s):`);
        errors.slice(0, 5).forEach(({ file, error }) => {
            console.error(`   • ${file}: ${error instanceof Error ? error.message : String(error)}`);
        });
        if (errors.length > 5) {
            console.log(`   ... and ${errors.length - 5} more errors`);
        }
    }

    // 排序
    fileStats.sort((a, b) => b.complexity - a.complexity);

    const totalLines = fileStats.reduce((acc, curr) => acc + curr.lines, 0);
    const totalLinesOfCode = fileStats.reduce((acc, curr) => acc + curr.linesOfCode, 0);
    const avgComplexity = fileStats.length > 0
        ? fileStats.reduce((acc, curr) => acc + curr.complexity, 0) / fileStats.length
        : 0;

    // 收集所有问题
    const allIssues = fileStats.flatMap(f => f.issues);
    const highSeverityIssues = allIssues.filter(i => i.severity === 'high');
    const issuesByType = allIssues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

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

    // 按类型统计问题
    if (Object.keys(issuesByType).length > 0) {
        console.log(`\n📋 Issues by Type:`);
        Object.entries(issuesByType)
            .sort(([, a], [, b]) => b - a)
            .forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
    }

    console.log("\n🔥 Top 10 Most Complex Files:");
    fileStats.slice(0, 10).forEach((f, idx) => {
        const indicator = f.complexity > 80 ? '🔴' : f.complexity > 50 ? '🟡' : '🟢';
        const nestingInfo = f.maxNestingDepth > MAX_NESTING_DEPTH ? ` (depth: ${f.maxNestingDepth})` : '';
        console.log(`${(idx + 1).toString().padStart(2)}. ${indicator} ${f.complexity.toString().padStart(3)} | ${f.lines.toString().padStart(4)} lines | ${f.linesOfCode.toString().padStart(4)} LOC${nestingInfo} | ${f.path}`);
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
        const nestingInfo = f.maxNestingDepth > MAX_NESTING_DEPTH ? ` depth:${f.maxNestingDepth}` : '';
        console.log(`${(idx + 1).toString().padStart(2)}. ${indicator} ${f.lines.toString().padStart(3)} lines | complexity ${f.complexity.toString().padStart(2)}${nestingInfo} | ${f.name} @ ${f.file}:${f.startLine}`);
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
            console.log(`    Complexity: ${f.complexity}, Lines: ${f.lines}, Nesting: ${f.maxNestingDepth}, Issues: ${f.issues.length}`);
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

    const deepNestingIssues = allIssues.filter(i => i.type === 'deep-nesting');
    if (deepNestingIssues.length > 0) {
        console.log(`   • ${deepNestingIssues.length} file(s)/function(s) have deep nesting - consider extracting helper functions`);
    }

    const longFunctionIssues = allIssues.filter(i => i.type === 'long-function');
    if (longFunctionIssues.length > 5) {
        console.log(`   • ${longFunctionIssues.length} long function(s) detected - consider splitting into smaller, focused functions`);
    }

    console.log("\n✨ Analysis complete!");
}

analyze().catch(console.error);
