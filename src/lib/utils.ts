import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将B站视频链接转换为可嵌入的iframe地址
 * @param url B站视频链接，如: https://www.bilibili.com/video/BV1xxxx?t=120&p=1
 * @returns iframe embed URL,  如: //player.bilibili.com/player.html?bvid=BV1xxxx&page=1&t=120
 */
export function getBilibiliEmbed(url: string): string | null {
  // 匹配 BV 号
  const bvMatch = url.match(/(BV\w+)/);
  if (!bvMatch) return null;

  // 匹配时间戳 (t参数)
  const tMatch = url.match(/[?&]t=(\d+)/);
  // 匹配分P (p参数)
  const pMatch = url.match(/[?&]p=(\d+)/);

  const bvid = bvMatch[1];
  const page = pMatch ? pMatch[1] : 1;
  const time = tMatch ? `&t=${tMatch[1]}` : "";

  // 高画质 + 禁用弹幕
  return `//player.bilibili.com/player.html?bvid=${bvid}&page=${page}&high_quality=1&danmaku=0${time}`;
}

import { Question, Paper, PaperGroup } from "@/lib/types";

export function derivePapersFromQuestions(questions: Question[], groups: PaperGroup[]): Paper[] {
  const papersMap = new Map<string, Paper>();

  questions.forEach(q => {
    if (!q.paperId) return;
    if (papersMap.has(q.paperId)) return;

    // 尝试从 paperId 解析年份 (假设格式为 math1-2023)
    // 或者从 q.year 获取 (如果存在)
    // 注意：Question 类型定义里目前没有 year，但 index.json 数据里有
    // 我们需要扩展 Question 类型或者这里做个断言/临时处理
    let year = 0;
    // @ts-ignore
    if (q.year) {
      // @ts-ignore
      year = parseInt(q.year);
    } else {
      const match = q.paperId.match(/-(\d{4})/);
      if (match) {
        year = parseInt(match[1]);
      }
    }

    // 查找对应的 group
    // 假设 groupId 可以从 paperId 前缀推断，或者 q.category
    // math1-2023 -> math1
    // @ts-ignore
    const groupId = q.category || q.paperId.split('-').slice(0, -1).join('-');

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
