import dagre from 'dagre';
import { CircuitComponent, CircuitConnection } from './types';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 60;
// Spacing between ranks (X direction in LR)
const RANK_SEP = 60;
// Spacing between nodes in same rank (Y direction in LR)
const NODE_SEP = 40;

/**
 * Computes the auto-layout for circuit components using Dagre.
 * Returns a new list of components with updated positions.
 */
export function getLayoutedComponents(
    components: CircuitComponent[],
    connections: CircuitConnection[],
    direction: 'LR' | 'TB' = 'LR'
): CircuitComponent[] {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        rankdir: direction,
        nodesep: NODE_SEP,
        ranksep: RANK_SEP,
        marginx: 50,
        marginy: 50,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Pre-process components to identify "Ground" or special types if needed?
    // For now, treat all equal.

    // 1. Add nodes
    components.forEach((comp) => {
        g.setNode(comp.id, {
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
        });
    });

    // 2. Add edges
    connections.forEach((conn) => {
        g.setEdge(conn.from, conn.to);
    });

    // 3. Compute layout
    dagre.layout(g);

    // 4. Map back to components
    // We also want to snap to a grid to avoid "fuzzy" lines (e.g. y=101 vs y=99)
    const GRID_SIZE = 20;
    const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

    return components.map((comp) => {
        const nodeWithPosition = g.node(comp.id);

        // Dagre gives center coordinates.
        // We preserve the rotation if it was manually set, otherwise we might infer it?
        // For this pass, we just update x/y.

        // Adjust for specific components:
        // Ground should ideally be pushed to the bottom? 
        // Dagre doesn't easily support "push to bottom". 
        // But in LR mode, if Ground is a sink, it might end up at the end (far Right).
        // This is a known issue with using Dagre for circuits.
        // Specialized logic: If we detect this is a standard "Ladder" (Rail) circuit:
        // We might want to post-process. 

        return {
            ...comp,
            position: {
                x: snap(nodeWithPosition.x),
                y: snap(nodeWithPosition.y),
            },
        };
    });
}
