/**
 * Mathematical Visualization Types
 * Designed to cover all topics in the math syllabus (tags.json)
 */

// ============== 2D Visualization Types ==============

/** Function plot configuration */
export interface FunctionPlotConfig {
    type: "function-plot";
    functions: Array<{
        expr: string;      // e.g., "x*x", "sin(x)"
        color?: string;
        label?: string;
        style?: "solid" | "dashed" | "dotted";
    }>;
    xRange?: [number, number];
    yRange?: [number, number];
}

/** 2D integral region configuration */
export interface IntegralRegion2DConfig {
    type: "integral-region-2d";
    xRange: [number, number];
    lowerBound: string;    // e.g., "x*x"
    upperBound: string;    // e.g., "x"
    curves?: Array<{
        expr: string;
        color?: string;
        label?: string;
    }>;
    labels?: Array<{
        x: number;
        y: number;
        text: string;
    }>;
}

/** Parametric curve configuration */
export interface ParametricCurve2DConfig {
    type: "parametric-curve-2d";
    x: string;             // x(t) expression
    y: string;             // y(t) expression
    tRange: [number, number];
    color?: string;
    showDirection?: boolean;
}

/** 2D vector field configuration */
export interface VectorField2DConfig {
    type: "vector-field-2d";
    fx: string;            // x component: P(x,y)
    fy: string;            // y component: Q(x,y)
    xRange: [number, number];
    yRange: [number, number];
    density?: number;      // arrows per axis
    showStreamlines?: boolean;
}

/** Phase portrait for differential equations */
export interface PhasePortrait2DConfig {
    type: "phase-portrait-2d";
    dx: string;            // dx/dt expression
    dy: string;            // dy/dt expression
    xRange: [number, number];
    yRange: [number, number];
    equilibria?: Array<{ x: number; y: number; type: "stable" | "unstable" | "saddle" | "center" }>;
    trajectories?: Array<{ x0: number; y0: number }>;
}

// ============== 3D Visualization Types ==============

/** 3D surface plot configuration */
export interface SurfacePlot3DConfig {
    type: "surface-plot-3d";
    function: string;      // z = f(x,y) expression
    xRange: [number, number];
    yRange: [number, number];
    zRange?: [number, number];
    colorScheme?: "viridis" | "plasma" | "inferno" | "magma" | "rainbow" | "coolwarm";
    opacity?: number;
    showWireframe?: boolean;
    showContours?: boolean;
    criticalPoints?: Array<{
        x: number;
        y: number;
        type: "maximum" | "minimum" | "saddle";
        label?: string;
    }>;
}

/** 3D parametric surface configuration */
export interface ParametricSurface3DConfig {
    type: "parametric-surface-3d";
    x: string;             // x(u,v) expression
    y: string;             // y(u,v) expression
    z: string;             // z(u,v) expression
    uRange: [number, number];
    vRange: [number, number];
    colorScheme?: string;
}

/** 3D vector field configuration (for curl, gradient, Gauss theorem) */
export interface VectorField3DConfig {
    type: "vector-field-3d";
    fx: string;            // P(x,y,z)
    fy: string;            // Q(x,y,z)
    fz: string;            // R(x,y,z)
    xRange: [number, number];
    yRange: [number, number];
    zRange: [number, number];
    density?: number;
    showDivergence?: boolean;
    showCurl?: boolean;
}

/** Closed surface with flux visualization (Gauss theorem) */
export interface ClosedSurface3DConfig {
    type: "closed-surface-3d";
    surface: "sphere" | "ellipsoid" | "cube" | "cylinder" | "cone" | "custom";
    params?: Record<string, number>;  // e.g., { radius: 1 } for sphere
    vectorField?: {
        fx: string;
        fy: string;
        fz: string;
    };
    showFluxArrows?: boolean;
    showVolume?: boolean;
}

/** 3D curve (line integral path) */
export interface Curve3DConfig {
    type: "curve-3d";
    x: string;             // x(t) expression
    y: string;             // y(t) expression
    z: string;             // z(t) expression
    tRange: [number, number];
    color?: string;
    showTangent?: boolean;
    showNormal?: boolean;
    vectorField?: {
        fx: string;
        fy: string;
        fz: string;
    };
}

/** 3D region for triple integrals */
export interface IntegralRegion3DConfig {
    type: "integral-region-3d";
    innerType: "cartesian" | "cylindrical" | "spherical";
    bounds: {
        x?: { min: string; max: string };
        y?: { min: string; max: string };
        z?: { min: string; max: string };
        r?: { min: string; max: string };
        theta?: { min: string; max: string };
        phi?: { min: string; max: string };
    };
    showProjection?: "xy" | "xz" | "yz";
}

/** Gradient visualization on a surface */
export interface Gradient3DConfig {
    type: "gradient-3d";
    function: string;      // u = f(x,y,z)
    point: [number, number, number];
    showLevelSurface?: boolean;
    showGradientVector?: boolean;
    showDirectionalDerivative?: {
        direction: [number, number, number];
    };
}

// ============== Linear Algebra Visualization Types ==============

/** Matrix transformation visualization */
export interface MatrixTransform3DConfig {
    type: "matrix-transform-3d";
    matrix: number[][];    // 3x3 transformation matrix
    showBasis?: boolean;
    showEigenvectors?: boolean;
    animateTransform?: boolean;
}

/** Quadratic form visualization */
export interface QuadraticForm3DConfig {
    type: "quadratic-form-3d";
    matrix: number[][];    // symmetric matrix A
    showEigenaxes?: boolean;
    showLevelSets?: boolean;
    standardForm?: {
        eigenvalues: number[];
        transformation?: number[][];
    };
}

/** Vector space / span visualization */
export interface VectorSpace3DConfig {
    type: "vector-space-3d";
    vectors: Array<[number, number, number]>;
    showSpan?: boolean;    // visualize the subspace spanned
    showLinearCombination?: boolean;
    labels?: string[];
}

// ============== Probability Visualization Types ==============

/** 2D probability density visualization */
export interface JointDistribution3DConfig {
    type: "joint-distribution-3d";
    density: string;       // f(x,y) expression
    xRange: [number, number];
    yRange: [number, number];
    showMarginals?: boolean;
    conditionalSlice?: { variable: "x" | "y"; value: number };
}

// ============== Union Type ==============

export type Visualization2DConfig =
    | FunctionPlotConfig
    | IntegralRegion2DConfig
    | ParametricCurve2DConfig
    | VectorField2DConfig
    | PhasePortrait2DConfig;

export type Visualization3DConfig =
    | SurfacePlot3DConfig
    | ParametricSurface3DConfig
    | VectorField3DConfig
    | ClosedSurface3DConfig
    | Curve3DConfig
    | IntegralRegion3DConfig
    | Gradient3DConfig
    | MatrixTransform3DConfig
    | QuadraticForm3DConfig
    | VectorSpace3DConfig
    | JointDistribution3DConfig;

export type VisualizationConfig = {
    type: string;
    title?: string;
    config: Visualization2DConfig | Visualization3DConfig;
};

// ============== Tag to Visualization Mapping ==============

/**
 * Maps syllabus tags to applicable visualization types.
 * This helps determine which visualization types are relevant for a given topic.
 */
export const TAG_VISUALIZATION_MAP: Record<string, string[]> = {
    // Multivariable Calculus
    "directional-derivative": ["gradient-3d", "surface-plot-3d"],
    "multivariable-extremum": ["surface-plot-3d"],
    "multivariable-geometry": ["surface-plot-3d", "parametric-surface-3d", "curve-3d"],
    "partial-derivative": ["surface-plot-3d", "gradient-3d"],
    "total-differential": ["surface-plot-3d"],

    // Multiple Integrals
    "multiple-integral-calculation": ["integral-region-2d", "integral-region-3d"],
    "multiple-integral-concept": ["integral-region-2d", "integral-region-3d"],
    "multiple-integral-application": ["integral-region-3d", "surface-plot-3d"],
    "integral-order-transform": ["integral-region-2d", "integral-region-3d"],

    // Line & Surface Integrals
    "line-integral-type1": ["curve-3d", "parametric-curve-2d"],
    "line-integral-type2": ["curve-3d", "vector-field-2d", "vector-field-3d"],
    "surface-integral-type1": ["parametric-surface-3d"],
    "surface-integral-type2": ["closed-surface-3d", "vector-field-3d"],
    "curl-definition": ["vector-field-3d"],

    // Differential Equations
    "differential-equation": ["phase-portrait-2d", "function-plot"],
    "separable-homogeneous": ["phase-portrait-2d"],

    // Single Variable Calculus
    "concavity-asymptote": ["function-plot"],
    "monotonicity-extremum": ["function-plot"],
    "definite-integral-application": ["integral-region-2d", "function-plot"],

    // Linear Algebra
    "matrix-diagonalization": ["matrix-transform-3d", "vector-space-3d"],
    "quadratic-form": ["quadratic-form-3d"],
    "eigenvalue-eigenvector": ["matrix-transform-3d", "vector-space-3d"],
    "linear-dependence": ["vector-space-3d"],

    // Probability
    "two-dimensional-variable": ["joint-distribution-3d"],
    "marginal-conditional": ["joint-distribution-3d"],
};
