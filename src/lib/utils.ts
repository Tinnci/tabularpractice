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
