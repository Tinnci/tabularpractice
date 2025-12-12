import React, { useMemo } from 'react';
import { Point } from './types';

export interface SvgPathProps {
    points: Point[];
    strokeColor: string;
    strokeWidth: number;
}

/**
 * Helper to convert array of points to SVG path data string (d attribute)
 * using quadratic bezier curves for smoothness
 */
function getSvgPathFromStroke(points: Point[]): string {
    const len = points.length;
    if (len < 1) return "";

    const a = points[0];
    // b is not used in the original code except for assignment, but logic seems to rely on array indexing.
    // Actually, looking at the code:
    // let b = points[1];
    // if (len < 2) ...
    // The loop starts at i=1.
    // 'b' is never used. So we can just remove it.

    if (len < 2) {
        // A single point is drawn as a dot (very short line)
        return `M ${a.x} ${a.y} L ${a.x + 0.1} ${a.y + 0.1}`;
    }

    let result = `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`;

    for (let i = 1; i < len - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        result += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}, ${midX.toFixed(2)} ${midY.toFixed(2)}`;
    }

    // Connect the last point
    const last = points[len - 1];
    result += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

    return result;
}

export const SvgPath = React.memo(function SvgPath({ points, strokeColor, strokeWidth }: SvgPathProps) {
    const d = useMemo(() => getSvgPathFromStroke(points), [points]);

    return (
        <path
            d={d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
});
