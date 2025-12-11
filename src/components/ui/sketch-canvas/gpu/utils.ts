/**
 * GPU Sketch Canvas Utilities
 * Simple helper functions used across the GPU canvas
 */

/**
 * Convert hex color to RGBA array (normalized 0-1)
 * @param hex - Hex color string (e.g., "#FF0000")
 * @returns RGBA array with values 0-1
 */
export function hexToRgba(hex: string): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1.0];
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
