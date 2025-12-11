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
        toggleTheme: "切换主题",
        clickToEdit: "点击可编辑",
        seconds: "秒",
        hours: "小时",
        minutes: "分钟",
        lessThanMinute: "不到1分钟",
        copiedToClipboard: "已复制到剪贴板",
        connected: "已连接",
        notConnected: "未连接",
        connectedGithub: "已连接 GitHub",
        notConfiguredToken: "未配置 Token",
        noSyncChanges: "暂无待同步修改",
        configureNow: "立即配置",
        reconfigure: "重新配置",
        builtinRepo: "内置题库",
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
        paperGroupFilter: "试卷组筛选",
        paperGroupFilterDesc: "关闭的试卷组将不会出现在练习列表中。",
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
        checkPermissions: "检查权限",
        gistSyncLabel: "Gist 同步 (多端数据同步)",
        missingGistScope: "缺少 'gist' 权限。同步功能不可用。",
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
    },

    // AI Import
    ai: {
        title: "AI 智能导题 (Beta)",
        desc: "利用 Gemini Flash 模型，一键将 PDF 试卷转换为题库数据。",
        apiKeyLabel: "Gemini API Key",
        apiKeyPlaceholder: "AIzaSy...",
        saveApiKey: "保存",
        tryDemo: "试用 Demo (无需 Key)",
        apiKeyTip: "您的 Key 仅存储在本地浏览器中，直接请求 Google API，不经过任何第三方服务器。",
        selectModel: "选择模型",
        modelPlaceholder: "选择 Gemini 模型",
        fetchModels: "获取模型",
        fetchingModels: "获取中...",
        fetchModelsTip: "点击\"获取模型\"查看您的 API Key 可用的所有模型",
        fetchFail: "获取模型列表失败，使用默认模型",
        uploadTitle: "点击或拖拽上传 PDF 文件",
        uploadDesc: "支持扫描件或电子版 PDF",
        modifyKey: "修改 Key",
        startProcess: "开始识别",
        processing: "AI 解析中...",
        successTitle: "解析成功",
        paperName: "试卷名称",
        year: "年份",
        questionCount: "题目数量",
        reupload: "重新上传",
        confirmImport: "确认导入",
        importSuccess: "成功导入 {count} 道题目",
        parseFail: "解析失败，请检查 API Key 或文件内容",
        invalidKey: "请输入有效的 API Key",
        demoLoading: "正在加载演示数据...",
        // Demo mock data
        mockPaperGroup: "AI 导入试卷组",
        mockUniversity: "未知大学",
        mockContent: "题目内容...",
        mockAnswer: "答案内容...",
        mockAnalysis: "解析内容...",
        promptRole: "你是一个专业的试卷解析助手。请分析上传的 PDF 文件，提取其中的试题信息。",
        promptGoal: "目标 JSON 结构:",
        promptRequirements: "要求：",
        req1: "自动识别试卷名称、年份（如果文件名或内容包含）。",
        req2: "尽可能提取所有题目，保持题号顺序。",
        req3: "contentMd, answerMd, analysisMd 使用 Markdown 格式。",
        req4: "如果没有答案或解析，留空或根据题目内容推断。",
        req5: "type 字段根据题目类型自动判断 ('choice', 'fill', 'answer')。",
        req6: "确保所有 ID 唯一且关联正确。",
    },

    time: {
        yearPaper: "{year}年{name}真题",
        totalTime: "历史累计",
        currentTime: "本次用时",
        clickToEdit: "点击可编辑",
        editTotalTime: "编辑累计时间",
        minute: "分",
        second: "秒",
        minuteShort: "分",
    },

    // Manage Page
    manage: {
        title: "题库管理",
        paperEditor: "试卷编辑器",
        statsDesc: "题库状态与统计信息。",
        overview: "概览",
        totalQuestions: "题目总数",
        totalPapers: "总试卷数",
        sourceCount: "源：{total} 个 (1 本地 + {remote} 远程)",
        configureTokenHint: "请在主页设置中配置 Token",
        recentEdits: "最近编辑",
        recentEditsDesc: "本地缓存中的未同步修改。",
        needLoadStats: "需要加载详情统计",
        githubConnection: "GitHub 连接",
        closeEdit: "关闭编辑",
        editQuestion: "编辑题目",
    },

    // GitHub Repository Setup
    github: {
        noToken: "未配置 GitHub Token",
        tokenInvalid: "Token 无效或已过期",
        missingRepoScope: "当前 Token 缺少 'repo' 权限。",
        enterToken: "请输入 GitHub Token",
        tokenVerified: "Token 验证成功！",
        tokenVerifyFailed: "Token 验证失败",
        checkingConfig: "正在检查现有配置...",
        openTokenPage: "打开 GitHub Token 创建页面",
        fillTokenInfo: "填写 Token 信息",
        tokenNote: "TabularPractice 题库编辑",
        selectPermissions: "勾选必要的权限",
        clickGenerate: "点击",
        copyToken: "并复制生成的 Token",
        editInDetail: "• 在题目详情页点击「编辑」按钮",
        saveAndSync: "• 点击「保存并同步」将更改推送到 GitHub",
        configSuccess: "配置成功！现在可以同步题目到远程仓库了",
        configRepoPermission: "配置 GitHub 仓库编辑权限",
        configRepoPermissionDesc: "要编辑并同步题目到远程仓库，需要配置具有",
        permission: "权限的 GitHub Token",
        tokenCreated: "已创建好 Token",
    },

    // Question Editor
    editor: {
        type: "题型",
        choiceType: "选择题",
        answerType: "解答题",
        answerShort: "答案 (简答)",
        answerPlaceholder: "如：A、B、C、D 或 数值",
        addTag: "添加标签...",
        contentPlaceholder: "题目内容 (支持 Markdown 和 LaTeX)...",
        answerDetailPlaceholder: "详细答案 (支持 Markdown 和 LaTeX)...",
        analysisPlaceholder: "解析 (支持 Markdown 和 LaTeX)...",
        questionPreview: "题目预览:",
        analysisPreview: "解析预览:",
        closeEdit: "关闭编辑",
        editQuestion: "编辑题目",
        savedLocal: "编辑已保存（本地）",
        configTokenForSync: "配置 GitHub Token 后可同步到远程",
        tokenInsufficient: "Token 权限不足",
        cannotSyncRemote: "无法同步到远程",
        noRemoteRepoInfo: "该题目没有关联的远程仓库信息",
        cannotParseRepo: "无法解析仓库信息",
        invalidRepoUrl: "无效的仓库 URL: {url}",
        syncingToRemote: "正在同步到远程仓库...",
        syncSuccess: "已成功同步到 GitHub ({sha})",
        syncFailed: "同步失败: {error}",
        saveFailed: "保存失败",
        updateQuestion: "chore: 更新题目 {id}",
    },

    // Knowledge Planet
    planet: {
        critical: "急需巩固 (Critical)",
        mastered: "已掌握 (Mastered)",
        sizeByCount: "大小表示题量",
        reset: "归中 (Reset)",
        zoomIn: "放大 (Zoom In)",
        zoomOut: "缩小 (Zoom Out)",
        fitToView: "适应视图 (Fit to View)",
    },

    // Knowledge Graph/Planet
    knowledge: {
        title: "知识图谱",
        selectSubject: "选择学科",
        advancedMath: "高等数学",
        linearAlgebra: "线性代数",
        probability: "概率统计",
        clickToPractice: "点击开始练习进入该知识点的专项练习。",
        startPractice: "开始练习",
        cancelSelection: "取消选择",
        legend: "图例:",
        masteredWell: "掌握良好",
        needReview: "需要复习",
        weakPoint: "薄弱环节",
        notStarted: "未开始",
        loadingPlanet: "Loading Knowledge Planet...",
        planetDesc: "Visualize your knowledge galaxy. Select nodes to generate a customized practice session.",
        configuration: "Configuration",
        startWithCount: "Start ({count})",
        typeLabel: "Type",
    },

    // Eureka Panel (Insight Prompts)
    eureka: {
        title: "顿悟时刻 (Eureka)",
        toggleEureka: "顿悟",

        // Strategy Categories
        representation: "1. 表征重构 (Representation)",
        representationDesc: "试着打破你对题目第一眼的'固有印象'。",
        representationQ1: "如果我不按现在的顺序做，还有别的路吗？(例如：交换积分次序)",
        representationQ2: "把这个复杂的式子拆开看(Chunking)，或者合起来看？",
        representationQ3: "回到定义去！(Regression to Axioms) 它的原始定义是什么？",

        functionalFixedness: "2. 功能变通 (Functional Fixedness)",
        functionalFixednessDesc: "这个东西除了它该有的样子，还能是什么？",
        functionalFixednessQ1: "这个常数能不能看作是变量？(例如：把 1 看作 x^0)",
        functionalFixednessQ2: "这个变量能不能看作是常数？(例如：对x求导时y是常数)",
        functionalFixednessQ3: "这个几何图形能不能动起来？",

        constraintRelaxation: "3. 约束松绑 (Constraint Relaxation)",
        constraintRelaxationDesc: "你是不是自己给自己加了条条框框？",
        constraintRelaxationQ1: "题目真的说了它是实数吗？也许是复数？矩阵？",
        constraintRelaxationQ2: "你是否默认了图形是规则的？(例如：默认三角形是直角)",
        constraintRelaxationQ3: "如果把条件去掉一个，结论还成立吗？",

        analogy: "4. 类比迁移 (Analogy)",
        analogyDesc: "这道题长得像谁？",
        analogyQ1: "它像不像你做过的某道经典例题？",
        analogyQ2: "它的结构(Structure)和什么定理解释得通？",
        analogyQ3: "如果把问题简化(比如n=1, n=2)，规律是什么？",

        // Interactive Features
        perspectiveSwitch: "换个视角看变量",
        currentView: "当前看法:",
        suggestView: "建议看作:",
        tryThis: "💡 试试:",
        viewKeyInsight: "查看关键洞察",

        // Incubation
        incubation: "孵化期 (Incubation)",
        incubationDesc: "卡住超过 5 分钟？也许该停下来。让潜意识接管工作，先做下一题。",
        imStuck: "我卡住了 (开始计时)",
        timeUp: "⏰ 时间到！请立即跳过此题！",
        cancelTimer: "取消计时",

        // General Strategies
        generalStrategies: "通用思维破局策略",

        // Placeholder labels for aria/accessibility
        toggleVideo: "Toggle video",
        toggleAnswer: "Toggle answer",
        toggleAnalysis: "Toggle analysis",
        toggleNote: "Toggle note",
        toggleDraft: "Toggle draft",
    },

    // GitHub Setup Guide
    githubSetup: {
        createToken: "📝 创建新的 GitHub Token",
        goToGithub: "前往 GitHub 创建 Token",
        expiration: "Expiration:",
        expirationDays: "90 days",
        mustCheck: "必须勾选：",
        repoScope: "☑ repo",
        fullRepoAccess: "(完整的仓库访问权限)",
        privateTip: "💡 如果你的题库仓库是私有的，必须勾选完整的",
        permission: "权限",
        tokenWarning: "⚠️ Token 只会显示一次，请务必保存！",
        generateToken: "Generate token",
        nextStep: "📚 下一步",
        personalAccessToken: "GitHub Personal Access Token",
    },

    // Misc UI Elements
    ui: {
        questionContent: "Question Content",
        analysis: "Analysis",
        answer: "Answer",
        searchTopics: "Search topics...",
        noTopicsFound: "No topics found.",
        wallView: "Wall View",
        gridView: "Grid View",
        close: "Close",
        tabularPractice: "Tabular Practice",
        toggleTheme: "Toggle theme",
        writable: "Writable",
        unknown: "Unknown",
        fork: "Fork",
        checkAccess: "Check Access",
        year: "年",
        noData: "暂无",
        completed: "已完成",
        total: "/ 共",
        questions: "题",
        geminiApiKey: "Gemini API Key",
    },

    // AI Settings
    aiSettings: {
        title: "AI 功能配置",
        desc: "配置 Gemini API Key 以启用 AI 辅助功能（题目导入、智能提示、适应性测验等）",
        apiKeyRequired: "API Key 不能为空",
        apiKeySaved: "Gemini API Key 已保存",
        apiKeyRemoved: "API Key 已移除",
        save: "保存",
        apiKeyConfigured: "✓ API Key 已配置",
        remove: "移除",
        getApiKey: "获取 Gemini API Key",
        enabledFeatures: "已启用的 AI 功能:",
        feature1: "AI 智能题目导入（PDF → 结构化数据）",
        feature2: "AI 辅助生成顿悟提示",
        feature3: "适应性测验（即将推出）",
        feature4: "知识图谱自动构建（即将推出）",
    },

    // Data Management
    dataManagement: {
        recordCount: "记录数:",
        sourceCount: "题库源:",
    },

    // Service Error Messages
    errors: {
        fileNotFound: "文件不存在: {path}",
        fetchFailed: "获取文件失败: {error}",
        updateFailed: "更新文件失败: {error}",
        fileConflict: "文件已被其他人修改，请刷新后重试",
    },

    // Misc Page Elements
    pages: {
        notFoundTitle: "Page Not Found",
        notFoundDesc: "抱歉，我们找不到您要访问的页面。它可能已被移动或不存在。",
        backToHome: "返回首页",
        manageInDev: "正在开发中... (Paper ID:",
        manageNextStep: "下一步计划：在此处显示题目列表表格，支持批量编辑、拖拽排序和快速预览。",
        noQuestions: "还没有添加任何题目",
        reviewStart: "开始复习",
        specialTopic: "专项",
        questionsCount: "题)",
    },

    // Sidebar
    sidebar: {
        completedProgress: "已完成",
        totalProgress: "/ 共",
        questionUnit: "题",
    },

    // Store defaults
    store: {
        defaultRepoName: "题库1 (GitHub)",
    },

    // Subject Config
    subjects: {
        math: "数学",
        english: "英语",
        politics: "政治",
        cs: "计算机统考",
        major: "专业课",
        art: "艺术概论",
        other: "其他",
        unified: "统考科目",
        selfProposed: "自命题/模拟卷",
    },

    // Sync Toast Messages
    syncToast: {
        conflictResolved: "冲突已解决",
        dataSynced: "数据已同步",
        syncFailed: "同步失败",
        uploadError: "上传数据时出错",
        syncSuccess: "同步成功",
        dataSyncedToGist: "数据已安全同步到 Gist",
        checkNetworkOrToken: "请检查网络或 Token 设置",
        builtinRepo: "内置题库",
        markedAs: "已标记为 {label}",
        savedLocally: "编辑已保存（本地）",
        configureTokenDesc: "配置 GitHub Token 后可同步到远程",
        configureNow: "立即配置",
        tokenNoPermission: "Token 权限不足",
        reconfigure: "重新配置",
        noRepoInfo: "该题目没有关联的远程仓库信息",
        parseRepoFailed: "无法解析仓库信息",
        invalidRepoUrl: "无效的仓库 URL",
        syncing: "正在同步到远程仓库...",
        saveFailed: "保存失败",
        configSuccess: "配置成功！现在可以同步题目到远程仓库了",
    },



    // App metadata
    app: {
        title: "TabularPractice | 真题墙",
        description: "一个真题刷题系统",
    },
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
