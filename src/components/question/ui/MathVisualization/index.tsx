"use client";

// ============== 2D Visualizations (Mafs-based) ==============

// Core 2D components
export { IntegralRegion2D, type IntegralRegion2DProps } from "./IntegralRegion2D";
export { FunctionPlot, type FunctionPlotProps } from "./FunctionPlot";

// Enhanced 2D components
export { EnhancedFunctionPlot, type EnhancedFunctionPlotProps } from "./EnhancedFunctionPlot";
export { VectorField2D, type VectorField2DProps } from "./VectorField2D";
export { ParametricCurve2D, type ParametricCurve2DProps } from "./ParametricCurve2D";

// 2D Container System (extensible layouts, zoom, pan)
export {
    Viz2DContainer,
    MafsWrapper,
    useViz2D,
    type Viz2DContainerProps,
    type ViewBounds,
    type LayoutMode,
    type ViewMode,
} from "./Viz2DContainer";

// 2D Controls
export {
    Viz2DControls,
    Viz2DInfoHint,
    ZoomIndicator,
    LayoutModeSelector,
    type Viz2DControlsProps,
} from "./Viz2DControls";

// Split View & Comparison
export {
    SplitViewCompare,
    PictureInPicture,
    type SplitViewCompareProps,
    type PictureInPictureProps,
} from "./SplitViewCompare";

// ============== Universal Renderer ==============

export {
    MathVisualizationRenderer,
    type MathVisualizationRendererProps,
    type VisualizationConfig,
    type IntegralRegion2DConfig,
    type FunctionPlotConfig,
    type SurfacePlot3DConfig,
    type VectorField3DConfig,
    type ClosedSurface3DConfig,
    type Gradient3DConfig,
} from "./MathVisualizationRenderer";

// ============== 3D Visualizations (Three.js-based) ==============

// 3D components - lazy loaded
export { SurfacePlot3D, type SurfacePlot3DProps } from "./SurfacePlot3D";
export { VectorField3DVisualizer, ClosedSurface3D } from "./VectorField3D";
export { Gradient3DVisualizer } from "./Gradient3D";

// 3D Controls
export { Viz3DControls, Viz3DInfoHint } from "./Viz3DControls";

// ============== Type Definitions ==============

export * from "./types";

