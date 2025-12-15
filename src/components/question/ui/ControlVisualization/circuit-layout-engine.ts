/**
 * ELK-based Circuit Layout Engine
 * 
 * This module uses the Eclipse Layout Kernel (ELK) to compute
 * optimal positions for circuit components based on:
 * - Component roles (input, output, ground, power)
 * - Connection topology
 * - Layout constraints
 * 
 * ELK provides sophisticated algorithms for:
 * - Hierarchical layouts (Sugiyama-style)
 * - Layer-based positioning
 * - Orthogonal edge routing
 * - Constraint satisfaction
 */

import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type {
    SemanticCircuitConfig,
    SemanticCircuitComponent,
    CircuitLayoutConstraints,
} from './semantic-circuit-types';
import {
    DEFAULT_CIRCUIT_CONSTRAINTS,
    COMPONENT_DIMENSIONS,
} from './semantic-circuit-types';
import type { CircuitComponent, CircuitConnection } from './types';

// Create ELK instance
const elk = new ELK();

// Type for ELK graph (root node with edges)
interface ElkGraph extends ElkNode {
    edges?: ElkExtendedEdge[];
}

// ============== Layout Options ==============

/**
 * Build ELK layout options based on constraints
 */
function buildLayoutOptions(constraints: CircuitLayoutConstraints): Record<string, string> {
    const merged = { ...DEFAULT_CIRCUIT_CONSTRAINTS, ...constraints };

    return {
        // Use layered algorithm (Sugiyama) for hierarchical layout
        'elk.algorithm': 'layered',

        // Flow direction: left-to-right or top-to-bottom
        'elk.direction': merged.flowDirection === 'left-to-right' ? 'RIGHT' : 'DOWN',

        // Spacing
        'elk.spacing.nodeNode': String(merged.minSpacing * merged.gridSize),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(merged.minSpacing * merged.gridSize * 1.5),

        // Edge routing: orthogonal for clean right-angle connections
        'elk.edgeRouting': 'ORTHOGONAL',

        // Node placement strategy: favor straight edges
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',

        // Crossing minimization
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',

        // Compaction
        'elk.layered.compaction.connectedComponents': 'true',

        // Aspect ratio
        'elk.aspectRatio': String(merged.aspectRatio),
    };
}

/**
 * Get node-specific layout options based on component role
 */
function getNodeLayoutOptions(
    component: SemanticCircuitComponent,
    constraints: CircuitLayoutConstraints
): Record<string, string> {
    const options: Record<string, string> = {};
    const merged = { ...DEFAULT_CIRCUIT_CONSTRAINTS, ...constraints };

    switch (component.role) {
        case 'input':
            // Force to first layer (leftmost)
            options['elk.layered.layering.layerConstraint'] = 'FIRST';
            break;

        case 'output':
            // Force to last layer (rightmost)
            options['elk.layered.layering.layerConstraint'] = 'LAST';
            break;

        case 'ground':
            if (merged.groundAtBottom) {
                // In LEFT-to-RIGHT layout, "bottom" means high Y value
                // Use in-layer constraint to push to bottom of its layer
                options['elk.layered.crossingMinimization.inLayerConstraint'] = 'LAST';
            }
            break;

        case 'power':
            if (merged.powerAtTop) {
                options['elk.layered.crossingMinimization.inLayerConstraint'] = 'FIRST';
            }
            break;
    }

    // Handle orientation hints
    if (component.orientation === 'vertical') {
        options['elk.portAlignment.default'] = 'CENTER';
    }

    return options;
}

// ============== Conversion Functions ==============

/**
 * Convert semantic config to ELK graph
 */
function toElkGraph(config: SemanticCircuitConfig): ElkGraph {
    const constraints = config.constraints || {};

    // Build nodes
    const children: ElkNode[] = config.components.map(comp => {
        const dims = COMPONENT_DIMENSIONS[comp.type] || { width: 40, height: 40 };

        return {
            id: comp.id,
            width: dims.width,
            height: dims.height,
            layoutOptions: getNodeLayoutOptions(comp, constraints),
            labels: comp.label ? [{ text: comp.label }] : [],
        };
    });

    // Build edges
    const edges: ElkExtendedEdge[] = config.connections.map((conn, idx) => ({
        id: `e${idx}`,
        sources: [conn.from],
        targets: [conn.to],
    }));

    return {
        id: 'root',
        layoutOptions: buildLayoutOptions(constraints),
        children,
        edges,
    };
}

/**
 * Convert ELK layout result back to our format
 */
function fromElkGraph(
    elkGraph: ElkGraph,
    originalConfig: SemanticCircuitConfig,
    gridSize: number
): { components: CircuitComponent[]; connections: CircuitConnection[] } {
    const snap = (val: number) => Math.round(val / gridSize) * gridSize;

    // Map ELK nodes back to components
    const components: CircuitComponent[] = originalConfig.components.map(orig => {
        const elkNode = elkGraph.children?.find((n: ElkNode) => n.id === orig.id);

        // Determine rotation based on orientation
        let rotation: 0 | 90 | 180 | 270 = 0;
        if (orig.orientation === 'vertical' || orig.type === 'ground') {
            rotation = 90;
        }

        return {
            id: orig.id,
            type: orig.type as CircuitComponent['type'],
            label: orig.label,
            value: orig.value,
            position: {
                x: snap((elkNode?.x ?? 0) + (elkNode?.width ?? 0) / 2),
                y: snap((elkNode?.y ?? 0) + (elkNode?.height ?? 0) / 2),
            },
            rotation,
        };
    });

    // Map ELK edges back to connections with bend points
    const connections: CircuitConnection[] = originalConfig.connections.map((orig, idx) => {
        const elkEdge = elkGraph.edges?.find((e: ElkExtendedEdge) => e.id === `e${idx}`);

        let bendPoints: { x: number; y: number }[] | undefined;

        if (elkEdge?.sections?.[0]?.bendPoints) {
            bendPoints = elkEdge.sections[0].bendPoints.map((bp: { x: number; y: number }) => ({
                x: snap(bp.x),
                y: snap(bp.y),
            }));
        }

        return {
            from: orig.from,
            to: orig.to,
            style: orig.style,
            bendPoints,
        };
    });

    return { components, connections };
}

// ============== Main Layout Function ==============

/**
 * Compute layout for a semantic circuit configuration.
 * Returns positioned components and routed connections.
 */
export async function computeCircuitLayout(
    config: SemanticCircuitConfig
): Promise<{ components: CircuitComponent[]; connections: CircuitConnection[] }> {
    const gridSize = config.constraints?.gridSize ?? DEFAULT_CIRCUIT_CONSTRAINTS.gridSize;

    // Convert to ELK format
    const elkGraph = toElkGraph(config);

    // Run ELK layout
    const layoutedGraph = await elk.layout(elkGraph);

    // Convert back to our format
    return fromElkGraph(layoutedGraph as ElkGraph, config, gridSize);
}

/**
 * Synchronous version using cached layout (for React useMemo)
 * This is a wrapper that returns a Promise-based hook-friendly interface.
 */
export function useCircuitLayout(config: SemanticCircuitConfig) {
    // This would be used with React Suspense or useEffect
    // For now, return the async function
    return computeCircuitLayout(config);
}
