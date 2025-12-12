#!/usr/bin/env bun
/**
 * 自动修复迁移后的构建错误
 * 1. 添加缺失的 "use client" 指令
 * 2. 修复错误的导入路径
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// 需要添加 "use client" 的文件
const FILES_NEED_USE_CLIENT = [
    'src/components/business/Settings/AiImportModal.tsx',
    'src/components/business/Settings/AppearanceFilter.tsx',
    'src/components/business/Settings/DataManagement.tsx',
    'src/components/business/Settings/GithubConfig.tsx',
    'src/components/business/Settings/RepoSources.tsx',
    'src/components/business/Settings/SettingsModal.tsx',
];

// 路径修复规则：[文件路径, [旧导入, 新导入]]
const PATH_FIXES: Array<[string, Array<[string, string]>]> = [
    // QuestionModal/index.tsx
    ['src/components/business/QuestionModal/index.tsx', [
        ['from "../GitHubRepoSetupGuide"', 'from "../Settings"'],
        ['from "@/components/business/Core/Eureka"', 'from "@/components/business/Core"'],
    ]],

    // Settings/AiImportModal.tsx
    ['src/components/business/Settings/AiImportModal.tsx', [
        ['from "../ui/label"', 'from "@/components/ui/label"'],
    ]],

    // Sidebar/Sidebar.tsx
    ['src/components/business/Sidebar/Sidebar.tsx', [
        ['from "./ProgressOverview"', 'from "../Dashboard"'],
        ['from "./Sidebar/SidebarLeafNode"', 'from "./SidebarLeafNode"'],
        ['from "./Sidebar/useSidebarStats"', 'from "./useSidebarStats"'],
    ]],

    // Settings/SettingsModal.tsx - 移除多余的 Settings/ 前缀
    ['src/components/business/Settings/SettingsModal.tsx', [
        ['from "./Settings/DataManagement"', 'from "./DataManagement"'],
        ['from "./Settings/GithubConfig"', 'from "./GithubConfig"'],
        ['from "./Settings/RepoSources"', 'from "./RepoSources"'],
        ['from "./Settings/AppearanceFilter"', 'from "./AppearanceFilter"'],
        ['from "./Settings/AiSettings"', 'from "./AiSettings"'],
    ]],
];

async function addUseClient() {
    console.log('🔧 Adding "use client" directives...\n');

    for (const filePath of FILES_NEED_USE_CLIENT) {
        const fullPath = join(process.cwd(), filePath);
        let content = await readFile(fullPath, 'utf-8');

        // 检查是否已有 "use client"
        if (content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'")) {
            console.log(`   ⏭️  ${filePath} (already has "use client")`);
            continue;
        }

        // 在文件开头添加 "use client"
        content = '"use client";\n\n' + content;
        await writeFile(fullPath, content);
        console.log(`   ✅ ${filePath}`);
    }
}

async function fixImportPaths() {
    console.log('\n🔧 Fixing import paths...\n');

    for (const [filePath, fixes] of PATH_FIXES) {
        const fullPath = join(process.cwd(), filePath);
        let content = await readFile(fullPath, 'utf-8');
        let changed = false;

        for (const [oldImport, newImport] of fixes) {
            if (content.includes(oldImport)) {
                content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
                changed = true;
            }
        }

        if (changed) {
            await writeFile(fullPath, content);
            console.log(`   ✅ ${filePath} (${fixes.length} fixes)`);
        } else {
            console.log(`   ⏭️  ${filePath} (no changes needed)`);
        }
    }
}

async function createCoreBarrel() {
    console.log('\n🔧 Creating Core module barrel file...\n');

    const coreIndexPath = join(process.cwd(), 'src/components/business/Core/index.ts');
    const barrelContent = `export { AutoSyncManager } from './AutoSyncManager';
export * from './Eureka';
`;

    await writeFile(coreIndexPath, barrelContent);
    console.log('   ✅ Created src/components/business/Core/index.ts');
}

async function createEurekaBarrel() {
    console.log('\n🔧 Creating Eureka module barrel file...\n');

    const eurekaIndexPath = join(process.cwd(), 'src/components/business/Core/Eureka/index.ts');
    const barrelContent = `export { EurekaPanel } from './EurekaPanel';
`;

    await writeFile(eurekaIndexPath, barrelContent);
    console.log('   ✅ Created src/components/business/Core/Eureka/index.ts');
}

async function main() {
    console.log('🚀 Starting build error fixes...\n');

    await addUseClient();
    await fixImportPaths();
    await createCoreBarrel();
    await createEurekaBarrel();

    console.log('\n✨ All fixes applied! Try running "bun run build" again.\n');
}

main().catch(console.error);
