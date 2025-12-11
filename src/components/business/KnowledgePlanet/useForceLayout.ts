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
 * A lightweight 2D force-directed layout hook.
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
    const simulationRef = useRef<{ nodes: PhysicsNode[] }>({ nodes: [] });
    // Force re-render positions
    const [positions, setPositions] = useState<Vector2[]>([]);

    // Constants for 2D - tuned for good spread
    const REPULSION_RADIUS = Math.max(60, radius * 0.6); // Wider interaction radius
    const REPULSION_STRENGTH = 2.0; // Stronger repulsion
    const GRAVITY_STRENGTH = 0.002;     // Very gentle pull to center
    const CENTER_REPULSION = 0.05;      // Prevent clustering too tight in exact center
    const DAMPING = 0.9;               // Friction
    const HOVER_RADIUS = radius * 0.5;
    const HOVER_FORCE = 2.0;

    useEffect(() => {
        // Initialize nodes if count changes or first run
        const currentNodes = simulationRef.current.nodes;

        if (currentNodes.length !== count || radius <= 0) {
            // Re-initialize with golden angle distribution for even spread
            const newNodes: PhysicsNode[] = [];
            const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

            for (let i = 0; i < count; i++) {
                // Golden angle spiral for initial distribution
                const angle = i * goldenAngle;
                // Spread from center outward, filling the area evenly
                const r = Math.sqrt((i + 0.5) / count) * radius * 0.8;

                newNodes.push({
                    x: r * Math.cos(angle),
                    y: r * Math.sin(angle),
                    vx: 0,
                    vy: 0,
                    id: nodeIds[i] || `node-${i}`
                });
            }
            simulationRef.current.nodes = newNodes;
            // Immediately sync to state
            setPositions(newNodes.map(n => ({ x: n.x, y: n.y })));
        } else {
            // Update IDs in place just in case
            for (let i = 0; i < count; i++) {
                if (simulationRef.current.nodes[i]) {
                    simulationRef.current.nodes[i].id = nodeIds[i] || `node-${i}`;
                }
            }
        }
    }, [count, radius, nodeIds]);


    useEffect(() => {
        let frameId: number;
        let lastTime = performance.now();

        const tick = (time: number) => {
            const dt = Math.min((time - lastTime) / 16, 2); // Cap delta time
            lastTime = time;

            const nodes = simulationRef.current.nodes;
            const nodeCount = nodes.length;

            // 1. Calculate Forces
            for (let i = 0; i < nodeCount; i++) {
                const node = nodes[i];
                let fx = 0, fy = 0;

                // Center Gravity (Surface Tension / Containment)
                const distToCenterSq = node.x * node.x + node.y * node.y;
                const distToCenter = Math.sqrt(distToCenterSq);

                if (distToCenter > 0) {
                    // Pull to center
                    const pull = -distToCenter * GRAVITY_STRENGTH;
                    fx += (node.x / distToCenter) * pull;
                    fy += (node.y / distToCenter) * pull;

                    // Minor repulsion from exact center to avoid stacking
                    if (distToCenter < radius * 0.1) {
                        const push = (radius * 0.1 - distToCenter) * CENTER_REPULSION;
                        fx += (node.x / distToCenter) * push;
                        fy += (node.y / distToCenter) * push;
                    }
                }

                // Node Repulsion (Collision)
                for (let j = 0; j < nodeCount; j++) {
                    if (i === j) continue;
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy;

                    // Optimization: Only repulsive if close
                    if (distSq < REPULSION_RADIUS * REPULSION_RADIUS && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const force = (REPULSION_RADIUS - dist) * REPULSION_STRENGTH;
                        fx += (dx / dist) * force;
                        fy += (dy / dist) * force;
                    }
                }

                // Hover Interaction
                if (activeHoverId) {
                    if (node.id === activeHoverId) {
                        // Hovered node stats relatively put or gently floats?
                        // Let's give it slightly more "mass" or resistance to movement?
                        // Or maybe it attracts neighbors slightly?
                    } else {
                        // Find the hovered node
                        const hoveredNode = nodes.find(n => n.id === activeHoverId);
                        if (hoveredNode) {
                            const dx = node.x - hoveredNode.x;
                            const dy = node.y - hoveredNode.y;
                            const distSq = dx * dx + dy * dy;

                            if (distSq < HOVER_RADIUS * HOVER_RADIUS && distSq > 0) {
                                const dist = Math.sqrt(distSq);
                                // Push away neighbors to clear view
                                const force = (HOVER_RADIUS - dist) * HOVER_FORCE;
                                fx += (dx / dist) * force;
                                fy += (dy / dist) * force;
                            }
                        }
                    }
                }

                // Apply Velocity
                node.vx = (node.vx + fx) * DAMPING;
                node.vy = (node.vy + fy) * DAMPING;

                // Update Position
                node.x += node.vx * dt;
                node.y += node.vy * dt;
            }

            // Sync state for React
            setPositions(nodes.map(n => ({ x: n.x, y: n.y })));

            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [count, radius, activeHoverId, REPULSION_RADIUS, REPULSION_STRENGTH, GRAVITY_STRENGTH, DAMPING]);

    return positions;
}
