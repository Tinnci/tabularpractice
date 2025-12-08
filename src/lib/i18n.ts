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
        refresh: "刷新",
        imageLoadError: "图片加载失败",
        copyMarkdown: "复制 Markdown",
        copyImage: "复制图片",
        unstar: "取消收藏",
        star: "收藏题目",
        syncing: "同步中...",
        unsaved: "有未保存的更改",
        syncFailedRetry: "同步失败，点击重试",
        exitFullscreen: "退出全屏",
        enterFullscreen: "全屏显示",
        loadingQuestion: "题目加载中...",
        preview: "预览",
        undo: "撤销",
        shortcutPrev: "快捷键: ←",
        shortcutNext: "快捷键: →",
        pause: "暂停",
        start: "开始",
        resetTime: "重置时间",
        other: "其他",
    },

    // Status Filters
    status: {
        unanswered: "未做",
        mastered: "斩",
        confused: "懵",
        failed: "崩",
        label: "状态",
        stillFailed: "仍未掌握",
        shortcutMastered: "快捷键: 1",
        shortcutConfused: "快捷键: 2",
        shortcutFailed: "快捷键: 3",
    },

    // Progress Overview
    progress: {
        currentProgress: "当前进度",
        progressCompleted: "已刷",
        masteredShort: "已斩",
        confusedShort: "懵圈",
        failedShort: "崩盘",
        remainingShort: "剩余",
    },

    // Activity Heatmap
    heatmap: {
        title: "奋斗热力图",
        yearlyTotal: "年度总计",
        streak: "连续打卡",
        lesserActivity: "少",
        moreActivity: "多",
        questionsInYear: "{{count}} 题 (过去一年)",
        months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        weekdays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    },

    // Dashboard Page
    dashboard: {
        challengeTitle: "准备好迎接挑战了吗？",
        challengeDesc: "保持节奏，每天进步一点点。你已经斩获了 {count} 道真题。",
        continuePractice: "继续上次刷题",
        startPractice: "开始刷题",
        dailyTarget: "今日目标",
        masteredLabel: "已斩题数",
        masteredDesc: "熟练掌握",
        confusedLabel: "需复习",
        confusedDesc: "概念模糊",
        failedLabel: "错题攻克",
        failedDesc: "待复习 (错题 + 疑惑)",
        subjectProgress: "学科进度分布",
        subjectProgressDesc: "各科目掌握情况概览",
        noDataDesc: "暂无题目数据",
        specialAttack: "专项突破",
    },

    // Navigation & Workspace
    nav: {
        dashboard: "仪表盘",
        questions: "真题墙",
        practice: "模拟训练",
        mistakes: "错题本",
        settings: "设置",
        aiImport: "AI 智能导题",
        aiImportLabel: "AI 导入",
        shortcuts: "快捷键",
        mathOutline: "数学考点",
        englishOutline: "英语题型",
        politicsOutline: "政治大纲",
        defaultOutline: "考点目录",
        progress: "刷题进度",
        collapseStats: "收起统计",
        expandStats: "展开统计",
        menu: "目录",
        openMenu: "打开目录",
        selectChapter: "选择章节",
        searchPlaceholder: "搜索题目...",
        searchDialogPlaceholder: "搜索年份、题号或知识点 (如 '2023 1' 或 '极限')...",
        searchEmpty: "未找到相关题目",
        searchEmptyHelp: "尝试使用年份、题号或知识点关键词",
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
        includedTags: "包含知识点",
        customPractice: "自定义训练",
        configDesc: "配置您的练习会话，专注特定领域。",
        sessionSettings: "会话设置",
        questionType: "题目类型",
        filterDesc: "按题型和知识点筛选，或使用随机模式。",
        randomShuffle: "随机打乱",
        randomDesc: "随机排列题目顺序。",
        tags: "知识点",
        tagsSelected: "知识点 (已选 {count})",
        noTagsAvailable: "暂无可用标签",
        matchCount: "{count} 题匹配你的条件。",
        startPractice: "开始练习",
        sessionActive: "练习进行中",
        questionIndex: "第 {current} 题 / 共 {total} 题",
        continuePractice: "继续练习",
        endSession: "结束会话",
        moreTags: "查看更多知识点",
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
        // Toast messages
        toast: {
            noGithubToken: "请先设置 GitHub Token",
            syncSuccess: "同步成功",
            syncFailed: "同步失败",
            syncFailedDesc: "请检查网络或 Token 权限",
            nameUrlRequired: "请填写名称和 URL",
            sourceAdded: "题库源添加成功",
            sourceAddedDesc: "您可以点击开关启用该题库",
            sourceVerifyFailed: "题库验证失败",
            sourceVerifyFailedDesc: "请检查 URL 是否正确，并确保 index.json 可访问",
            backupDownloaded: "完整备份已下载",
            exportFailed: "导出失败",
            exportFailedDesc: "生成备份文件时出现错误",
            parseFailed: "解析失败",
            parseFailedDesc: "JSON 文件格式错误",
            unsupportedFormat: "不支持的文件格式",
            unsupportedFormatDesc: "请上传 .zip 或 .json 备份文件",
            readFailed: "读取失败",
            readFailedDesc: "文件可能已损坏",
            importSuccess: "导入成功",
            importSuccessDesc: "数据已完全恢复，页面即将刷新...",
            restoreFailed: "恢复失败",
            restoreFailedDesc: "写入数据时发生错误",
            enabled: "启用",
            disabled: "禁用",
        },
        labels: {
            localDataDir: "本地数据目录",
            supportedFormats: "支持 .zip (完整) 或 .json (旧版) 格式",
            backupDesc: "包含进度、笔记、收藏、题库源及所有手写草稿",
            builtin: "内置题库",
        },
    },

    // Exam & Question Modal
    exam: {
        questionIndex: "第 {number} 题",
        typeChoice: "选择",
        typeFill: "填空",
        typeEssay: "解答",
        video: "视频",
        answer: "答案",
        analysis: "解析",
        note: "笔记",
        hasNote: "有笔记",
        draft: "草稿",
        questionDesc: "题目描述",
        contentMissing: "题目内容缺失",
        videoStartAt: "视频将从 {time} 开始",
        openInBilibiliMobile: "去 B 站观看 (空降)",
        openInBilibiliWeb: "在 Bilibili 打开 (支持自动空降)",
        referenceAnswer: "参考答案",
        answerLabel: "答案：{answer}",
        noAnswer: "暂无答案内容",
        detailedAnalysis: "详细解析",
        noAnalysis: "暂无解析内容",
        handwritingDraft: "手写草稿",
        pen: "画笔",
        eraser: "橡皮擦",
        palmRejectionOn: "已开启防误触 (仅限手写笔)",
        palmRejectionOff: "开启防误触 (仅限手写笔)",
        clearDraftConfirm: "确定要清空草稿吗？",
        clearDraft: "清空草稿",
        gpuOn: "已开启 GPU 加速 (Beta)",
        gpuOff: "开启 GPU 加速 (Beta)",
        personalNote: "个人笔记",
        notePlaceholder: "在此输入 Markdown 笔记... (支持 **加粗**, - 列表, > 引用 等)",
        startNotePrompt: "点击此处开始记录笔记...",
        analysisAndAnswer: "解析与答案",
        showAnswer: "查看答案",
    },

    // Shortcuts
    shortcuts: {
        title: "快捷键指南",
        desc: "使用键盘快捷键来提高刷题效率。",
        global: "全局",
        questionDetail: "题目详情页",
        search: "搜索题目",
        help: "显示快捷键帮助",
        toggleYear: "切换年份 (上一年/下一年)",
        prevNext: "上一题 / 下一题",
        markMastered: "标记为：斩 (熟练)",
        markConfused: "标记为：懵 (不熟)",
        markFailed: "标记为：崩 (不会)",
        close: "关闭详情页",
    },

    onboarding: {
        title: "Tabular",
        subtitle: "Practice",
        heroP1: "您的智能化真题刷题助手。",
        heroP2: "告别盲目题海战术，用数据驱动高效复习。",
        continue: "继续刷题",
        start: "开始刷题",
        features: {
            precise: "精准突破",
            preciseDesc: "按年份、按题型、按知识点筛选题目。哪里不会点哪里，构建完整的知识体系。",
            tracking: "数据追踪",
            trackingDesc: "自动生成进度热力图和学科分布图。实时掌握复习进度，拒绝假努力。",
            immersive: "沉浸体验",
            immersiveDesc: "支持 Markdown 笔记、一键跳转 B 站视频讲解。打造最舒适的刷题环境。",
            security: "数据安全",
            securityDesc: "支持 GitHub Gist 云同步，多设备无缝切换。数据永不丢失，刷题更安心。",
            extensible: "无限扩展",
            extensibleDesc: "开放题库生态。通过设置添加自定义题库源，英语、政治、专业课一网打尽。",
            custom: "为你而设",
            customDesc: "无论是大屏复习还是碎片时间刷题，完全可自定义的卡片布局与省流模式助你专注。",
        },
        selectSubject: "选择科目开始",
        loading: "正在加载题库数据...",
        totalCount: "共 {count} 道真题",
    },

    mistakes: {
        title: "错题回顾",
        desc: "集中复习您的错题和疑难点。",
        exit: "退出复习",
        progress: "第 {current} 题 / 共 {total} 题",
        allCaughtUp: "全部复习完毕！",
        allCaughtUpDesc: "您已完成当前所有错题的复习。",
        backToDashboard: "返回仪表盘",
        total: "错题总数",
        toReview: "待复习",
        failedCount: "错题",
        failedDesc: "需要重点关注",
        confusedCount: "疑惑",
        confusedDesc: "需要进一步澄清",
        readyTitle: "准备好复习了吗？",
        readyDesc: "进入沉浸式复习模式，逐个攻克错题。默认隐藏答案以帮助自测。",
        startReview: "开始复习会话",
        noMistakes: "太棒了！暂无错题",
        noMistakesDesc: "您目前没有标记为错题或疑惑的题目。",
    },

    // Sync Messages
    sync: {
        success: "同步成功",
        error: "同步失败",
        conflict: "数据冲突",
        conflictDesc: "云端数据有更新的版本。这通常发生在其他设备进行了同步后。请选择如何解决此冲突。",
        useLocal: "使用本地 (覆盖)",
        useRemote: "使用云端 (丢失本地)",
        merge: "智能合并 (推荐)",
        localTime: "时间: {time}",
        remoteTime: "时间: {time}",
        localDesc: "包含您当前设备上所有未同步的更改。",
        remoteDesc: "来自其他设备的最新同步数据。",
        localData: "本地数据",
        remoteData: "云端数据",
        notConnected: "未连接同步",
        syncedAt: "已同步 (上次: {time})",
        unknown: "未知",
    }
} as const;

export type Dict = typeof DICT;

/**
 * 获取题型的本地化标签
 * @param type - 原始题型值 ('choice' | 'fill' | 'answer')
 * @returns 本地化的题型名称
 */
export function getQuestionTypeLabel(type: string): string {
    switch (type) {
        case 'choice': return DICT.wall.choice;
        case 'fill': return DICT.wall.fill;
        case 'answer': return DICT.wall.answer;
        default: return type;
    }
}

/**
 * 格式化题号显示
 * @param number - 题号
 * @param compact - 是否使用紧凑模式（仅数字）
 * @returns 格式化的题号字符串
 */
export function formatQuestionNumber(number: number | string, compact = false): string {
    if (compact) {
        return `#${number}`;
    }
    return DICT.exam.questionIndex.replace('{number}', String(number));
}
