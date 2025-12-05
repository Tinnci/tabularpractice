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
        theme: "外观",
        themeLight: "浅色",
        themeDark: "深色",
        themeSystem: "系统",
        data: "数据管理",
        sync: "数据同步",
        syncDesc: "配置 GitHub Gist 进行多端同步。",
        token: "GitHub Token",
        gistId: "Gist ID",
        repo: "题库源",
        repoDesc: "配置题目数据的来源。",
        addRepo: "添加源",
        export: "导出数据",
        import: "导入数据",
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
