# TabularPractice 开发路线图

> 将原型打磨成产品的完整规划

## 📊 开发优先级

```
🟢 第一阶段：核心功能完善 (Core Polish) - 立即开始
🟡 第二阶段：数据可视化与安全 (Insights & Backup) - 2周内
🔵 第三阶段：体验增强 (UX Enhancement) - 1个月内
```

---

## 🟢 第一阶段：核心功能完善

### 1. ✅ 按状态筛选 (错题本逻辑) - **已完成**
**优先级**: 🔥 最高  
**完成时间**: 2025-11-25

**功能点**:
- [x] 顶部工具栏添加 ToggleGroup: `[全部] [未做] [熟练] [不熟] [不会]`
- [x] Store 增加 `filterStatus` 状态
- [x] 筛选逻辑整合
- [x] 空状态处理 (如错题本为空时显示激励信息)

---

### 2. ✅ 题目详情页 (Modal) 增强 - **已完成**
**优先级**: 🔥 高  
**完成时间**: 2025-11-25

#### 2.1 ✅ 视频嵌入
- [x] 在 Question 类型中添加 `videoUrl`, `contentImg`, `answerImg`, `analysisImg` 字段
- [x] Modal 中添加 Tabs: `[题目] [答案] [解析] [视频]`
- [x] 支持 B站 iframe 嵌入 (带时间戳: `?t=120`)
- [x] 优化：仅当切换到视频 Tab 时才加载 iframe (性能优化)
- [x] 工具函数 `getBilibiliEmbed` 自动转换链接

#### 2.2 ✅ 解析/答案遮罩交互
- [x] Tabs 天然防剧透，默认打开"题目"
- [x] 用户需主动点击才能看到答案和解析

#### 2.3 上一题/下一题导航
- [ ] Modal 底部添加 `← 上一题` `下一题 →` 按钮
- [ ] 根据当前筛选结果计算上下题
- [ ] 快捷键支持: Arrow Left/Right

---

### 3. 多维度筛选增强
**优先级**: 🟡 中  
**预计工时**: 2小时

- [ ] 按题型筛选: `[选择题] [填空题] [解答题]`
- [ ] 按年份筛选: Slider 组件选择年份区间
- [ ] 收藏功能: 星标重点题目

---

### 4. 全局搜索
**优先级**: 🟡 中  
**预计工时**: 3小时

- [ ] 安装 `cmdk` 组件库
- [ ] 实现 `Cmd+K` 快捷键唤起搜索框
- [ ] 搜索范围:
  - 题号 (e.g., "2023-1")
  - 知识点名称
  - (后期) OCR识别的题目文字内容
- [ ] 搜索结果直接跳转到题目 Modal

---

## 🟡 第二阶段：数据可视化与安全

### 5. 可视化统计看板
**优先级**: 🟡 中  
**预计工时**: 4-5小时

#### 5.1 Dashboard 页面
创建 `/dashboard` 路由或首页折叠面板

**组件清单**:
- [ ] 进度环形图 (Recharts PieChart)
  - 已做 / 未做
  - 熟练 / 不熟 / 不会 占比
- [ ] 知识点雷达图
  - 各章节完成度对比
- [ ] 时间线图表
  - 每日刷题数量趋势

#### 5.2 复习提醒 (Smart Review)
- [ ] 根据艾宾浩斯遗忘曲线计算应复习题目
- [ ] 在 Dashboard 顶部显示"today's review"卡片
- [ ] 点击卡片直接跳转到该题目

**算法示例**:
```typescript
// 复习间隔: 1天, 3天, 7天, 14天, 30天
const shouldReview = (lastReviewTime: Date, reviewCount: number) => {
  const intervals = [1, 3, 7, 14, 30];
  const daysSince = (Date.now() - lastReviewTime.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= intervals[Math.min(reviewCount, 4)];
};
```

---

### 6. 数据备份与恢复
**优先级**: 🔥 高 (数据安全)  
**预计工时**: 2小时

#### 6.1 本地导入/导出
- [ ] 设置页面添加 "导出进度" 按钮
- [ ] 生成 `tabularpractice-backup-{date}.json`
- [ ] 支持拖拽上传 JSON 恢复数据
- [ ] 数据校验 (版本兼容性检查)

#### 6.2 云同步 (无后端方案)
**优先级**: 🟢 低 (nice-to-have)

**方案 A: GitHub Gist**
- [ ] 用户授权 GitHub 登录
- [ ] 将 progress 存储到私有 Gist
- [ ] 多设备自动同步

**方案 B: WebDAV**
- [ ] 支持连接坚果云/Nextcloud
- [ ] 手动触发同步

---

## 🔵 第三阶段：体验增强

### 7. 个人笔记系统
**优先级**: 🟡 中  
**预计工时**: 3小时

- [ ] Question Modal 添加 "笔记" Tab
- [ ] 集成 Markdown 编辑器 (react-markdown + @uiw/react-md-editor)
- [ ] 笔记与题目ID绑定，存储在 LocalStorage
- [ ] 笔记搜索集成到全局搜索

**数据结构**:
```typescript
notes: Record<string, {
  content: string;        // Markdown 内容
  createdAt: Date;
  updatedAt: Date;
}>
```

---

### 8. 暗黑模式
**优先级**: 🟢 低  
**预计工时**: 2小时

- [ ] 安装 `next-themes`
- [ ] 顶部 Navbar 添加主题切换按钮
- [ ] 适配所有组件的暗色样式 (Shadcn UI 原生支持)
- [ ] 真题墙背景渐变优化 (暗色下更护眼)

---

### 9. 快捷键系统
**优先级**: 🟡 中  
**预计工时**: 2小时

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + K` | 打开全局搜索 |
| `← / →` | Modal 内切换题目 |
| `1 / 2 / 3` | 快速标记状态 |
| `Esc` | 关闭 Modal |
| `Space` | 显示/隐藏解析 |

**实现**: 使用 `react-hotkeys-hook` 库

---

### 10. 移动端适配
**优先级**: 🟢 低  
**预计工时**: 4小时

- [ ] Sidebar 改为 Sheet (抽屉式)
- [ ] VerticalExamWall 在小屏幕下调整列宽
- [ ] Modal 全屏显示 (移动端)
- [ ] 触摸手势支持 (左右滑动切题目)

---

## 🎯 近期优先任务 (本周)

1. ✅ **立即完成**: 按状态筛选 (错题本)
2. 题目 Modal 增强 (视频 + 上下题导航)
3. 数据导出/导入功能

---

## 📦 依赖安装清单

```bash
# 图表库
npm install recharts

# Markdown 编辑器
npm install react-markdown @uiw/react-md-editor

# 全局搜索
npm install cmdk

# 快捷键
npm install react-hotkeys-hook

# 主题
npm install next-themes
```

---

## 🔄 迭代节奏

**Sprint 1 (Week 1-2)**: 核心功能 1-4  
**Sprint 2 (Week 3-4)**: 数据可视化 5-6  
**Sprint 3 (Week 5-6)**: 体验增强 7-10  

---

**最后更新**: 2025-11-25  
**当前版本**: v0.2.0-alpha
