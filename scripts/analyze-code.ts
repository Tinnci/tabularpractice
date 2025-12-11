
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

interface FileStats {
    path: string;
    lines: number;
    complexity: number;
    imports: string[];
}

interface AnalysisReport {
    files: FileStats[];
    totalFiles: number;
    totalLines: number;
    avgComplexity: number;
    potentialDuplicates: { file1: string, file2: string, similarity: number }[];
}

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat().filter(f => /\.(ts|tsx)$/.test(f));
}

// 简单的复杂度估算
function calculateComplexity(content: string): number {
    const matches = content.match(/(if|else|while|for|switch|case|catch|\? \S+ :)/g);
    return (matches ? matches.length : 0) + 1;
}

// 简单的 Jaccard 相似度 (基于 import 和 token)
function calculateSimilarity(content1: string, content2: string): number {
    const tokenize = (str: string) => new Set(str.split(/[\s,();.{}\[\]<>]+/).filter(s => s.length > 3));
    const set1 = tokenize(content1);
    const set2 = tokenize(content2);

    let intersection = 0;
    set1.forEach(token => {
        if (set2.has(token)) intersection++;
    });

    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

async function analyze() {
    console.log("🔍 Scanning codebase...");
    const files = await getFiles(SRC_DIR);
    const fileStats: FileStats[] = [];
    const contents: Record<string, string> = {};

    for (const file of files) {
        const content = await readFile(file, 'utf-8');
        contents[file] = content;

        const lines = content.split('\n').length;
        const complexity = calculateComplexity(content);
        // 提取 import
        const imports = (content.match(/import .* from ['"](.*)['"]/g) || [])
            .map(s => s.match(/from ['"](.*)['"]/)?.[1] || "");

        fileStats.push({
            path: file.replace(process.cwd(), ''),
            lines,
            complexity,
            imports
        });
    }

    // 查找相似文件 (简化版，O(n^2) 但文件数不多)
    const potentialDuplicates = [];
    console.log("👯 Checking for duplicates...");
    for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
            const f1 = files[i];
            const f2 = files[j];
            // 只比较同类文件
            if (extname(f1) !== extname(f2)) continue;

            const similarity = calculateSimilarity(contents[f1], contents[f2]);
            if (similarity > 0.7) { // 阈值
                potentialDuplicates.push({
                    file1: f1.replace(process.cwd(), ''),
                    file2: f2.replace(process.cwd(), ''),
                    similarity
                });
            }
        }
    }

    // 排序
    fileStats.sort((a, b) => b.complexity - a.complexity);

    // 输出报告
    console.log("\n📊 Code Analysis Report");
    console.log("=======================");

    console.log(`Total Files: ${fileStats.length}`);
    console.log(`Total Lines: ${fileStats.reduce((acc, curr) => acc + curr.lines, 0)}`);
    console.log(`Avg Complexity: ${(fileStats.reduce((acc, curr) => acc + curr.complexity, 0) / fileStats.length).toFixed(2)}`);

    console.log("\n🔝 Top 10 Most Complex Files:");
    fileStats.slice(0, 10).forEach(f => {
        console.log(`${f.complexity.toString().padEnd(5)} | ${f.lines.toString().padEnd(5)} lines | ${f.path}`);
    });

    console.log("\n👯 Potential High Duplication / Similarity (>70%):");
    if (potentialDuplicates.length === 0) {
        console.log("No obvious duplicates found.");
    } else {
        potentialDuplicates.sort((a, b) => b.similarity - a.similarity).forEach(d => {
            console.log(`${(d.similarity * 100).toFixed(1)}% | ${d.file1} <--> ${d.file2}`);
        });
    }
}

analyze().catch(console.error);
