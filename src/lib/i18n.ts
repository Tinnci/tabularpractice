// Lightweight Localization Dictionary
// This file centralizes all UI strings to facilitate future i18n migration.

export const DICT = {
    // Common Actions
    common: {
        loading: "加载中...",
        save: "保存",
        cancel: "取消",
        confirm: "确认",
        delete: "删除",
        edit: "编辑",
        submit: "提交",
        back: "返回",
        next: "下一题",
        prev: "上一题",
        close: "关闭",
        search: "搜索",
        copy: "复制",
        copied: "已复制",
        retry: "重试",
        all: "全部",
        refresh: "刷新", // Added
    },

    // Status Filters
    status: {
        unanswered: "未做",
        mastered: "斩",
        confused: "懵",
        failed: "崩",
        label: "状态",
    },

    // Navigation & Workspace
    nav: {
        dashboard: "仪表盘",
        questions: "真题墙",
        practice: "模拟训练",
        mistakes: "错题本",
        settings: "设置",
        shortcuts: "快捷键",
        mathOutline: "数学考点",
        englishOutline: "英语题型",
        politicsOutline: "政治大纲",
        defaultOutline: "考点目录",
        progress: "刷题进度",
        collapseStats: "收起统计",
        expandStats: "展开统计",
    },

    // Question Wall & Filters
    wall: {
        title: "真题墙",
        selectGroup: "选择试卷组",
        unified: "统考科目",
        selfProposed: "自命题科目",
        year: "年份",
        allYears: "全部年份",
        type: "题型",
        allTypes: "全部题型",
        choice: "选择题",
        fill: "填空题",
        answer: "解答题",
        totalCount: "{count} 题",
        doneCount: "/ {count} 已刷",
        viewWall: "墙视图",
        viewGrid: "列表视图",
        noPapers: "暂无试卷数据", // Added
    },

    // Practice Session
    practice: {
        title: "模拟训练",
        description: "配置你的练习会话，专注特定领域。",
        sessionSettings: "会话设置",
        start: "开始练习",
        continue: "继续练习",
        endSession: "结束会话",
        questionType: "题目类型",
        shuffle: "随机打乱",
        shuffleDesc: "随机排列题目顺序。",
        tags: "知识点",
        noTags: "暂无标签",
        matchCount: "{count} 题匹配你的条件。",
        active: "练习进行中",
        questionIndex: "第 {current} 题 / 共 {total} 题",
    },

    // Settings
    settings: {
        title: "设置",
        desc: "管理您的应用偏好和数据。", // Added
        theme: "外观设置", // Updated
        themeDesc: "配色方案与布局", // Unused but good to have
        appearance: { // New Section
            compact: "紧凑模式",
            compactDesc: "完全去除卡片内边距",
            cardWidth: "卡片宽度",
            cardHeight: "卡片高度",
            colSpacing: "列间距",
            rowSpacing: "题目间距",
        },
        paperFilter: "试卷筛选", // Added
        paperFilterDesc: "关闭的试卷将不会出现在练习列表中。", // Added
        local: "本地", // Added
        remote: "远程", // Added
        themeLight: "浅色",
        themeDark: "深色",
        themeSystem: "系统",
        data: "数据管理",
        backupFull: "完整备份",
        backupFullDesc: "导出 ZIP (含草稿)",
        restore: "导入进度",
        restoreDesc: "恢复备份文件",
        backupTip: "提示：数据存储在浏览器的 LocalStorage 中。为了防止数据丢失（如清理缓存），建议定期导出备份。",
        sync: "GitHub 云同步",
        syncDesc: "配置 GitHub Gist 进行多端同步。",
        token: "GitHub Token",
        tokenTip: "推荐使用 Fine-grained PAT 以获得更好的安全性。仅需授予 Gist 的 Read and Write 权限。",
        gistId: "Gist ID",
        gistIdPlaceholder: "自动生成...",
        lastSync: "上次同步: {time}",
        neverSync: "从未同步",
        syncNow: "立即同步",
        syncing: "同步中...",
        repo: "题库源配置",
        repoDesc: "您可以同时启用多个题库源，系统将自动合并所有题目。",
        savedRepos: "已保存的源",
        builtin: "内置",
        addRepo: "添加新源",
        repoName: "名称 (例如: 数学一真题)",
        repoUrl: "URL (GitHub Raw 或 API)",
        repoUrlTip: "提示: URL 应指向包含 index.json 的目录",
        validate: "验证...",
        add: "添加",
        exportSuccess: "完整备份已下载",
        exportSuccessDesc: "包含进度、笔记、收藏、题库源及所有手写草稿",
        exportFail: "导出失败",
        importSuccess: "导入成功",
        importSuccessDesc: "数据已完全恢复，页面即将刷新...",
        importFail: "恢复失败",
        parseFail: "解析失败",
        unsupportedFormat: "不支持的文件格式",
        warningOverwrite: "警告：即将覆盖数据",
        warningOverwriteDesc: "此操作将使用导入文件中的数据完全覆盖您当前的刷题进度。当前进度将被永久删除且无法撤销。",
        confirmOverwrite: "确认覆盖",
    },

    // Sync Messages
    sync: {
        success: "同步成功",
        error: "同步失败",
        conflict: "数据冲突",
        conflictDesc: "检测到云端数据有更新，请选择解决方案。",
        useLocal: "使用本地",
        useRemote: "使用云端",
        merge: "智能合并",
    }
} as const;

export type Dict = typeof DICT;
