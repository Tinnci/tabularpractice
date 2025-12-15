import { CircuitConnection } from "./types";

/**
 * Calculates the SVG path definition ('d' attribute) for a connection using ELK-provided routing points.
 * 
 * It strictly follows the points provided by the layout engine:
 * Start -> BendPoints -> End
 */
export const calculateConnectionPath = (
    connection: CircuitConnection
): string => {
    // If no explicit start/end points from layout, we can't draw properly
    // Ideally this shouldn't happen if layout engine works correctly
    if (!connection.startPoint || !connection.endPoint) {
        return "";
    }

    const p1 = connection.startPoint;
    const p2 = connection.endPoint;
    const bendPoints = connection.bendPoints || [];

    let pathD = `M${p1.x},${p1.y}`;

    // Visit all bend points
    bendPoints.forEach(bp => {
        pathD += ` L${bp.x},${bp.y}`;
    });

    // Finally to end point
    pathD += ` L${p2.x},${p2.y}`;

    return pathD;
};
