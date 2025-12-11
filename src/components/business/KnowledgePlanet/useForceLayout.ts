import { useRef, useEffect, useState } from 'react';

// Simple Vector2 interface
interface Vector2 {
    x: number;
    y: number;
}

// Physics Node extends position with velocity
interface PhysicsNode extends Vector2 {
    vx: number;
    vy: number;
    id: string; // To identify nodes
}

/**
 * A lightweight 2D force-directed layout hook with alpha decay for stability.
 * 
 * @param count Number of nodes
 * @param radius Radius of the container/gravity well (used for scale)
 * @param nodeIds Array of node IDs to track stable identity
 * @param activeHoverId ID of the node currently hovered (for repulsion)
 */
export function useForceLayout(
    count: number,
    radius: number,
    nodeIds: string[],
    activeHoverId: string | null = null
) {
    // Store simulation state in ref to avoid re-renders during calculation
    const simulationRef = useRef<{
        nodes: PhysicsNode[];
        alpha: number;  // Simulation "heat" - decays to 0
        alphaTarget: number;
    }>({ nodes: [], alpha: 1, alphaTarget: 0 });

    // Force re-render positions
    const [positions, setPositions] = useState<Vector2[]>([]);

    // Constants for 2D - tuned for good spread and stability
    const REPULSION_RADIUS = Math.max(60, radius * 0.5);
    const REPULSION_STRENGTH = 1.5;
    const GRAVITY_STRENGTH = 0.003;
    const DAMPING = 0.6;  // Higher damping = faster stabilization
    const ALPHA_DECAY = 0.02;  // How fast simulation cools down
    const ALPHA_MIN = 0.001;  // When to consider simulation "stable"
    const HOVER_RADIUS = radius * 0.4;
    const HOVER_FORCE = 1.5;

    useEffect(() => {
        // Initialize nodes if count changes or first run
        const currentNodes = simulationRef.current.nodes;

        if (currentNodes.length !== count) {
            // Re-initialize with golden angle distribution for even spread
            const newNodes: PhysicsNode[] = [];
            const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

            for (let i = 0; i < count; i++) {
                // Golden angle spiral for initial distribution
                const angle = i * goldenAngle;
                // Spread from center outward, filling the area evenly
                const r = Math.sqrt((i + 0.5) / count) * radius * 0.85;

                newNodes.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle),
                    vx: 0,
                    vy: 0,
                    id: nodeIds[i] || `node-${i}`
                });
            }
            simulationRef.current.nodes = newNodes;
            simulationRef.current.alpha = 1; // Restart simulation
            // Note: positions will be synced by the simulation tick
        } else {
            // Update IDs in place just in case
            for (let i = 0; i < count; i++) {
                if (simulationRef.current.nodes[i]) {
                    simulationRef.current.nodes[i].id = nodeIds[i] || `node-${i}`;
                }
            }
        }
    }, [count, radius, nodeIds]);

    // Restart simulation on hover
    useEffect(() => {
        if (activeHoverId) {
            simulationRef.current.alpha = Math.max(simulationRef.current.alpha, 0.3);
        }
    }, [activeHoverId]);

    useEffect(() => {
        let frameId: number;

        const tick = () => {
            const sim = simulationRef.current;
            const nodes = sim.nodes;
            const nodeCount = nodes.length;

            // Alpha decay - simulation cools down over time
            sim.alpha += (sim.alphaTarget - sim.alpha) * ALPHA_DECAY;

            // If simulation is stable, reduce update frequency
            if (sim.alpha < ALPHA_MIN && !activeHoverId) {
                // Still request next frame but skip heavy calculation
                frameId = requestAnimationFrame(tick);
                return;
            }

            // 1. Calculate Forces
            for (let i = 0; i < nodeCount; i++) {
                const node = nodes[i];
                let fx = 0, fy = 0;

                // Center Gravity
                const distToCenter = Math.sqrt(node.x * node.x + node.y * node.y);
                if (distToCenter > 0) {
                    const pull = -distToCenter * GRAVITY_STRENGTH;
                    fx += (node.x / distToCenter) * pull;
                    fy += (node.y / distToCenter) * pull;
                }

                // Node Repulsion (Collision)
                for (let j = 0; j < nodeCount; j++) {
                    if (i === j) continue;
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < REPULSION_RADIUS * REPULSION_RADIUS && distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        const force = (REPULSION_RADIUS - dist) * REPULSION_STRENGTH * sim.alpha;
                        fx += (dx / dist) * force;
                        fy += (dy / dist) * force;
                    }
                }

                // Hover Interaction - push neighbors away
                if (activeHoverId && node.id !== activeHoverId) {
                    const hoveredNode = nodes.find(n => n.id === activeHoverId);
                    if (hoveredNode) {
                        const dx = node.x - hoveredNode.x;
                        const dy = node.y - hoveredNode.y;
                        const distSq = dx * dx + dy * dy;

                        if (distSq < HOVER_RADIUS * HOVER_RADIUS && distSq > 0.01) {
                            const dist = Math.sqrt(distSq);
                            const force = (HOVER_RADIUS - dist) * HOVER_FORCE;
                            fx += (dx / dist) * force;
                            fy += (dy / dist) * force;
                        }
                    }
                }

                // Apply Velocity with damping (scaled by alpha)
                node.vx = (node.vx + fx * sim.alpha) * DAMPING;
                node.vy = (node.vy + fy * sim.alpha) * DAMPING;

                // Update Position
                node.x += node.vx;
                node.y += node.vy;
            }

            // Sync state for React
            setPositions(nodes.map(n => ({ x: n.x, y: n.y })));

            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [count, radius, activeHoverId, REPULSION_RADIUS, HOVER_RADIUS, REPULSION_STRENGTH, GRAVITY_STRENGTH, DAMPING, ALPHA_DECAY, ALPHA_MIN, HOVER_FORCE]);

    return positions;
}

