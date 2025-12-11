/**
 * GPU Sketch Canvas Type Definitions
 */

import type { ReactSketchCanvasRef, ExportedPath } from '../types';

export interface GpuSketchCanvasProps {
    width?: string;
    height?: string;
    className?: string;
    strokeColor?: string;
    strokeWidth?: number;
    canvasColor?: string;
    allowOnlyPointerType?: 'all' | 'mouse' | 'touch' | 'pen';
    onStroke?: (path: ExportedPath, isEraser: boolean) => void;
}

export interface GpuStroke {
    points: { x: number; y: number; p: number }[];
    color: [number, number, number, number];
    hexColor: string;
    width: number;
    isEraser: boolean;
    startIndex: number;
}

export interface Point {
    x: number;
    y: number;
    p: number;
}

// Re-export for convenience
export type { ReactSketchCanvasRef, ExportedPath };

// Constants
export const MAX_POINTS = 500000;
export const FLOATS_PER_POINT = 8;
