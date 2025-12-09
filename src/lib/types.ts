// 基础枚举
type SubjectType = 'unified' | 'self_proposed'; // 统考 | 自命题
export type Status = 'unanswered' | 'mastered' | 'confused' | 'failed';

// 笔记类型定义
// 笔记类型定义
export type NotesMap = Record<string, string>; // key: questionId, value: markdown content

// 视图类型定义
export type ViewType = 'question' | 'answer' | 'analysis' | 'video' | 'note' | 'draft';

export interface RepoSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isBuiltin?: boolean;
}

// 1. 试卷组定义 (核心概念：把一类试卷打包)
export interface PaperGroup {
  id: string;           // e.g., "math1", "shu-812", "shu-915"
  name: string;         // e.g., "数学一", "上海大学-812控制理论"
  type: SubjectType;
  subjectKey?: string;  // 新增：直接指明科目，如 'math', 'english'，避免推断
  university?: string;  // 仅自命题需要，e.g., "上海大学"
  courseCode?: string;  // 仅自命题需要，e.g., "812"
}

// 2. 试卷定义 (连接 试卷组 和 题目)
export interface Paper {
  id: string;           // e.g., "math1-2023"
  groupId: string;      // 关联到 PaperGroup.id
  year: number;         // 2023
  name: string;         // "2023年考研数学一真题"
  sourceUrl?: string;   // 来源 URL
}

// 3. 题目定义
export interface Question {
  id: string;
  paperId: string;      // 关联到 Paper.id
  number: number;       // 题号 1, 2, 3...
  type: 'choice' | 'fill' | 'answer';
  status?: Status;      // 状态，用于UI显示
  tags: string[];       // 知识点ID

  // 新增：更详细的内容字段
  contentImg?: string;  // 题目图片 (主要内容)
  contentImgThumb?: string; // 题目缩略图 (用于首页预览)
  answerImg?: string;   // 答案图片 (纯结果)
  analysisImg?: string; // 解析图片 (详细步骤)

  // 新增：Markdown 内容 (优先渲染)
  contentMd?: string;
  answerMd?: string;
  analysisMd?: string;

  videoUrl?: string;    // 视频链接 (B站链接，如 https://www.bilibili.com/video/BV1xxxx?t=120)

  // 保留向后兼容


  // 新增：答案和标签名
  answer?: string;
  tagNames?: string[];

  // 来源 URL (用于多源模式下的资源加载)
  sourceUrl?: string;
}




export interface PaperDetail {
  paperId: string;
  year: string | number;
  tags?: string[];
  questions: Record<string, Question>;
}

// 备份数据结构定义
export interface BackupData {
  version: number;
  timestamp: string;
  progress: Record<string, Status>;
  notes: NotesMap;
  stars: Record<string, boolean>;
  repoSources: RepoSource[];
  progressLastModified?: Record<string, number>;
  notesLastModified?: Record<string, number>;

  times?: Record<string, number>;
  timesLastModified?: Record<string, number>;

  // 运行时附加的字段 (不在 JSON 文件中，但加载到内存时存在)
  _draftCount?: number;
  _zip?: unknown; // 引用 JSZip 实例
}

// ========== 学习分析系统类型 ==========

/**
 * 单次做题记录
 * 用于追溯每次做题的详细信息，支持学习行为分析
 */
export interface StudyRecord {
  id: string;                                     // 唯一标识 (nanoid)
  questionId: string;                             // 题目ID
  startedAt: number;                              // 开始时间戳 (ms)
  endedAt: number;                                // 结束时间戳 (ms)
  durationMs: number;                             // 实际思考时间（排除暂停、查看答案等）
  totalDurationMs: number;                        // 总停留时间（包含暂停和查看答案）
  status?: Status;                                // 本次标记的状态（可能未标记）
  source: 'modal' | 'practice' | 'review';        // 来源场景
  viewedAnswer?: boolean;                         // 是否查看了答案
  viewedAnalysis?: boolean;                       // 是否查看了解析
}

/**
 * 每日学习统计
 * 用于 Heatmap、趋势图等聚合展示
 */
export interface DailyStudyStats {
  date: string;                                   // YYYY-MM-DD
  questionsAttempted: number;                     // 尝试的题目数
  questionsCompleted: number;                     // 完成（标记状态）的题目数
  totalDurationMs: number;                        // 总学习时长
  mastered: number;                               // 标记为掌握
  confused: number;                               // 标记为模糊
  failed: number;                                 // 标记为不会
}

export interface PracticeSession {
  isActive: boolean;
  queueIds: string[];
  currentIndex: number;
  settings: {
    types: string[];
    tags: string[];
    isShuffle: boolean;
  };
}
