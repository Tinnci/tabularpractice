#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import { existsSync } from 'fs';

/**
 * 迁移配置映射
 * Component Name -> New Category Directory
 */
const COMPONENT_MAPPINGS: Record<string, string> = {
    // Dashboard Module
    'ActivityHeatmap': 'Dashboard',
    'DashboardOnboarding': 'Dashboard',
    'ProgressOverview': 'Dashboard',

    // Mistakes Module
    'MistakeReviewCard': 'Mistakes',

    // Knowledge Module
    'KnowledgeGraph': 'Knowledge', // Directory
    'KnowledgePlanet': 'Knowledge', // Directory

    // Shared Module
    'QuestionCard': 'Shared',
    'QuestionTimer': 'Shared',
    'ExamWall': 'Shared',
    'VerticalExamWall': 'Shared',
    'GlobalSearch': 'Shared',
    'ShortcutsHelpModal': 'Shared',

    // Settings Module
    'SettingsModal': 'Settings',
    'GitHubRepoSetupGuide': 'Settings',
    'AiImportModal': 'Settings',
    'SyncConflictModal': 'Settings',
    'GithubConfig': 'Settings',
    'AiSettings': 'Settings',
    'AppearanceFilter': 'Settings',
    'DataManagement': 'Settings',
    'RepoSources': 'Settings',

    // Core Module
    'AutoSyncManager': 'Core',
    'Eureka': 'Core', // Directory

    // Sidebar Module
    'Sidebar': 'Sidebar', // File moved to be inside Sidebar folder
    'SidebarLeafNode': 'Sidebar'
};

const SRC_DIR = join(process.cwd(), 'src');
const COMPONENTS_BUSINESS_DIR = join(SRC_DIR, 'components/business');

// Categories to process for index.ts generation
const CATEGORIES = [
    'Dashboard',
    'Mistakes',
    'Knowledge',
    'Shared',
    'Settings',
    'Core',
    'Sidebar',
    'Practice',
    'QuestionModal',
    'Questions'
];

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

/**
 * 1. 自动生成目录的 Barrel Files (index.ts)
 */
async function generateBarrelFiles() {
    console.log('📦 Generating barrel files (index.ts)...');

    for (const category of CATEGORIES) {
        const dirPath = join(COMPONENTS_BUSINESS_DIR, category);
        if (!existsSync(dirPath)) continue;

        const files = await readdir(dirPath, { withFileTypes: true });
        const exports: string[] = [];

        for (const file of files) {
            // 跳过 index.ts 和 测试文件
            if (file.name === 'index.ts' || file.name.includes('.test.') || file.name.includes('.spec.')) continue;

            const ext = extname(file.name);
            const nameWithoutExt = file.name.replace(ext, '');

            if (file.isDirectory()) {
                // 如果是子目录，且子目录有 index.ts，则导出该子目录
                if (existsSync(join(dirPath, file.name, 'index.ts'))) {
                    exports.push(`export * from './${file.name}';`);
                }
            } else if (['.tsx', '.ts'].includes(ext)) {
                // 检查文件内容，确定是 named export 还是 default export
                const content = await readFile(join(dirPath, file.name), 'utf-8');

                // 简单的正则检查导出类型
                const hasNamedExport = /export\s+(const|function|class|interface)\s+/.test(content);
                const hasDefaultExport = /export\s+default\s+/.test(content);

                if (hasNamedExport) {
                    exports.push(`export * from './${nameWithoutExt}';`);
                }
                if (hasDefaultExport) {
                    // 如果有 default export，通常我们也希望作为 named export 重新导出，或者 default as X
                    // 这里为了简单，如果该文件也是组件名，我们尝试 export { default as Component } 
                    // 但更安全的做法是 export *，并在文件中使用 named export (项目规范似乎是 named export 优先)

                    // 特殊处理：如果是 Sidebar.tsx 在 Sidebar 目录下
                    if (nameWithoutExt === category) {
                        exports.push(`export { default as ${nameWithoutExt} } from './${nameWithoutExt}';`);
                    }
                }
            }
        }

        if (exports.length > 0) {
            const indexPath = join(dirPath, 'index.ts');
            // 如果文件存在，我们先读取看看是否需要更新（虽然这里直接覆盖比较快）
            // 我们只添加我们确定的，对于手动修改过的可能需要保留？
            // 策略：覆盖。因为我们刚刚重构完。

            // 去重
            const uniqueExports = Array.from(new Set(exports)).sort();
            await writeFile(indexPath, uniqueExports.join('\n') + '\n');
            console.log(`   ✅ Generated ${category}/index.ts`);
        }
    }
}

/**
 * 2. 批量更新引用路径
 */
async function updateImports() {
    console.log('\n🔄 Updating imports in src/...');
    const allFiles = await getFiles(SRC_DIR);
    const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    let totalUpdates = 0;

    for (const file of tsFiles) {
        let content = await readFile(file, 'utf-8');
        const originalContent = content;

        // 策略：查找 @/components/business/OldName 或 ../components/business/OldName
        // 替换为 @/components/business/NewCategory/OldName 或 @/components/business/NewCategory (如果 barrel 支持)

        // 我们主要针对从 @/components/business/ 导入的情况
        // Regex 匹配： import ... from ["']@/components/business/([^/"']+)["']

        content = content.replace(/from\s+['"]@\/components\/business\/([^/'";]+)(?:\/([^/'";]+))?['"]/g, (match, componentName, subPath) => {
            // componentName 可能是 "ActivityHeatmap" 或者 "Sidebar" (old file) 或者 "KnowledgeGraph" (old dir)

            // 1. 如果完全匹配映射表
            if (COMPONENT_MAPPINGS[componentName]) {
                const newCategory = COMPONENT_MAPPINGS[componentName];

                // 特殊情况：如果原来是指向一个子文件，如 sidebar/SidebarLeafNode
                if (subPath) {
                    // 暂时保持完整路径，指向新结构
                    // e.g. @/components/business/Sidebar/SidebarLeafNode -> @/components/business/Sidebar/SidebarLeafNode
                    // 看起来路径没变？
                    // 如果 Sidebar 以前是文件夹，现在还是文件夹，那路径没变。
                    // 如果 componentName 是 ActivityHeatmap，现在在 Dashboard 下
                    // 原引用可能是 @/components/business/ActivityHeatmap
                    return `from "@/components/business/${newCategory}/${componentName}"`; // 安全起见直到具体文件，或者使用 barrel: `from "@/components/business/${newCategory}"`
                }

                // 推荐：使用 Barrel 引用
                // 将 @/components/business/ActivityHeatmap -> @/components/business/Dashboard
                // 将 @/components/business/Sidebar -> @/components/business/Sidebar
                return `from "@/components/business/${newCategory}"`;
            }

            return match;
        });

        if (content !== originalContent) {
            await writeFile(file, content);
            console.log(`   ✏️ Updated ${relative(process.cwd(), file)}`);
            totalUpdates++;
        }
    }

    console.log(`\n✨ Migration complete! Updated ${totalUpdates} files.`);
}

async function main() {
    await generateBarrelFiles();
    await updateImports();
}

main().catch(console.error);
