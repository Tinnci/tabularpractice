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

import ELK, { type ElkNode, type ElkExtendedEdge, type ElkPort } from 'elkjs/lib/elk.bundled.js';
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

        // Spacing - increased for better readability
        'elk.spacing.nodeNode': String(merged.minSpacing * merged.gridSize * 1.5), // Horizontal spacing in layer
        'elk.layered.spacing.nodeNodeBetweenLayers': String(merged.minSpacing * merged.gridSize * 2.5), // Vertical spacing between layers

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
    const options: Record<string, string> = {
        // Force ports to be centered on their side to match fixed SVG pins
        'elk.portAlignment.default': 'CENTER'
    };
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

    // Handle orientation hints -> Force center alignment is now global above

    return options;
}

// ============== Conversion Functions ==============

/**
 * Convert semantic config to ELK graph
 */
// Helper to create a port
function createPort(id: string, side: 'WEST' | 'EAST' | 'NORTH' | 'SOUTH' | 'CENTER'): ElkPort {
    const port: ElkPort = {
        id,
        layoutOptions: {
            'elk.port.side': side === 'CENTER' ? 'WEST' : side, // CENTER fallback
        }
    };

    // For specific centering or fixed positions, we rely on side constraints
    return port;
}

/**
 * Generate ports for a component based on its type and orientation
 */
function getComponentPorts(
    comp: SemanticCircuitComponent
): ElkPort[] {
    const ports: ElkPort[] = [];
    const isVertical = comp.orientation === 'vertical';

    // 1. Two-terminal components (Resistor, Capacitor, Inductor, Voltage Source)
    if (['resistor', 'capacitor', 'inductor', 'voltage-source', 'current-source', 'switch'].includes(comp.type)) {
        if (isVertical) {
            // Vertical: Top and Bottom
            ports.push(createPort(`${comp.id}_p1`, 'NORTH'));
            ports.push(createPort(`${comp.id}_p2`, 'SOUTH'));
        } else {
            // Horizontal: Left and Right
            // If direction is Left-to-Right, strict inputs usually on West, Outputs on East
            // But allowing both sides handles bidirectional flow flexibility
            ports.push(createPort(`${comp.id}_left`, 'WEST'));
            ports.push(createPort(`${comp.id}_right`, 'EAST'));
        }
    }
    // 2. Ground - Single top port
    else if (comp.type === 'ground') {
        ports.push(createPort(`${comp.id}_top`, 'NORTH'));
    }
    // 3. One-port terminals (Input/Output labels treated as nodes)
    else if (comp.role === 'input') {
        ports.push(createPort(`${comp.id}_p`, 'EAST')); // Input feeds into circuit to the right
    }
    else if (comp.role === 'output') {
        ports.push(createPort(`${comp.id}_p`, 'WEST')); // Output receives from circuit to the left
    }
    // 4. Nodes (Connections points) - Omni-directional
    else if (comp.type === 'node') {
        // Nodes are tricky. To allow connections from all sides, we can define one center port
        // or ports on all 4 sides. 
        // ELK works best with explicit sides. Let's add all 4 to be safe.
        ports.push(createPort(`${comp.id}_n`, 'NORTH'));
        ports.push(createPort(`${comp.id}_s`, 'SOUTH'));
        ports.push(createPort(`${comp.id}_e`, 'EAST'));
        ports.push(createPort(`${comp.id}_w`, 'WEST'));
    }

    return ports;
}

/**
 * Convert semantic config to ELK graph
 */
function toElkGraph(config: SemanticCircuitConfig): ElkGraph {
    const constraints = config.constraints || {};

    // Build nodes
    const children: ElkNode[] = config.components.map(comp => {
        const baseDims = COMPONENT_DIMENSIONS[comp.type] || { width: 40, height: 40 };
        const isVertical = comp.orientation === 'vertical';

        // Swap dimensions if vertical
        // Note: Ground assumes standardized upright orientation, so we usually don't swap unless explicitly requested
        let width = baseDims.width;
        let height = baseDims.height;

        if (isVertical && comp.type !== 'ground') {
            width = baseDims.height;
            height = baseDims.width;
        }

        const nodeMsg: Record<string, string> = getNodeLayoutOptions(comp, constraints);

        // Ensure ports are respected
        nodeMsg['elk.portConstraints'] = 'FIXED_SIDE';

        return {
            id: comp.id,
            width,
            height,
            layoutOptions: nodeMsg,
            labels: comp.label ? [{ text: comp.label }] : [],
            ports: getComponentPorts(comp),
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
    originalConfig: SemanticCircuitConfig
): { components: CircuitComponent[]; connections: CircuitConnection[] } {
    // We used to snap to gridSize (20px), but this caused misalignment for components 
    // whose ports are not on the 20px grid (e.g. Resistor pins at +/- 30px, Ground pin at -15px).
    // ELK computes precise routing based on ports, so we should trust its output coordinate precision.
    // Rounding to 1px is sufficient to avoid sub-pixel blurring.
    const snap = (val: number) => Math.round(val);

    // Map ELK nodes back to components
    const components: CircuitComponent[] = originalConfig.components.map(orig => {
        const elkNode = elkGraph.children?.find((n: ElkNode) => n.id === orig.id);

        // Determine rotation based on orientation
        let rotation: 0 | 90 | 180 | 270 = 0;

        // Vertical components (R, C, L, V) need 90 deg rotation
        if (orig.orientation === 'vertical') {
            rotation = 90;
        }
        // Ground is drawn upright (0 deg) by default in our SVG symbols
        // so we don't need to rotate it unless explicitly requested (which is rare)

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
        let startPoint: { x: number; y: number } | undefined;
        let endPoint: { x: number; y: number } | undefined;

        if (elkEdge?.sections?.[0]) {
            const section = elkEdge.sections[0];

            startPoint = {
                x: snap(section.startPoint.x),
                y: snap(section.startPoint.y)
            };

            endPoint = {
                x: snap(section.endPoint.x),
                y: snap(section.endPoint.y)
            };

            if (section.bendPoints) {
                bendPoints = section.bendPoints.map(bp => ({
                    x: snap(bp.x),
                    y: snap(bp.y),
                }));
            }
        }

        return {
            from: orig.from,
            to: orig.to,
            style: orig.style,
            startPoint,
            endPoint,
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
    // Convert to ELK format
    const elkGraph = toElkGraph(config);

    // Run ELK layout
    const layoutedGraph = await elk.layout(elkGraph);

    // Convert back to our format
    return fromElkGraph(layoutedGraph as ElkGraph, config);
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
