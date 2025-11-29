export interface Point {
    x: number;
    y: number;
}

export interface CanvasPath {
    paths: Point[];
    strokeWidth: number;
    strokeColor: string;
    drawMode: boolean; // true for draw, false for eraser
    startTimestamp?: number;
    endTimestamp?: number;
}

export interface ExportedPath {
    paths: Point[];
    strokeWidth: number;
    strokeColor: string;
    drawMode: boolean;
    startTimestamp: number;
    endTimestamp: number;
}

export interface ReactSketchCanvasProps {
    id?: string;
    width?: string;
    height?: string;
    className?: string;
    strokeColor?: string;
    canvasColor?: string;
    strokeWidth?: number;
    eraserWidth?: number;
    allowOnlyPointerType?: 'all' | 'mouse' | 'touch' | 'pen';
    style?: React.CSSProperties;
    onStroke?: (path: ExportedPath, isEraser: boolean) => void;
}

export interface ReactSketchCanvasRef {
    clearCanvas: () => void;
    undo: () => void;
    eraseMode: (erase: boolean) => void;
    exportPaths: () => Promise<ExportedPath[]>;
    loadPaths: (paths: ExportedPath[]) => void;
    getSketchingTime: () => Promise<number>;
    resetCanvas: () => void;
}
