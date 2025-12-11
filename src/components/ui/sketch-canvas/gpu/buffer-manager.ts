/**
 * GPU Buffer Management
 * Handles writing stroke data to GPU buffers
 */

import type { GpuStroke } from './types';
import { MAX_POINTS, FLOATS_PER_POINT } from './types';

/**
 * Write a single stroke's data to a Float32Array
 * @returns The next offset position
 */
export function writeStrokeToData(
    stroke: GpuStroke,
    targetData: Float32Array,
    startOffset: number
): number {
    let offset = startOffset;
    for (let i = 0; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        targetData[offset++] = p.x;
        targetData[offset++] = p.y;
        targetData[offset++] = p.p;
        targetData[offset++] = stroke.width;
        targetData[offset++] = stroke.color[0];
        targetData[offset++] = stroke.color[1];
        targetData[offset++] = stroke.color[2];
        targetData[offset++] = stroke.color[3];
    }
    return offset;
}

/**
 * Update GPU buffer with stroke data
 */
export function updateGpuBuffer(params: {
    device: GPUDevice;
    buffer: GPUBuffer;
    strokes: GpuStroke[];
    currentStroke: GpuStroke | null;
    fullRebuild: boolean;
    totalPointsRef: { current: number };
}): void {
    const { device, buffer, strokes, currentStroke, fullRebuild, totalPointsRef } = params;

    if (fullRebuild) {
        // Full rebuild: write all strokes
        const data = new Float32Array(MAX_POINTS * FLOATS_PER_POINT);
        let currentTotal = 0;
        let offset = 0;

        const processStroke = (stroke: GpuStroke) => {
            stroke.startIndex = currentTotal;
            offset = writeStrokeToData(stroke, data, offset);
            currentTotal += stroke.points.length;
        };

        strokes.forEach(processStroke);
        if (currentStroke) processStroke(currentStroke);

        totalPointsRef.current = currentTotal;

        if (currentTotal > 0) {
            device.queue.writeBuffer(buffer, 0, data, 0, currentTotal * FLOATS_PER_POINT * 4);
        }
    } else {
        // Incremental update: write only current stroke
        const stroke = currentStroke;
        if (!stroke) return;

        if (stroke.startIndex === -1) {
            stroke.startIndex = totalPointsRef.current;
        }

        const startIdx = stroke.startIndex;
        const count = stroke.points.length;
        if (startIdx + count > MAX_POINTS) return;

        const data = new Float32Array(count * FLOATS_PER_POINT);
        writeStrokeToData(stroke, data, 0);

        // Debug logging
        console.log('[GPU Debug] Writing buffer:', {
            startIndex: startIdx,
            pointsCount: count,
            firstPointData: Array.from(data.slice(0, 8)), // x, y, p, size, r, g, b, a
            bufferOffset: startIdx * 32
        });

        device.queue.writeBuffer(buffer, startIdx * 32, data);
    }
}
