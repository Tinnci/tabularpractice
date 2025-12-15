import { CircuitComponent, CircuitConnection } from "./types";

/**
 * Calculates the exact port position for a connection based on the component's type, position and rotation.
 */
export const getPortPosition = (comp: CircuitComponent, port: 'left' | 'right' | 'top' | 'bottom'): { x: number, y: number } => {
    // Dimensions of components (approximate based on SVG symbols where wire is +/- 30)
    const offset = 30;

    let localX = 0;
    let localY = 0;

    // Determine local port position based on component type
    // Most 2-terminal components (R, L, C, V) are horizontal by default: Left (-30, 0), Right (30, 0)
    if (['resistor', 'capacitor', 'inductor', 'voltage-source', 'switch'].includes(comp.type)) {
        if (port === 'left') localX = -offset;
        if (port === 'right') localX = offset;
    }
    // Ground is vertical: Top (0, 0) is connection point
    else if (comp.type === 'ground') {
        if (port === 'top') { localX = 0; localY = -15; }
    }
    // Nodes are just points
    else if (comp.type === 'node') {
        localX = 0;
        localY = 0;
    }

    // Apply rotation
    const rad = ((comp.rotation || 0) * Math.PI) / 180;
    const rotatedX = localX * Math.cos(rad) - localY * Math.sin(rad);
    const rotatedY = localX * Math.sin(rad) + localY * Math.cos(rad);

    return {
        x: comp.position.x + rotatedX,
        y: comp.position.y + rotatedY
    };
};

/**
 * Intelligently determines the best port for a connection based on component position and type.
 */
const getBestPort = (
    comp: CircuitComponent,
    otherComp: CircuitComponent,
    isSource: boolean
): 'left' | 'right' | 'top' | 'bottom' => {
    // For ground, always use top
    if (comp.type === 'ground') return 'top';

    // For nodes, doesn't matter (they're just points)
    if (comp.type === 'node') return 'left';

    // Calculate relative position
    const dx = otherComp.position.x - comp.position.x;
    const dy = otherComp.position.y - comp.position.y;

    // Consider rotation
    const rotation = comp.rotation || 0;

    // For horizontal components (R, L, C, V) with rotation 0 or 180
    if (rotation === 0 || rotation === 180) {
        // Horizontal orientation
        if (Math.abs(dx) > Math.abs(dy)) {
            // Other component is more to left/right
            if (dx > 0) {
                return rotation === 0 ? 'right' : 'left';
            } else {
                return rotation === 0 ? 'left' : 'right';
            }
        } else {
            // Other component is more above/below, but we're horizontal
            // Use whichever end is closer
            return dx >= 0 ? 'right' : 'left';
        }
    }

    // For vertical components (rotation 90 or 270)
    if (rotation === 90 || rotation === 270) {
        // Component is vertical
        if (Math.abs(dy) > Math.abs(dx)) {
            // Other component is more above/below
            if (dy > 0) {
                // For 90°: right becomes bottom, left becomes top
                return rotation === 90 ? 'right' : 'left';
            } else {
                return rotation === 90 ? 'left' : 'right';
            }
        } else {
            // Other component is more left/right, but we're vertical
            return dy >= 0 ? 'right' : 'left';
        }
    }

    // Default fallback
    return isSource ? 'right' : 'left';
};

/**
 * Calculates the SVG path definition ('d' attribute) for a connection.
 */
export const calculateConnectionPath = (
    connection: CircuitConnection,
    fromComp: CircuitComponent | undefined,
    toComp: CircuitComponent | undefined
): string => {
    if (!fromComp || !toComp) return "";

    // Intelligently determine ports based on positions
    const fromPort = getBestPort(fromComp, toComp, true);
    const toPort = getBestPort(toComp, fromComp, false);

    const p1 = getPortPosition(fromComp, fromPort);
    const p2 = getPortPosition(toComp, toPort);

    const bendPoints = connection.bendPoints || [];

    // Smart Orthogonal Routing if bend points exist
    if (bendPoints.length > 0) {
        let pathD = `M${p1.x},${p1.y}`;
        let currentX = p1.x;
        let currentY = p1.y;

        // Determine initial exit direction
        const srcCenter = fromComp.position;
        const dx1 = p1.x - srcCenter.x;
        const dy1 = p1.y - srcCenter.y;

        let exitDir: 'horizontal' | 'vertical' = (Math.abs(dx1) > Math.abs(dy1)) ? 'horizontal' : 'vertical';
        const exitSign = (exitDir === 'horizontal') ? Math.sign(dx1) : Math.sign(dy1);

        // Stub
        const STUB_LEN = 10;
        if (exitDir === 'horizontal') {
            currentX += exitSign * STUB_LEN;
        } else {
            currentY += exitSign * STUB_LEN;
        }
        pathD += ` L${currentX},${currentY}`;

        // Points to visit
        const targets = [...bendPoints, p2];

        targets.forEach(target => {
            // Decide horizontal vs vertical first
            const dx = target.x - currentX;
            const dy = target.y - currentY;

            // If very close in one axis, treat as straight line
            if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
                pathD += ` L${target.x},${target.y}`;
            } else {
                // Orthogonal routing logic
                let moveH = true;

                if (exitDir === 'horizontal') {
                    moveH = true;
                    if (Math.abs(dx) < Math.abs(dy) && Math.abs(dy) > 20) {
                        // Could add specialized logic here
                    }
                } else {
                    moveH = false;
                }

                // If moving Horizontal first:
                if (moveH) {
                    pathD += ` L${target.x},${currentY} L${target.x},${target.y}`;
                    exitDir = 'vertical';
                } else {
                    pathD += ` L${currentX},${target.y} L${target.x},${target.y}`;
                    exitDir = 'horizontal';
                }
            }

            currentX = target.x;
            currentY = target.y;
        });

        return pathD;
    }

    // Default L-shaped connection for direct links
    const midX = (p1.x + p2.x) / 2;
    return `M${p1.x},${p1.y} L${midX},${p1.y} L${midX},${p2.y} L${p2.x},${p2.y}`;
};
