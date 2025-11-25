# TabularPractice 开发路线图

> 将原型打磨成产品的完整规划

## 📊 开发优先级

```
🟢 第一阶段：核心功能完善 (Core Polish) - 已完成大部分
🟡 第二阶段：数据可视化与安全 (Insights & Backup) - 已完成
🔵 第三阶段：体验增强 (UX Enhancement) - 已完成
🟣 第四阶段：架构演进 (Architecture Evolution) - 待开始
```

---

## 🟢 第一阶段：核心功能完善

### 1. ✅ 按状态筛选 (错题本逻辑) - **已完成**
**完成时间**: 2025-11-25

### 2. ✅ 题目详情页 (Modal) 增强 - **已完成**
**完成时间**: 2025-11-25

### 3. 多维度筛选增强
**优先级**: 🟡 中  
**预计工时**: 2小时

- [ ] 按题型筛选: `[选择题] [填空题] [解答题]`
- [ ] 按年份筛选: Slider 组件选择年份区间
- [ ] 收藏功能: 星标重点题目

### 4. ✅ 全局搜索 - **已完成**
**完成时间**: 2025-11-25

- [x] 安装 `cmdk` 组件库 (使用 shadcn command)
- [x] 实现 `Cmd+K` 快捷键唤起搜索框
- [x] 搜索范围: 题号、年份、知识点
- [x] 搜索结果直接跳转到题目 Modal

---

## 🟡 第二阶段：数据可视化与安全

### 5. ✅ 可视化统计看板 - **已完成**
**完成时间**: 2025-11-25

- [x] 进度环形图 (Recharts PieChart)
- [x] 解决 Hydration Mismatch 问题
- [x] 适配暗黑模式

### 6. ✅ 数据备份与恢复 - **已完成**
**完成时间**: 2025-11-25

- [x] 设置页面添加 "数据管理"
- [x] 导出 JSON (带时间戳)
- [x] 导入 JSON (带二次确认和校验)

---

## 🔵 第三阶段：体验增强

### 7. ✅ 个人笔记系统 (Personal Notes) - **已完成**
**完成时间**: 2025-11-25

- [x] Store: 添加 `notes` 状态
- [x] Modal: 添加笔记编辑/预览区域 (Markdown)
- [x] 自动保存机制 (onBlur)
- [x] Card: 显示笔记小图标
- [x] 依赖: `react-markdown`, `@tailwindcss/typography`

### 8. ✅ 暗黑模式 - **已完成**
**完成时间**: 2025-11-25

- [x] 安装 `next-themes`
- [x] Navbar 添加切换按钮
- [x] 全组件语义化颜色适配
- [ ] 实现题目/答案/解答 白底图片的自动反色或者深色遮罩


### 9. 快捷键系统
**优先级**: 🟡 中  
**预计工时**: 2小时

- [x] `Cmd/Ctrl + K` (搜索)
- [x] `← / →` (切题)
- [x] `1 / 2 / 3` (标记)
- [x] `Esc` (关闭)
- [x] `?` (显示快捷键帮助)
- [x] `[` / `]` (切换年份)

### 10. ✅ 移动端适配 - **已完成**
**完成时间**: 2025-11-25

- [x] Sidebar 改为 Sheet (抽屉式)
- [x] VerticalExamWall 在小屏幕下调整列宽
- [x] Modal 全屏显示 (移动端)
- [x] 触摸手势支持 (左右滑动切题目)

---

## 🟣 第四阶段：架构演进 (Git-based Headless CMS)

### 11. Markdown + LaTeX 渲染引擎
**优先级**: 🔥 高
**预计工时**: 2小时

- [x] 安装 `remark-math`, `rehype-katex`, `katex`
- [x] 更新 `Question` 类型 (支持 `contentMd`, `answerMd`)
- [x] 升级 `QuestionModal`: 支持混合渲染 (Markdown 优先，图片兜底)
- [x] 引入 `github-markdown-css` 或 Tailwind Typography 优化排版

### 12. 数据结构重构与懒加载
**优先级**: 🟡 中
**预计工时**: 4小时

- [x] 拆分 `questions.json` 为 `index.json` (索引) 和 `papers/*.json` (详情)
- [x] 引入 `SWR` 库进行数据请求
- [x] 实现真题墙的“骨架屏”加载状态 (SWR 自动处理 isLoading)
- [x] 实现鼠标悬停预加载 (Preload) (SWR 自动缓存)

### 13. 题库分离 (Repo Separation)
**优先级**: 🔵 低 (长期目标)

- [x] 创建独立的 `question-bank` 仓库
- [x] 配置 GitHub Pages / Raw 访问
- [x] App 支持配置自定义题库源 URL

---

## 🎯 近期优先任务 (Next Up)

1. **Markdown + LaTeX 渲染引擎**: 让题目支持数学公式 (已完成)
2. 多维度筛选 (已完成)
3. 快捷键系统完善 (已完成)

---

**最后更新**: 2025-11-25  
**当前版本**: v0.4.0-beta
