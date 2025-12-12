// src/data/subject-tags.ts

// 定义知识点节点类型
export type TagNode = {
    id: string;
    label: string;
    children?: TagNode[];
};

// 数学知识点 (完整的考研数学大纲)
const mathTags: TagNode[] = [
    {
        id: "advanced-math",
        label: "高等数学",
        children: [
            {
                id: "limit-continuity",
                label: "函数、极限、连续",
                children: [
                    { id: "sequence-convergence", label: "数列敛散性的判定" },
                    { id: "limit-calculation", label: "函数极限的计算" },
                    { id: "limit-parameter", label: "确定极限中的参数" },
                    { id: "infinitesimal-comparison", label: "无穷小量的比较" },
                    { id: "function-continuity", label: "函数的连续性" }
                ]
            },
            {
                id: "differential-calculus",
                label: "一元函数微分学",
                children: [
                    { id: "derivative-concept", label: "导数与微分的概念" },
                    { id: "derivative-calculation", label: "导数与微分的计算" },
                    { id: "derivative-geometry", label: "导数的几何意义" },
                    { id: "monotonicity-extremum", label: "函数的单调性、极值与最值" },
                    { id: "concavity-asymptote", label: "曲线的凹凸性、拐点及渐近线" },
                    { id: "equation-roots", label: "方程根的存在性与个数" },
                    { id: "inequality-proof", label: "不等式的证明" },
                    { id: "mean-value-theorem", label: "微分中值定理" },
                    { id: "taylor-formula", label: "泰勒公式" }
                ]
            },
            {
                id: "integral-calculus",
                label: "一元函数积分学",
                children: [
                    { id: "indefinite-integral", label: "不定积分的计算" },
                    { id: "definite-integral-concept", label: "定积分的概念、性质及几何意义" },
                    { id: "definite-integral-calculation", label: "定积分的计算" },
                    { id: "variable-limit-integral", label: "变限积分" },
                    { id: "improper-integral", label: "反常积分的计算与敛散性" },
                    { id: "definite-integral-application", label: "定积分的应用" }
                ]
            },
            {
                id: "multivariable-differential",
                label: "多元函数微分学",
                children: [
                    { id: "partial-derivative", label: "偏导数的概念与计算" },
                    { id: "total-differential", label: "全微分的概念与计算" },
                    { id: "multivariable-geometry", label: "多元函数微分学的几何应用" },
                    { id: "directional-derivative", label: "方向导数和梯度" },
                    { id: "multivariable-extremum", label: "多元函数的极值问题" }
                ]
            },
            {
                id: "multivariable-integral",
                label: "多元函数积分学",
                children: [
                    { id: "multiple-integral-concept", label: "重积分的概念与性质" },
                    { id: "integral-order-transform", label: "交换积分次序与坐标系之间的转化" },
                    { id: "multiple-integral-calculation", label: "重积分的计算" },
                    { id: "multiple-integral-application", label: "重积分的应用" },
                    { id: "line-integral-type1", label: "第一类曲线积分" },
                    { id: "line-integral-type2", label: "第二类曲线积分" },
                    { id: "surface-integral-type1", label: "第一类曲面积分" },
                    { id: "surface-integral-type2", label: "第二类曲面积分" },
                    { id: "curl-definition", label: "旋度的定义" }
                ]
            },
            {
                id: "infinite-series",
                label: "无穷级数",
                children: [
                    { id: "series-convergence", label: "常数项级数敛散性的判定" },
                    { id: "power-series-radius", label: "求幂级数的收敛半径、收敛区间和收敛域" },
                    { id: "power-series-sum", label: "幂级数的和函数及幂级数展开式" },
                    { id: "fourier-series", label: "傅里叶级数" }
                ]
            },
            {
                id: "differential-equation",
                label: "常微分方程",
                children: [
                    { id: "linear-solution-structure", label: "线性微分方程的解的结构" },
                    { id: "separable-homogeneous", label: "可分离变量的微分方程与齐次方程" },
                    { id: "first-order-nonhomogeneous", label: "一阶非齐次线性微分方程" },
                    { id: "constant-coefficient-homogeneous", label: "常系数齐次线性微分方程" },
                    { id: "constant-coefficient-nonhomogeneous", label: "常系数非齐次线性微分方程" },
                    { id: "other-equations", label: "其他方程" },
                    { id: "differential-equation-application", label: "微分方程的应用" }
                ]
            }
        ]
    },
    {
        id: "linear-algebra",
        label: "线性代数",
        children: [
            { id: "determinant", label: "行列式", children: [] },
            {
                id: "matrix",
                label: "矩阵",
                children: [
                    { id: "matrix-operation", label: "矩阵的运算与变换" },
                    { id: "adjoint-inverse", label: "伴随矩阵与可逆矩阵" },
                    { id: "matrix-rank", label: "矩阵的秩" }
                ]
            },
            {
                id: "vector",
                label: "向量",
                children: [
                    { id: "linear-dependence", label: "向量组的线性相关性" },
                    { id: "linear-representation", label: "向量组之间的线性表示" },
                    { id: "inner-product", label: "向量内积与向量正交" }
                ]
            },
            { id: "linear-system", label: "线性方程组", children: [] },
            {
                id: "eigenvalue",
                label: "矩阵的特征值与特征向量",
                children: [
                    { id: "eigenvalue-eigenvector", label: "特征值与特征向量" },
                    { id: "matrix-diagonalization", label: "矩阵的相似与相似对角化" }
                ]
            },
            { id: "quadratic-form", label: "二次型", children: [] }
        ]
    },
    {
        id: "probability-statistics",
        label: "概率论与数理统计",
        children: [
            { id: "random-event", label: "随机事件和概率", children: [] },
            { id: "random-variable", label: "随机变量及其分布", children: [] },
            {
                id: "multidimensional-variable",
                label: "多维随机变量及其分布",
                children: [
                    { id: "two-dimensional-variable", label: "二维随机变量及其分布" },
                    { id: "marginal-conditional", label: "边缘分布和条件分布" }
                ]
            },
            {
                id: "numerical-characteristics",
                label: "随机变量的数字特征",
                children: [
                    { id: "expectation-variance", label: "数学期望与方差" },
                    { id: "covariance-correlation", label: "协方差与相关系数" }
                ]
            },
            { id: "law-of-large-numbers", label: "大数定律和中心极限定理", children: [] },
            { id: "statistics-basic", label: "数理统计的基本概念", children: [] },
            {
                id: "parameter-estimation",
                label: "参数估计与假设检验",
                children: [
                    { id: "estimator-unbiased", label: "估计量的无偏性" },
                    { id: "estimation-methods", label: "矩估计和最大似然估计" },
                    { id: "confidence-interval", label: "区间估计和置信区间" },
                    { id: "hypothesis-testing", label: "假设检验" }
                ]
            }
        ]
    }
];

// 英语知识点
const englishTags: TagNode[] = [
    {
        id: "vocabulary-grammar",
        label: "词汇与语法",
        children: [
            { id: "core-vocabulary", label: "核心词汇" },
            { id: "long-difficult-sentences", label: "长难句分析" },
            { id: "grammar-rules", label: "语法规则" }
        ]
    },
    {
        id: "reading-comprehension",
        label: "阅读理解",
        children: [
            { id: "reading-part-a", label: "传统阅读 (Part A)" },
            { id: "reading-part-b", label: "新题型 (Part B)" },
            { id: "reading-part-c", label: "翻译 (Part C)" }
        ]
    },
    {
        id: "cloze-test",
        label: "完形填空",
        children: []
    },
    {
        id: "writing",
        label: "写作",
        children: [
            { id: "writing-small", label: "小作文 (应用文)" },
            { id: "writing-big", label: "大作文 (图画/图表)" }
        ]
    }
];

// 政治知识点
const politicsTags: TagNode[] = [
    {
        id: "marxism",
        label: "马克思主义基本原理",
        children: [
            { id: "marx-philosophy", label: "马克思主义哲学" },
            { id: "marx-economy", label: "政治经济学" },
            { id: "scientific-socialism", label: "科学社会主义" }
        ]
    },
    {
        id: "mao-theory",
        label: "毛泽东思想和中国特色社会主义",
        children: [
            { id: "mao-thought", label: "毛泽东思想" },
            { id: "socialism-theory", label: "中国特色社会主义理论体系" }
        ]
    },
    {
        id: "modern-history",
        label: "中国近现代史纲要",
        children: [
            { id: "modern-china", label: "近代中国的基本国情" },
            { id: "revolution-road", label: "革命道路探索" }
        ]
    },
    {
        id: "morality-law",
        label: "思想道德与法治",
        children: [
            { id: "moral-cultivation", label: "道德修养" },
            { id: "legal-foundation", label: "法律基础" }
        ]
    },
    {
        id: "current-affairs",
        label: "形势与政策",
        children: []
    }
];

// 导入遗留的拼音 ID 映射
import { getSubjectKey } from '@/lib/subjectConfig';

// 导出映射关系
export const SUBJECT_TAGS_MAP: Record<string, TagNode[]> = {
    math: mathTags,
    english: englishTags,
    politics: politicsTags
};

/**
 * 获取科目的知识点树
 * @param groupIdOrSubjectKey - 可以是 PaperGroup.id 或直接的 subjectKey
 */
export function getTagsForSubject(groupIdOrSubjectKey: string): TagNode[] {
    const subjectKey = getSubjectKey(groupIdOrSubjectKey);
    return SUBJECT_TAGS_MAP[subjectKey] || [];
}

/**
 * 将标签树扁平化为 Map<id, label>
 * 用于快速查找标签的显示名称
 */
export function flattenTagTree(nodes: TagNode[]): Map<string, string> {
    const map = new Map<string, string>();

    const traverse = (nodeList: TagNode[]) => {
        nodeList.forEach(node => {
            map.set(node.id, node.label);
            if (node.children) {
                traverse(node.children);
            }
        });
    };

    traverse(nodes);
    return map;
}

// 预计算的全局标签 ID -> Label 映射（懒加载）
let _globalTagMap: Map<string, string> | null = null;

/**
 * 获取标签的显示名称
 * 
 * @param tagId - 标签 ID
 * @returns 标签的中文名称，如果找不到则返回原 ID
 */
export function getTagLabel(tagId: string): string {
    // 懒加载全局标签映射
    if (!_globalTagMap) {
        _globalTagMap = new Map<string, string>();

        // 1. 遍历所有科目的标签树
        Object.values(SUBJECT_TAGS_MAP).forEach(tags => {
            const flattened = flattenTagTree(tags);
            flattened.forEach((label, id) => {
                _globalTagMap!.set(id, label);
            });
        });
    }

    return _globalTagMap.get(tagId) || tagId;
}

/**
 * 获取全局标签 ID -> Label 映射
 * 用于批量查询场景
 */
export function getGlobalTagMap(): Map<string, string> {
    // 触发懒加载
    getTagLabel('');
    return _globalTagMap!;
}

/**
 * 标准化标签 ID
 * (已弃用拼音 ID 支持，直接返回原 ID)
 */
export function normalizeTagId(tagId: string): string {
    return tagId;
}

