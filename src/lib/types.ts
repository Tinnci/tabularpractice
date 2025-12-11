// 基础枚举
type SubjectType = 'unified' | 'self_proposed'; // 统考 | 自命题
export type Status = 'unanswered' | 'mastered' | 'confused' | 'failed';

// 笔记类型定义
// 笔记类型定义
export type NotesMap = Record<string, string>; // key: questionId, value: markdown content

// 视图类型定义
export type ViewType = 'question' | 'answer' | 'analysis' | 'video' | 'note' | 'draft' | 'eureka';

export interface RepoSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isBuiltin?: boolean;

  // Permission Management
  permission?: 'read' | 'write' | 'admin';
  isFork?: boolean;
  originalUrl?: string; // If it is a fork, this points to the upstream
  lastCheckedAt?: number;
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
  subjectKey?: string;  // 新增：允许单张试卷覆盖科目（优先于 PaperGroup）
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


  // 新增：答案和标签名
  answer?: string;
  tagNames?: string[];

  // 来源 URL (用于多源模式下的资源加载)
  sourceUrl?: string;

  // 顿悟提示 (Eureka Hints) - Interactive Cognitive Scaffolding
  eureka?: EurekaData;
}

// --- Eureka 认知脚手架数据结构 ---

export type BlockerType = 'representation' | 'function' | 'constraint' | 'analogy';

export interface EurekaData {
  // 诊断式提示：让用户自选卡点类型
  diagnostic?: {
    question: string; // e.g., "你觉得卡在哪里了？"
    options: Array<{
      type: BlockerType;
      label: string; // e.g., "看不出该用什么方法"
      hint: string;  // 选中后显示的具体提示
    }>;
  };

  // 模型配对 (用于类比迁移)
  modelLineup?: {
    question: string; // e.g., "下面哪个模型的结构和这道题最像？"
    options: Array<{
      id: string;
      label: string;     // e.g., "泰勒展开"
      formula?: string;  // LaTeX formula
      isCorrect: boolean;
      feedback: string;  // 选中后的反馈
    }>;
  };

  // 变量角色卡 (用于表征重构)
  variableRoles?: Array<{
    target: string;      // 要高亮的表达式，e.g., "(x-1)"
    currentRole: string; // 当前角色，e.g., "看作减法"
    suggestedRole: string; // 建议角色，e.g., "看作整体 X"
    transformation: string; // 变换提示，e.g., "令 X = x-1"
  }>;

  // 战略步骤 (用于拆解解题过程)
  strategies?: Array<{
    title: string;    // 步骤名，e.g. "降维打击"
    trigger: string;  // 触发条件，e.g. "看到二重积分区域关于y=x对称"
    action: string;   // 执行动作，e.g. "利用轮换对称性化简"
  }>;

  // 关键洞察 (最终揭示)
  insight?: string;
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
