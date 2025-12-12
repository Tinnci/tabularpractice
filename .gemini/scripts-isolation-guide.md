# Scripts Isolation Guide

## 现状 ✅

所有脚本（`scripts/` 目录）已经与主项目代码（`src/`）**完全隔离**，符合最佳实践。

### 当前脚本清单

| 脚本文件 | 用途 | 外部依赖 | src/ 依赖 |
|---------|------|---------|----------|
| `analyze-code.ts` | 代码质量分析 | `typescript` | ❌ 无 |
| `analyze-i18n-ast.ts` | i18n 合规检查 | `typescript` | ❌ 无 |
| `split-data.js` | 数据分割预处理 | Node.js 内置 | ❌ 无 |

---

## 隔离原则

### ✅ 允许的依赖

脚本可以安全地依赖：

1. **Node.js 内置模块**
   ```typescript
   import { readFile } from 'fs/promises';
   import { join, relative } from 'path';
   ```

2. **平台无关的 npm 包**
   ```typescript
   import * as ts from 'typescript';  // AST 解析器
   ```

3. **新创建的 shared utilities (如果未来需要)**
   ```typescript
   // 可选：创建 src/shared/ 用于平台无关的工具函数
   import { someUtil } from '../src/shared/utils';
   ```

### ❌ 禁止的依赖

脚本**不应该**依赖：

1. **React/Next.js 代码**
   ```typescript
   // ❌ 禁止
   import { SomeComponent } from '../src/components/SomeComponent';
   import { useHook } from '../src/hooks/useHook';
   ```

2. **浏览器 API 的包装器**
   ```typescript
   // ❌ 禁止
   import { localStorage } from '../src/lib/storage';
   ```

3. **包含副作用的模块**
   ```typescript
   // ❌ 禁止（如果该文件有全局副作用）
   import '../src/app/globals.css';
   ```

---

## 新脚本检查清单

在添加新脚本时，请确认：

- [ ] 脚本只使用 Node.js 环境的 API
- [ ] 不引用 `src/components/`, `src/hooks/`, `src/app/`
- [ ] 不依赖 `window`, `document` 等浏览器 API
- [ ] 不导入 CSS/图片等资源文件
- [ ] 可以在纯 Node.js/Bun 环境下独立运行

---

## 共享代码策略

如果脚本和主项目需要共享某些逻辑（如类型定义、数据验证），推荐方案：

### 方案 1: 创建 `src/shared/` 目录 ⭐ 推荐

```
src/
├── shared/           # 平台无关的共享代码
│   ├── types.ts      # 仅类型定义，无运行时代码
│   └── validators.ts # 纯函数，无浏览器依赖
├── lib/              # 浏览器环境代码
├── components/       # React 组件
└── ...
```

**规则**:
- `src/shared/` 中的文件**必须**是平台无关的
- 不得引用浏览器 API 或 React
- 脚本可以安全引用 `import ... from '../src/shared/...`

### 方案 2: Domain Layer 复用 ✅ 已实现

我们已经创建的 `src/lib/domain/statistics.ts` 就是一个很好的例子：
- ✅ 纯函数，无副作用
- ✅ 不依赖 React Hooks
- ✅ 可以在脚本中复用（如果需要）

```typescript
// scripts/generate-report.ts
import { calculateTagStats } from '../src/lib/domain/statistics';
// ✅ 安全，因为 domain 层只包含纯函数
```

### 方案 3: 独立包

对于非常核心的共享逻辑，可以考虑：
```
packages/
├── core/             # 独立的 npm 包
│   ├── package.json
│   └── src/
│       └── types.ts
└── ...
```

---

## 维护建议

1. **定期验证**
   ```bash
   # 检查是否有意外的跨边界引用
   bun run scripts/check-isolation.ts  # (可选：创建此脚本)
   ```

2. **文档化依赖**
   - 在每个脚本顶部注释其用途和依赖
   - 更新此文档当添加新脚本时

3. **CI/CD 集成**
   ```yaml
   # .github/workflows/scripts-check.yml
   - name: Verify script isolation
     run: |
       grep -r "from ['\"]\.\./src" scripts/ && exit 1 || echo "✓ Scripts are isolated"
   ```

---

## 当前状态总结

✅ **完全隔离** - 所有脚本都符合隔离原则

无需立即采取行动。保持现状，在添加新脚本时遵循本指南即可。

---

## 参考

- [TypeScript Handbook - Node](https://www.typescriptlang.org/docs/handbook/modules.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- Next.js Best Practices: Separate Build & Runtime Code
