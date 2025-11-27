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
    const urlObj = new URL(url);

    // 1. 提取 BVID
    let bvid = null;
    const pathMatch = urlObj.pathname.match(/(BV\w+)/);
    if (pathMatch) {
      bvid = pathMatch[1];
    } else {
      bvid = urlObj.searchParams.get('bvid');
    }

    if (!bvid) return null;

    // 2. 提取参数
    const params = urlObj.searchParams;
    const page = params.get('p') || params.get('page') || '1';
    const t = params.get('t') || params.get('time');

    // 3. 构建 Embed URL
    const embedUrl = new URL("https://player.bilibili.com/player.html");
    embedUrl.searchParams.set("bvid", bvid);
    embedUrl.searchParams.set("page", page);

    // 注意：iOS 上 high_quality=1 可能会导致加载卡顿，可以尝试去掉或保留
    embedUrl.searchParams.set("high_quality", "1");
    embedUrl.searchParams.set("danmaku", "0");

    // 尝试添加 autoplay=0，有时能避免 iOS 播放器初始化时的竞争状态错误
    // 虽然不能自动播放，但有助于让播放器正确读取 t 参数等待用户点击
    embedUrl.searchParams.set("autoplay", "0");

    // 增加移动端/iOS 友好参数
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("html5", "1");

    if (t) embedUrl.searchParams.set("t", t);

    return embedUrl.toString(); // 直接返回完整 https 链接

  } catch {
    console.warn("Bilibili URL 解析失败:", url);
    return null;
  }
}

/**
 * 从B站视频链接中提取时间戳（秒）
 * @param url B站视频链接
 * @returns 时间戳（秒），如果没有则返回 null
 */
export function getBilibiliTimestamp(url: string): number | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    const t = params.get('t') || params.get('time');

    if (t) {
      const seconds = parseInt(t, 10);
      return isNaN(seconds) ? null : seconds;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 将秒数格式化为 MM:SS 或 HH:MM:SS 格式
 * @param seconds 秒数
 * @returns 格式化的时间字符串
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
