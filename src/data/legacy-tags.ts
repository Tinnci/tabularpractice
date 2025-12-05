// 这是一个遗留的拼音 ID 到标准英语 ID 的映射表
// 用于兼容使用拼音 ID 的旧数据（如 zhangyu 系列试卷）
export const PINYIN_TO_ID_MAP: Record<string, string> = {
    // === 高等数学 ===
    "gao-deng-shu-xue": "advanced-math",

    // 函数、极限、连续
    "han-shu-ji-xian-lian-xu": "limit-continuity",
    "shu-lie-lian-san-xing-de-pan-ding": "sequence-convergence",
    "han-shu-ji-xian-de-ji-suan": "limit-calculation",
    "que-ding-ji-xian-zhong-de-can-shu": "limit-parameter",
    "wu-qiong-xiao-liang-de-bi-jiao": "infinitesimal-comparison",
    "han-shu-de-lian-xu-xing": "function-continuity",
    "han-shu-de-qi-ou-xing-yu-zhou-qi-xing": "function-continuity", // 暂映射到连续性或归类于函数性质

    // 一元函数微分学
    "yi-yuan-han-shu-wei-fen-xue": "differential-calculus",
    "dao-shu-yu-wei-fen-de-gai-nian": "derivative-concept",
    "dao-shu-yu-wei-fen-de-ji-suan": "derivative-calculation",
    "dao-shu-de-ji-he-yi-yi": "derivative-geometry",
    "han-shu-de-dan-diao-xing-ji-zhi-yu-zui-zhi": "monotonicity-extremum",
    "qu-xian-de-ao-tu-xing-guai-dian-ji-jian-jin-xian": "concavity-asymptote",
    "fang-cheng-gen-de-cun-zai-xing-yu-ge-shu": "equation-roots",
    "bu-deng-shi-de-zheng-ming": "inequality-proof",
    "wei-fen-zhong-zhi-ding-li": "mean-value-theorem",
    "tai-le-gong-shi": "taylor-formula",

    // 一元函数积分学
    "yi-yuan-han-shu-ji-fen-xue": "integral-calculus",
    "bu-ding-ji-fen-de-ji-suan": "indefinite-integral",
    "ding-ji-fen-de-gai-nian-xing-zhi-ji-ji-he-yi-yi": "definite-integral-concept",
    "ding-ji-fen-de-ji-suan": "definite-integral-calculation",
    "bian-xian-ji-fen": "variable-limit-integral",
    "fan-chang-ji-fen-de-ji-suan-yu-lian-san-xing": "improper-integral",
    "ding-ji-fen-de-ying-yong": "definite-integral-application",

    // 多元函数微分学
    "duo-yuan-han-shu-wei-fen-xue": "multivariable-differential",
    "pian-dao-shu-de-gai-nian-yu-ji-suan": "partial-derivative",
    "quan-wei-fen-de-gai-nian-yu-ji-suan": "total-differential",
    "duo-yuan-han-shu-wei-fen-xue-de-ji-he-ying-yong": "multivariable-geometry",
    "fang-xiang-dao-shu-he-ti-du": "directional-derivative",
    "duo-yuan-han-shu-de-ji-zhi-wen-ti": "multivariable-extremum",

    // 多元函数积分学
    "duo-yuan-han-shu-ji-fen-xue": "multivariable-integral",
    "zhong-ji-fen-de-gai-nian-yu-xing-zhi": "multiple-integral-concept",
    "jiao-huan-ji-fen-ci-xu-yu-zuo-biao-xi-zhi-jian-de-zhuan-hua": "integral-order-transform",
    "zhong-ji-fen-de-ji-suan": "multiple-integral-calculation",
    "zhong-ji-fen-de-ying-yong": "multiple-integral-application",
    "di-yi-lei-qu-xian-ji-fen": "line-integral-type1",
    "di-er-lei-qu-xian-ji-fen": "line-integral-type2",
    "di-yi-lei-qu-mian-ji-fen": "surface-integral-type1",
    "di-er-lei-qu-mian-ji-fen": "surface-integral-type2",
    "xuan-du-de-ding-yi": "curl-definition",
    "gao-si-gong-shi": "multiple-integral-application",

    // 无穷级数
    "wu-qiong-ji-shu": "infinite-series",
    "chang-shu-xiang-ji-shu-lian-san-xing-de-pan-ding": "series-convergence",
    "qiu-mi-ji-shu-de-shou-lian-ban-jing-shou-lian-qu-jian-he-shou-lian-yu": "power-series-radius",
    "mi-ji-shu-de-he-han-shu-ji-mi-ji-shu-zhan-kai-shi": "power-series-sum",
    "fu-li-ye-ji-shu": "fourier-series",

    // 常微分方程
    "chang-wei-fen-fang-cheng": "differential-equation",
    "xian-xing-wei-fen-fang-cheng-de-jie-de-jie-gou": "linear-solution-structure",
    "ke-fen-li-bian-liang-de-wei-fen-fang-cheng-yu-qi-ci-fang-cheng": "separable-homogeneous",
    "yi-jie-fei-qi-ci-xian-xing-wei-fen-fang-cheng": "first-order-nonhomogeneous",
    "chang-xi-shu-qi-ci-xian-xing-wei-fen-fang-cheng": "constant-coefficient-homogeneous",
    "chang-xi-shu-fei-qi-ci-xian-xing-wei-fen-fang-cheng": "constant-coefficient-nonhomogeneous",
    "qi-ta-fang-cheng": "other-equations",
    "wei-fen-fang-cheng-de-ying-yong": "differential-equation-application",
    "quan-wei-fen-fang-cheng": "total-differential", // 有时也被归在这里

    // === 线性代数 ===
    "xian-xing-dai-shu": "linear-algebra",
    "xing-lie-shi": "determinant",
    "ju-zhen": "matrix",
    "ju-zhen-de-yun-suan-yu-bian-huan": "matrix-operation",
    "ban-sui-ju-zhen-yu-ke-ni-ju-zhen": "adjoint-inverse",
    "ju-zhen-de-zhi": "matrix-rank",
    "xiang-liang": "vector",
    "xiang-liang-zu-de-xian-xing-xiang-guan-xing": "linear-dependence",
    "xiang-liang-zu-zhi-jian-de-xian-xing-biao-shi": "linear-representation",
    "xiang-liang-nei-ji-yu-xiang-liang-zheng-jiao": "inner-product",
    "xian-xing-fang-cheng-zu": "linear-system",
    "xian-xing-dai-shuxian-xing-fang-cheng-zu": "linear-system", // 容错处理
    "ju-zhen-de-te-zheng-zhi-yu-te-zheng-xiang-liang": "eigenvalue",
    "te-zheng-zhi-yu-te-zheng-xiang-liang": "eigenvalue-eigenvector",
    "ju-zhen-de-xiang-si-yu-xiang-si-dui-jiao-hua": "matrix-diagonalization",
    "er-ci-xing": "quadratic-form",

    // === 概率论 ===
    "gai-lv-lun-yu-shu-li-tong-ji": "probability-statistics",
    "sui-ji-shi-jian-he-gai-lv": "random-event",
    "sui-ji-bian-liang-ji-qi-fen-bu": "random-variable",
    "duo-wei-sui-ji-bian-liang-ji-qi-fen-bu": "multidimensional-variable",
    "er-wei-sui-ji-bian-liang-ji-qi-fen-bu": "two-dimensional-variable",
    "bian-yuan-fen-bu-he-tiao-jian-fen-bu": "marginal-conditional",
    "sui-ji-bian-liang-de-shu-zi-te-zheng": "numerical-characteristics",
    "shu-xue-qi-wang-yu-fang-cha": "expectation-variance",
    "xie-fang-cha-yu-xiang-guan-xi-shu": "covariance-correlation",
    "da-shu-ding-lv-he-zhong-xin-ji-xian-ding-li": "law-of-large-numbers",
    "shu-li-tong-ji-de-ji-ben-gai-nian": "statistics-basic",
    "can-shu-gu-ji-yu-jia-she-jian-yan": "parameter-estimation",
    "gu-ji-liang-de-wu-pian-xing": "estimator-unbiased",
    "ju-gu-ji-he-zui-da-si-ran-gu-ji": "estimation-methods",
    "qu-jian-gu-ji-he-zhi-xin-qu-jian": "confidence-interval",
    "jia-she-jian-yan": "hypothesis-testing",
    "gu-ji-liang-de-you-xiao-xing": "estimator-unbiased"
};
