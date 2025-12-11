/**
 * i18n 硬编码检测脚本 (Node.js 版) - 支持中文和英文检测
 * 使用 Node.js 原生 API 进行文件扫描
 */
import fs from 'fs/promises';
import { readFileSync, statSync } from 'fs';
import path from 'path';

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
    'utils.ts',          // 工具函数通常包含很多字面量
    'constants',         // 常量定义
    'assets',            // 资源引用
    'lib/types.ts',      // 类型定义
    'lib/store/',        // store actions rarely show UI text directly usually
  ],
  // 已知的安全模式（不需要国际化的）
  safePatterns: [
    /console\.(log|warn|error|info)/,  // console 输出
    /throw new Error/,                   // 错误抛出
    /\/\/.*/,                            // 单行注释
    /\/\*[\s\S]*?\*\//,                  // 多行注释
    /className=/,                         // className 属性
    /DICT\./,                            // 已使用 DICT
    /style=/,                            // style 属性
    /key=/,                              // key 属性
    /id=/,                               // id 属性
    /width=/, /height=/,                 // 尺寸
    /type=/,                             // type
    /src=/, /href=/,                     // 链接
  ],
  // 重点检查的 UI 属性 (检测英文时使用)
  targetAttributes: [
    'title', 'placeholder', 'alt', 'aria-label', 'label', 'description'
  ]
};

// 中文字符正则
const CHINESE_REGEX = /[\u4e00-\u9fa5]+/g;

// 英文 UI 文本启发式规则
const ENGLISH_UI_REGEX = /[A-Z][a-z]+(\s+[a-zA-Z0-9]+)+|[A-Z][a-z]+/;

// 检测结果
const results = {
  chinese: [],
  english: []
};

/**
 * 判断是否为可能的英文 UI 文本
 */
function isPotentialEnglishUI(text) {
  if (!text) return false;
  text = text.trim();
  if (text.length < 2) return false;

  // 排除纯数字、符号
  if (/^[\d\s\p{P}]+$/u.test(text)) return false;

  // 排除 URL/路径
  if (text.includes('/') || text.startsWith('http')) return false;

  // 排除类似代码的字符串 (无空格且包含特殊字符或驼峰)
  if (!text.includes(' ') && /[a-z]+[A-Z]/.test(text)) return false;

  // 排除全大写 (通常是常量)
  if (text === text.toUpperCase() && text.length > 3) return false;

  // 排除全小写单词 (通常是值)
  if (!text.includes(' ') && text === text.toLowerCase()) return false;

  // 必须包含字母
  if (!/[a-zA-Z]/.test(text)) return false;

  return true;
}

/**
 * 递归遍历目录获取文件
 */
async function getFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

/**
 * 检查单个文件
 */
async function checkFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(process.cwd(), '').replace(/^[\\\/]/, '');

  // 检查是否在忽略列表中
  if (CONFIG.ignore.some(ignore => relativePath.replace(/\\/g, '/').includes(ignore))) {
    return { chinese: [], english: [] };
  }

  // 检查扩展名
  const ext = path.extname(filePath).slice(1);
  if (!CONFIG.extensions.includes(ext)) {
    return { chinese: [], english: [] };
  }

  const fileResults = {
    chinese: [],
    english: []
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineNumber = index + 1;

    // 跳过空行和注释
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
      continue;
    }

    // 检查是否使用了 DICT
    if (line.includes('DICT.')) {
      continue;
    }

    // 排除安全模式
    if (CONFIG.safePatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    // --- 1. 检测中文 ---
    let match;
    const chineseMatches = [];

    // JSX 内容 >中文<
    const jsxTextMatches = line.match(/>([^<{]*[\u4e00-\u9fa5]+[^<{]*)<|(?<=>)([^<{]*[\u4e00-\u9fa5]+[^<{]*)$/g);
    if (jsxTextMatches) {
      jsxTextMatches.forEach(m => {
        const text = m.replace(/[><]/g, '').trim();
        if (text) chineseMatches.push({ text, type: 'JSX Content' });
      });
    }

    // 字符串 "中文"
    const stringMatches = line.match(/(["'`])([^"']*[\u4e00-\u9fa5]+[^"']*)\1/g);
    if (stringMatches) {
      stringMatches.forEach(m => {
        const text = m.slice(1, -1).trim();
        if (text) chineseMatches.push({ text, type: 'String' });
      });
    }

    if (chineseMatches.length > 0) {
      chineseMatches.forEach(m => {
        fileResults.chinese.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          text: m.text,
          type: m.type
        });
      });
    }

    // --- 2. 检测英文 (仅限特定 UI 场景以减少误报) ---
    const englishMatches = [];

    // 场景 A: 特定属性的值 (title="Submit", placeholder="Enter name")
    for (const attr of CONFIG.targetAttributes) {
      const regex = new RegExp(`${attr}=(["'])((?:(?!(?:^className$|^key$|^id$|data-)).)*?)\\1`, 'g');
      const matches = [...line.matchAll(regex)];
      for (const m of matches) {
        const val = m[2];
        if (isPotentialEnglishUI(val)) {
          englishMatches.push({ text: val, type: `Attr: ${attr}` });
        }
      }
    }

    // 场景 B: JSX 纯文本内容 >Submit<
    const jsxContentRegex = />([^<>{}\n]+)</g;
    const jsxMatches2 = [...line.matchAll(jsxContentRegex)];

    for (const m of jsxMatches2) {
      const val = m[1].trim();
      // 忽略纯数字、单个字母、空
      if (isPotentialEnglishUI(val)) {
        englishMatches.push({ text: val, type: 'JSX Content' });
      }
    }

    if (englishMatches.length > 0) {
      englishMatches.forEach(m => {
        fileResults.english.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          text: m.text,
          type: m.type
        });
      });
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

  const totalChinese = results.chinese.length;
  const totalEnglish = results.english.length;

  if (totalChinese === 0 && totalEnglish === 0) {
    console.log('\n✅ 太棒了！没有检测到硬编码字符串。');
    return;
  }

  // --- 中文报告 ---
  if (totalChinese > 0) {
    console.log(`\n⚠️  发现 ${totalChinese} 处中文硬编码:`);
    console.log('-'.repeat(50));
    results.chinese.forEach(item => {
      console.log(`  📍 [${item.file}:${item.line}] (${item.type})`);
      console.log(`     "${item.text}"`);
    });
  } else {
    console.log('\n✅ 未发现中文硬编码');
  }

  // --- 英文报告 ---
  if (totalEnglish > 0) {
    console.log(`\n⚠️  发现 ${totalEnglish} 处可能的英文硬编码 (仅检测 UI 属性和内容):`);
    console.log('   (注意：英文检测存在误报可能，请人工甄别)');
    console.log('-'.repeat(50));
    results.english.forEach(item => {
      console.log(`  📍 [${item.file}:${item.line}] (${item.type})`);
      console.log(`     "${item.text}"`);
    });
  } else {
    console.log('\n✅ 未发现明显的英文 UI 硬编码');
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * 主函数
 */
async function main() {
  const startTime = performance.now();
  console.log('🔍 正在扫描文件 (含中文与英文检测)...');

  const files = await getFiles(path.resolve(process.cwd(), CONFIG.srcDir));

  console.log(`   扫描范围: ${files.length} 个文件`);

  // 并行处理所有文件
  const fileResults = await Promise.all(files.map(file => checkFile(file)));

  // 合并结果
  for (const result of fileResults) {
    results.chinese.push(...result.chinese);
    results.english.push(...result.english);
  }

  generateReport();

  const endTime = performance.now();
  console.log(`⏱️  耗时: ${(endTime - startTime).toFixed(2)}ms\n`);
}

main().catch(console.error);
