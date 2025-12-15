/**
 * Control Theory Visualization Types
 * Designed to cover control systems topics for SHU 836 and similar exams
 */

// ============== Control System Diagram Types ==============

/** Circuit Diagram Component */
export interface CircuitComponent {
    id: string;
    type: "resistor" | "capacitor" | "inductor" | "voltage-source" | "current-source" | "ground" | "wire" | "node";
    label?: string;
    value?: string;  // e.g., "R_1", "10kΩ"
    position: { x: number; y: number };
    rotation?: 0 | 90 | 180 | 270;
}

export interface CircuitConnection {
    from: string;
    to: string;
    style?: "solid" | "dashed";
    bendPoints?: Array<{ x: number; y: number }>;
}

export interface CircuitDiagramConfig {
    type: "circuit-diagram";
    components: CircuitComponent[];
    connections: CircuitConnection[];
    annotations?: Array<{
        x: number;
        y: number;
        text: string;  // LaTeX supported
    }>;
    inputLabel?: string;
    outputLabel?: string;
}

// ============== Block Diagram Types ==============

export type BlockType =
    | "transfer-function"
    | "summing-junction"
    | "sampler"
    | "zoh"
    | "gain"
    | "input"
    | "output"
    | "integrator"
    | "derivative";

export interface BlockDiagramBlock {
    id: string;
    type: BlockType;
    label?: string;           // e.g., "G_1(s)", "+", "-"
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export interface BlockDiagramConnection {
    from: string;
    to: string;
    fromPort?: "right" | "bottom" | "left" | "top";
    toPort?: "right" | "bottom" | "left" | "top";
    signalType?: "continuous" | "discrete";
    sign?: "+" | "-";
    label?: string;           // e.g., "R(s)", "C(z)"
    bendPoints?: Array<{ x: number; y: number }>;
}

export interface BlockDiagramConfig {
    type: "block-diagram";
    blocks: BlockDiagramBlock[];
    connections: BlockDiagramConnection[];
    title?: string;
}

// ============== Root Locus Types ==============

export interface ComplexPoint {
    re: number;
    im: number;
}

export interface RootLocusConfig {
    type: "root-locus";
    openLoopPoles: ComplexPoint[];
    openLoopZeros: ComplexPoint[];
    // Asymptotes
    asymptotes?: {
        angles: number[];         // degrees
        centroid: number;         // real axis intercept
    };
    // Special points
    separationPoints?: ComplexPoint[];
    imaginaryAxisCrossings?: Array<{
        im: number;
        k: number;
        label?: string;
    }>;
    // Computed branches (optional, for custom curves)
    branches?: Array<{
        points: ComplexPoint[];
        kValues?: number[];
    }>;
    // Display settings
    kRange?: [number, number];
    realAxisRange?: [number, number];
    imagAxisRange?: [number, number];
    showArrows?: boolean;
    showKValues?: boolean;
}

// ============== Bode Plot Types ==============

export interface TransferFunctionZeroPole {
    value: number;             // Corner frequency or pole/zero location
    multiplicity?: number;     // Default 1
    isComplex?: boolean;       // For complex conjugate pairs
    dampingRatio?: number;     // For complex poles/zeros
}

export interface BodePlotConfig {
    type: "bode-plot";
    transferFunction: {
        // Zero-Pole-Gain form
        zeros?: TransferFunctionZeroPole[];
        poles?: TransferFunctionZeroPole[];
        gain?: number;
        // Or expression form (for parsing)
        numerator?: string;       // e.g., "s + 1"
        denominator?: string;     // e.g., "s * (0.1*s + 1)"
        // Type (for integrators/differentiators at origin)
        systemType?: number;      // 0, 1, 2 (number of integrators)
    };
    omegaRange: [number, number]; // Log range, e.g., [0.01, 100]
    showAsymptotes?: boolean;
    showPhaseMargin?: boolean;
    showGainMargin?: boolean;
    annotations?: Array<{
        type: "crossover-frequency" | "phase-margin" | "gain-margin" | "corner-frequency" | "custom";
        omega?: number;
        value?: number;
        label?: string;
    }>;
}

// ============== Step Response Types ==============

export interface StepResponseConfig {
    type: "step-response";
    systemType: "first-order" | "second-order" | "custom";
    // First-order parameters
    timeConstant?: number;        // T
    gain?: number;                // K
    // Second-order parameters
    dampingRatio?: number;        // ζ (zeta)
    naturalFrequency?: number;    // ωn
    // Custom expression
    customExpression?: string;    // e.g., "1 - exp(-t/2)"
    // Display range
    tRange: [number, number];
    yRange?: [number, number];
    // Annotations
    annotations?: Array<{
        type: "steady-state" | "settling-time" | "rise-time" | "overshoot" | "peak-time" | "time-constant" | "custom";
        value?: number;
        label?: string;
    }>;
    showGrid?: boolean;
}

// ============== Nyquist Plot Types ==============

export interface NyquistPlotConfig {
    type: "nyquist-plot";
    transferFunction: {
        numerator: string;
        denominator: string;
    };
    omegaRange: [number, number];
    showCriticalPoint?: boolean;  // (-1, 0)
    showUnitCircle?: boolean;
    frequencyMarkers?: number[];  // ω values to mark on curve
    showEncirclements?: boolean;
}

// ============== Phase Portrait (for Lyapunov stability) ==============

export interface PhasePortraitConfig {
    type: "phase-portrait";
    // State equations: dx/dt = f(x,y), dy/dt = g(x,y)
    dxdt: string;
    dydt: string;
    // Range
    xRange: [number, number];
    yRange: [number, number];
    // Equilibrium points
    equilibria?: Array<{
        x: number;
        y: number;
        type: "stable-node" | "unstable-node" | "saddle" | "stable-focus" | "unstable-focus" | "center";
        label?: string;
    }>;
    // Initial conditions for trajectories
    trajectories?: Array<{
        x0: number;
        y0: number;
        tSpan?: [number, number];
        color?: string;
    }>;
    showVectorField?: boolean;
    showNullclines?: boolean;
}

// ============== State Transition Matrix Visualization ==============

export interface StateTransitionConfig {
    type: "state-transition";
    // System matrix A
    matrixA: number[][];
    // Time range
    tRange: [number, number];
    // Initial conditions
    x0: number[];
    // Visualization mode
    mode: "trajectory" | "matrix-elements" | "eigenvalue-decomposition";
    showEigenvalues?: boolean;
}

// ============== Signal Flow Graph Types ==============

export interface SignalFlowNode {
    id: string;
    label?: string;
    position: { x: number; y: number };
    type: "input" | "output" | "node" | "summing";
}

export interface SignalFlowEdge {
    from: string;
    to: string;
    gain: string; // e.g., "G1", "H1", "1", "-1"
    type?: "straight" | "curved";
    curveOffset?: number; // For parallel edges
}

export interface SignalFlowGraphConfig {
    type: "signal-flow-graph";
    nodes: SignalFlowNode[];
    edges: SignalFlowEdge[];
    title?: string;
}

// Unified Visualization Config (matching MathVisualization structure)
export type ControlVisualizationConfig = {
    type: string;
    title?: string;
    config:
    | CircuitDiagramConfig
    | BlockDiagramConfig
    | RootLocusConfig
    | BodePlotConfig
    | StepResponseConfig
    | NyquistPlotConfig
    | PhasePortraitConfig
    | StateTransitionConfig
    | SignalFlowGraphConfig;
};

export interface ControlVisualizationRendererProps {
    config: ControlVisualizationConfig;
    height?: number;
    className?: string;
}


// Update Control Viz Types List
export const CONTROL_VIZ_TYPES = [
    "circuit-diagram",
    "block-diagram",
    "signal-flow-graph", // Added
    "root-locus",
    "bode-plot",
    "step-response",
    "nyquist-plot",
    "phase-portrait",
    "state-transition",
] as const;

// Update Tag Map
export const CONTROL_TAG_VISUALIZATION_MAP: Record<string, string[]> = {
    // ... (Keep existing)
    // Modern Control Theory
    "state-space": ["block-diagram", "state-transition", "signal-flow-graph"],
    "linear-transformation": ["state-transition"],
    "canonical-form": ["block-diagram", "signal-flow-graph"],
    "state-transition-matrix": ["state-transition"],
    "controllability": ["block-diagram", "signal-flow-graph"],
    "observability": ["block-diagram", "signal-flow-graph"],
    "pole-placement": ["root-locus", "signal-flow-graph"],
    "state-observer": ["block-diagram"],
    "lyapunov-stability": ["phase-portrait"],

    // Classical Control Theory
    "transfer-function": ["block-diagram", "step-response", "bode-plot", "signal-flow-graph"],
    "block-diagram": ["block-diagram"],
    "signal-flow-graph": ["signal-flow-graph"],
    "masons-rule": ["signal-flow-graph"], // Added
    "circuit-modeling": ["circuit-diagram"],
    "mechanical-modeling": ["block-diagram"],
    "root-locus": ["root-locus"],
    "root-locus-drawing": ["root-locus"],
    "root-locus-analysis": ["root-locus"],
    "frequency-domain": ["bode-plot", "nyquist-plot"],
    "bode-plot": ["bode-plot"],
    "nyquist-plot": ["nyquist-plot"],
    "frequency-stability": ["bode-plot", "nyquist-plot"],
    "compensation": ["bode-plot", "root-locus"],
    "discrete-system": ["block-diagram", "step-response", "signal-flow-graph"],
    "z-transform": ["block-diagram", "signal-flow-graph"],
    "stability-analysis": ["root-locus", "bode-plot", "nyquist-plot"],
    "steady-state-error": ["step-response"],
    "transient-response": ["step-response"],
};
