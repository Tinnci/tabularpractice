/**
 * i18n 硬编码检测脚本 (Bun 优化版)
 * 使用 Bun 原生 API 进行高性能文件扫描
 */

// 配置
const CONFIG = {
  srcDir: 'src',
  extensions: ['tsx', 'ts'],
  // 忽略的文件/目录
  ignore: [
    'node_modules',
    '.d.ts',
    'i18n.ts',           // i18n 字典本身
    'legacy-tags.ts',    // 遗留数据
    'subject-tags.ts',   // 标签数据
  ],
  // 已知的安全模式（不需要国际化的）
  safePatterns: [
    /console\.(log|warn|error|info)/,  // console 输出
    /throw new Error/,                   // 错误抛出
    /\/\/.*/,                            // 单行注释
    /\/\*[\s\S]*?\*\//,                  // 多行注释
    /className=/,                         // className 属性
    /DICT\./,                            // 已使用 DICT
  ],
};

// 中文字符正则
const CHINESE_REGEX = /[\u4e00-\u9fa5]+/g;

// 检测结果
const results = {
  jsxHardcoded: [],      // JSX 中的硬编码
  stringHardcoded: [],   // JS 字符串中的硬编码
  templateHardcoded: [], // 模板字符串中的硬编码
};

/**
 * 检查单个文件
 */
async function checkFile(filePath) {
  const file = Bun.file(filePath);
  const content = await file.text();
  const lines = content.split('\n');
  const relativePath = filePath.replace(process.cwd() + '/', '').replace(process.cwd() + '\\', '');

  const fileResults = {
    jsxHardcoded: [],
    stringHardcoded: [],
    templateHardcoded: [],
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineNumber = index + 1;

    // 跳过注释行
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
      continue;
    }

    // 检查是否使用了 DICT
    if (line.includes('DICT.')) {
      continue; // 已国际化
    }

    // 检测 JSX 中的硬编码文本: >中文<
    const jsxMatches = line.match(/>[^<{]*[\u4e00-\u9fa5]+[^<{]*</g);
    if (jsxMatches) {
      for (const match of jsxMatches) {
        // 排除仅包含空白的
        const textContent = match.slice(1, -1).trim();
        if (textContent && CHINESE_REGEX.test(textContent)) {
          fileResults.jsxHardcoded.push({
            file: relativePath,
            line: lineNumber,
            content: line.trim(),
            text: textContent,
          });
        }
      }
    }

    // 检测 JS 字符串中的硬编码: "中文" 或 '中文'
    const stringMatches = line.match(/["'][^"']*[\u4e00-\u9fa5]+[^"']*["']/g);
    if (stringMatches) {
      for (const match of stringMatches) {
        // 排除已知安全模式
        const isSafe = CONFIG.safePatterns.some(pattern => pattern.test(line));
        if (!isSafe) {
          fileResults.stringHardcoded.push({
            file: relativePath,
            line: lineNumber,
            content: line.trim(),
            text: match,
          });
        }
      }
    }

    // 检测模板字符串: `中文` 或 `${var}中文`
    const templateMatches = line.match(/`[^`]*[\u4e00-\u9fa5]+[^`]*`/g);
    if (templateMatches) {
      for (const match of templateMatches) {
        const isSafe = CONFIG.safePatterns.some(pattern => pattern.test(line));
        if (!isSafe) {
          fileResults.templateHardcoded.push({
            file: relativePath,
            line: lineNumber,
            content: line.trim(),
            text: match,
          });
        }
      }
    }
  }

  return fileResults;
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 i18n 硬编码检测报告');
  console.log('='.repeat(60));

  const total = results.jsxHardcoded.length +
    results.stringHardcoded.length +
    results.templateHardcoded.length;

  if (total === 0) {
    console.log('\n✅ 太棒了！没有检测到硬编码的中文字符串。');
    return;
  }

  console.log(`\n⚠️  共检测到 ${total} 处可能的硬编码:\n`);

  // JSX 硬编码
  if (results.jsxHardcoded.length > 0) {
    console.log(`\n🔴 JSX 中的硬编码文本 (${results.jsxHardcoded.length} 处):`);
    console.log('-'.repeat(50));
    results.jsxHardcoded.forEach(item => {
      console.log(`  📍 ${item.file}:${item.line}`);
      console.log(`     文本: "${item.text}"`);
      console.log(`     代码: ${item.content.substring(0, 80)}${item.content.length > 80 ? '...' : ''}`);
      console.log('');
    });
  }

  // JS 字符串硬编码
  if (results.stringHardcoded.length > 0) {
    console.log(`\n🟡 JS 字符串中的硬编码 (${results.stringHardcoded.length} 处):`);
    console.log('-'.repeat(50));
    results.stringHardcoded.forEach(item => {
      console.log(`  📍 ${item.file}:${item.line}`);
      console.log(`     字符串: ${item.text}`);
      console.log(`     代码: ${item.content.substring(0, 80)}${item.content.length > 80 ? '...' : ''}`);
      console.log('');
    });
  }

  // 模板字符串硬编码
  if (results.templateHardcoded.length > 0) {
    console.log(`\n🟠 模板字符串中的硬编码 (${results.templateHardcoded.length} 处):`);
    console.log('-'.repeat(50));
    results.templateHardcoded.forEach(item => {
      console.log(`  📍 ${item.file}:${item.line}`);
      console.log(`     模板: ${item.text}`);
      console.log(`     代码: ${item.content.substring(0, 80)}${item.content.length > 80 ? '...' : ''}`);
      console.log('');
    });
  }

  // 按文件汇总
  console.log('\n📁 按文件汇总:');
  console.log('-'.repeat(50));
  const fileStats = {};
  [...results.jsxHardcoded, ...results.stringHardcoded, ...results.templateHardcoded].forEach(item => {
    fileStats[item.file] = (fileStats[item.file] || 0) + 1;
  });
  Object.entries(fileStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      console.log(`  ${count.toString().padStart(3)} 处  ${file}`);
    });

  console.log('\n' + '='.repeat(60));
  console.log('💡 修复建议:');
  console.log('   1. 将硬编码文本添加到 src/lib/i18n.ts 的 DICT 对象中');
  console.log('   2. 在组件中导入并使用: import { DICT } from "@/lib/i18n"');
  console.log('   3. 替换硬编码为: {DICT.xxx.yyy}');
  console.log('='.repeat(60) + '\n');
}

/**
 * 主函数
 */
async function main() {
  const startTime = performance.now();
  console.log('🔍 正在扫描文件...');

  // 使用 Bun.Glob 扫描文件
  const glob = new Bun.Glob(`${CONFIG.srcDir}/**/*.{${CONFIG.extensions.join(',')}}`);
  const files = [];

  for await (const file of glob.scan({ cwd: process.cwd() })) {
    // 检查是否需要忽略
    const shouldIgnore = CONFIG.ignore.some(pattern => file.includes(pattern));
    if (!shouldIgnore) {
      files.push(file);
    }
  }

  console.log(`   找到 ${files.length} 个文件`);

  // 并行处理所有文件
  const fileResults = await Promise.all(files.map(file => checkFile(file)));

  // 合并结果
  for (const result of fileResults) {
    results.jsxHardcoded.push(...result.jsxHardcoded);
    results.stringHardcoded.push(...result.stringHardcoded);
    results.templateHardcoded.push(...result.templateHardcoded);
  }

  generateReport();

  const endTime = performance.now();
  console.log(`⏱️  扫描耗时: ${(endTime - startTime).toFixed(2)}ms\n`);
}

main().catch(console.error);
