import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将B站视频链接转换为可嵌入的iframe地址 (优化版)
 * 使用标准 URL API 解析，增强稳健性
 * @param url B站视频链接，如: https://www.bilibili.com/video/BV1xxxx?t=120&p=1
 * @returns iframe embed URL,  如: //player.bilibili.com/player.html?bvid=BV1xxxx&page=1&t=120
 */
export function getBilibiliEmbed(url: string): string | null {
  try {
    // 如果 URL 不包含协议头，添加一个默认协议以便 URL 构造器能够解析
    const urlToParse = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    // 1. 使用标准 URL API 解析，自动处理各种参数拼接和编码问题
    const urlObj = new URL(urlToParse);

    // 2. 智能提取视频 ID (支持 BV 号)
    // 优先从 pathname 提取，避免查询参数干扰
    const bvMatch = urlObj.pathname.match(/(BV\w+)/i);

    if (!bvMatch) return null;

    const bvid = bvMatch[1];

    // 3. 使用 URLSearchParams 提取并处理查询参数
    const params = urlObj.searchParams;
    const page = params.get('p') || '1';
    const t = params.get('t'); // 获取时间戳

    // 4. 构建标准的 URLSearchParams
    const embedParams = new URLSearchParams();
    embedParams.set('bvid', bvid);
    embedParams.set('page', page);
    embedParams.set('high_quality', '1');
    embedParams.set('danmaku', '0');

    // 处理时间跳转
    if (t) {
      embedParams.set('t', t);
      // 注意：某些情况下，为了确保时间跳转生效，可能需要开启自动播放
      // 但出于用户体验考虑（避免突然发出声音），通常不强制 autoplay=1
      // 如果发现跳转失效，可以尝试添加 embedParams.set('autoplay', '1');
    }

    return `//player.bilibili.com/player.html?${embedParams.toString()}`;

  } catch (error) {
    console.warn("Invalid Bilibili URL:", url, error);
    return null;
  }
}

import { Question, Paper, PaperGroup } from "@/lib/types";
import { type RepoSource } from "@/lib/store";

export function derivePapersFromQuestions(questions: Question[], groups: PaperGroup[]): Paper[] {
  const papersMap = new Map<string, Paper>();

  questions.forEach(q => {
    if (!q.paperId) return;
    if (papersMap.has(q.paperId)) return;

    // 尝试从 paperId 解析年份 (假设格式为 math1-2023)
    // 或者从 q.year 获取 (如果存在)
    let year = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qAny = q as any;
    if (qAny.year) {
      year = parseInt(qAny.year);
    } else {
      const match = q.paperId.match(/-(\d{4})/);
      if (match) {
        year = parseInt(match[1]);
      }
    }

    // 查找对应的 group
    // 假设 groupId 可以从 paperId 前缀推断，或者 q.category
    // math1-2023 -> math1
    const groupId = qAny.category || q.paperId.split('-').slice(0, -1).join('-');

    const group = groups.find(g => g.id === groupId);
    const groupName = group ? group.name : groupId;

    if (year > 0) {
      papersMap.set(q.paperId, {
        id: q.paperId,
        groupId: groupId,
        year: year,
        name: `${year}年${groupName}真题`
      });
    }
  });

  return Array.from(papersMap.values()).sort((a, b) => b.year - a.year);
}

/**
 * 统一的图片URL解析函数
 * 优先级：1. question.sourceUrl  2. repoBaseUrl  3. repoSources中的远程源
 */
export function getImageUrl(
  url: string | undefined,
  question?: Question | null,
  repoBaseUrl?: string,
  repoSources?: RepoSource[]
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  // 1. 优先使用题目自带的 sourceUrl
  if (question?.sourceUrl) {
    const cleanBase = question.sourceUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  }

  // 2. 其次使用全局设置的 repoBaseUrl (兼容旧版)
  if (repoBaseUrl) {
    const cleanBase = repoBaseUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  }

  // 3. 最后尝试查找默认的远程源 (default-remote) 或第一个启用的非内置源
  if (repoSources && repoSources.length > 0) {
    const remoteSource = repoSources.find(s => s.id === 'default-remote' && s.enabled)
      || repoSources.find(s => !s.isBuiltin && s.enabled);

    if (remoteSource?.url) {
      const cleanBase = remoteSource.url.replace(/\/$/, '');
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `${cleanBase}${cleanPath}`;
    }
  }

  return url;
}

