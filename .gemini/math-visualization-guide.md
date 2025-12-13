# 数学可视化系统文档

## 概述

本项目实现了一套完整的数学可视化系统，支持 2D（基于 Mafs）和 3D（基于 Three.js）两种渲染模式。该系统设计考虑了考研数学一大纲中所有可能涉及的知识点，具有良好的扩展性。

## 架构

```
src/components/question/ui/MathVisualization/
├── index.tsx                    # 导出入口
├── types.ts                     # 完整类型定义
├── MathVisualizationRenderer.tsx # 通用渲染器（自动选择 2D/3D）
│
├── [2D 组件 - Mafs]
│   ├── IntegralRegion2D.tsx     # 二重积分区域
│   └── FunctionPlot.tsx         # 函数图像
│
└── [3D 组件 - Three.js]
    ├── SurfacePlot3D.tsx        # 曲面图（极值可视化）
    ├── VectorField3D.tsx        # 向量场 + 散度可视化
    ├── ClosedSurface3D.tsx      # 闭曲面（高斯公式）
    └── Gradient3D.tsx           # 梯度向量 + 等值面
```

## 支持的可视化类型

### 2D 类型（Mafs 库）

| Type | 用途 | 适用标签 |
|------|------|---------|
| `integral-region-2d` | 二重积分区域 | `multiple-integral-calculation` |
| `function-plot` | 函数曲线 | `concavity-asymptote`, `monotonicity-extremum` |
| `vector-field-2d` | 平面向量场 | `line-integral-type2` |
| `parametric-curve-2d` | 参数曲线 | `line-integral-type1` |

### 3D 类型（Three.js 库）

| Type | 用途 | 适用标签 |
|------|------|---------|
| `surface-plot-3d` | 曲面极值 | `multivariable-extremum`, `partial-derivative` |
| `gradient-3d` | 梯度向量 | `directional-derivative` |
| `vector-field-3d` | 空间向量场 | `curl-definition`, `line-integral-type2` |
| `closed-surface-3d` | 闭曲面通量 | `surface-integral-type2` (高斯公式) |
| `parametric-surface-3d` | 参数曲面 | `surface-integral-type1` |
| `integral-region-3d` | 三重积分区域 | `multiple-integral-calculation` |

## 配置格式

### 在 `eureka.visualization` 中添加配置

```json
{
  "eureka": {
    "visualization": {
      "type": "surface-plot-3d",
      "title": "曲面标题",
      "config": {
        // 具体配置项
      }
    }
  }
}
```

### surface-plot-3d 示例

```json
{
  "type": "surface-plot-3d",
  "title": "曲面 z = e^(-y)(y+2-x²) 的极大值",
  "config": {
    "function": "exp(-y) * (y + 2 - x*x)",
    "xRange": [-2.5, 2.5],
    "yRange": [-3, 2],
    "colorScheme": "viridis",
    "opacity": 0.85,
    "showWireframe": false,
    "criticalPoints": [
      { "x": 0, "y": -1, "type": "maximum", "label": "极大值 (0,-1,e)" }
    ]
  }
}
```

### gradient-3d 示例

```json
{
  "type": "gradient-3d",
  "title": "梯度向量可视化",
  "config": {
    "function": "x*x*y + z/y",
    "point": [1, 1, 2],
    "showLevelSurface": true,
    "showGradientVector": true,
    "range": [-1, 3]
  }
}
```

### closed-surface-3d 示例

```json
{
  "type": "closed-surface-3d",
  "title": "高斯公式：闭曲面上的通量",
  "config": {
    "surface": "sphere",
    "params": { "radius": 1.2 },
    "vectorField": { "fx": "x", "fy": "y", "fz": "z" },
    "showFluxArrows": true,
    "showVolume": true
  }
}
```

### integral-region-2d 示例

```json
{
  "type": "integral-region-2d",
  "title": "积分区域 D",
  "config": {
    "xRange": [0, 1],
    "lowerBound": "x*x",
    "upperBound": "x",
    "curves": [
      { "expr": "x*x", "color": "#3b82f6", "label": "y = x²" },
      { "expr": "x", "color": "#ef4444", "label": "y = x" }
    ],
    "labels": [
      { "x": 0.5, "y": 0.4, "text": "D" }
    ]
  }
}
```

## 表达式语法

所有数学表达式使用 JavaScript 语法，支持以下函数：

```javascript
// 基本运算
x + y, x - y, x * y, x / y
x ** 2   // 或 x^2（会自动转换）

// 数学函数
sin(x), cos(x), tan(x)
exp(x), log(x), ln(x)
sqrt(x), abs(x), pow(x, n)
asin(x), acos(x), atan(x)
sinh(x), cosh(x), tanh(x)

// 常数
PI, E
```

## 颜色方案

`colorScheme` 支持以下选项：

| 值 | 效果 |
|---|---|
| `viridis` | 蓝→绿→黄（默认，适合科学可视化） |
| `plasma` | 紫→橙→黄 |
| `coolwarm` | 蓝→白→红（适合正负对比） |
| `rainbow` | 彩虹色谱 |

## 集成位置

可视化组件已集成到以下位置：

1. **EurekaPanel** (`src/components/business/Core/Eureka/EurekaPanel.tsx`)
   - 自动读取 `eureka.visualization` 配置并渲染

2. **QuestionContent** (`src/components/business/QuestionModal/QuestionContent.tsx`)
   - 在解析区域底部显示可视化

## 依赖

```json
{
  "dependencies": {
    "mafs": "^0.19.0",          // 2D 可视化
    "three": "^0.182.0",         // 3D 核心
    "@react-three/fiber": "^9.4.2",  // React 绑定
    "@react-three/drei": "^10.7.7"   // 辅助组件
  }
}
```

## 标签到可视化映射

`types.ts` 中定义了 `TAG_VISUALIZATION_MAP`，用于自动推荐适用的可视化类型：

```typescript
const TAG_VISUALIZATION_MAP: Record<string, string[]> = {
  "directional-derivative": ["gradient-3d", "surface-plot-3d"],
  "multivariable-extremum": ["surface-plot-3d"],
  "surface-integral-type2": ["closed-surface-3d", "vector-field-3d"],
  // ...
};
```

## 当前覆盖情况

### zhangyu-4-set1

| 题号 | 类型 | 可视化内容 |
|:---:|---|---|
| Q03 | `integral-region-2d` | 二重积分区域 $\{x^2 \le y \le x\}$ |
| Q11 | `gradient-3d` | 梯度向量在点 (1,1,2) 处 |
| Q12 | `function-plot` | 斜渐近线 $y = x+1$ |
| Q17 | `surface-plot-3d` | 曲面极值，标记 $(0,-1,e)$ |
| Q20 | `closed-surface-3d` | 球面通量（高斯公式） |

## 添加新可视化类型

1. 在 `types.ts` 中定义新的配置接口
2. 创建新的渲染组件（2D 用 Mafs，3D 用 Three.js）
3. 在 `MathVisualizationRenderer.tsx` 中添加类型判断分支
4. 更新 `index.tsx` 导出

## 性能优化

- 3D 组件使用 `lazy()` 懒加载，避免首屏加载 Three.js
- 使用 `useMemo` 缓存几何计算结果
- 曲面分辨率默认 50×50，可通过 `resolution` 参数调整
