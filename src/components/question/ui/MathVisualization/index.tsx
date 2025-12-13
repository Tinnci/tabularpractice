"use client";

// 2D Visualizations (Mafs-based)
export { IntegralRegion2D, type IntegralRegion2DProps } from "./IntegralRegion2D";
export { FunctionPlot, type FunctionPlotProps } from "./FunctionPlot";

// Universal Renderer (handles both 2D and 3D)
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

// 3D Visualizations (Three.js-based) - lazy loaded
export { SurfacePlot3D, type SurfacePlot3DProps } from "./SurfacePlot3D";
export { VectorField3DVisualizer, ClosedSurface3D } from "./VectorField3D";
export { Gradient3DVisualizer } from "./Gradient3D";

// Type definitions for all visualization scenarios
export * from "./types";
