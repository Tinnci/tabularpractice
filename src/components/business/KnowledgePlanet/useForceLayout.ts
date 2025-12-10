import { useRef, useEffect, useState } from 'react';

// Simple Vector3 interface
interface Vector3 {
    x: number;
    y: number;
    z: number;
}

// Physics Node extends position with velocity
interface PhysicsNode extends Vector3 {
    vx: number;
    vy: number;
    vz: number;
    id: string; // To identify nodes
}

/**
 * A lightweight 3D force-directed layout hook.
 * 
 * @param count Number of nodes
 * @param radius Radius of the container/gravity well
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
    // Force re-render only when positions are stable enough or on frame
    const [positions, setPositions] = useState<Vector3[]>([]);

    // Constants
    const REPULSION_RADIUS = radius * 0.4; // Nodes push each other if closer than this
    const REPULSION_STRENGTH = 0.5;
    const GRAVITY_STRENGTH = 0.01;      // Pull to center
    const DAMPING = 0.9;                // Friction
    const HOVER_REPULSION_RADIUS = radius * 0.5; // Mouse pushes harder
    const HOVER_REPULSION_STRENGTH = 2.0;

    useEffect(() => {
        // Initialize nodes if count changes or first run
        const currentNodes = simulationRef.current.nodes;

        if (currentNodes.length !== count) {
            // Re-initialize (or adjust length)
            const newNodes: PhysicsNode[] = [];
            for (let i = 0; i < count; i++) {
                // Try to keep existing position if available (stability)
                if (currentNodes[i]) {
                    newNodes.push(currentNodes[i]);
                } else {
                    // Random start position within sphere
                    // Use Fibonacci/Golden Spiral for better initial distribution?
                    // Or just random spherical for "explosion" effect
                    const phi = Math.acos(-1 + (2 * i) / count);
                    const theta = Math.sqrt(count * Math.PI) * phi;
                    const r = radius * 0.8; // Start slightly compacted

                    newNodes.push({
                        x: r * Math.sin(phi) * Math.cos(theta),
                        y: r * Math.sin(phi) * Math.sin(theta),
                        z: r * Math.cos(phi),
                        vx: 0,
                        vy: 0,
                        vz: 0,
                        id: nodeIds[i] || `node-${i}`
                    });
                }
            }
            simulationRef.current.nodes = newNodes;
        } else {
            // Update IDs in place just in case
            for (let i = 0; i < count; i++) {
                simulationRef.current.nodes[i].id = nodeIds[i] || `node-${i}`;
            }
        }
    }, [count, radius, nodeIds]);

    useEffect(() => {
        let frameId: number;
        let lastTime = performance.now();

        const tick = (time: number) => {
            const dt = Math.min((time - lastTime) / 16, 2); // Cap at 2x speed for lag
            lastTime = time;

            const nodes = simulationRef.current.nodes;
            const nodeCount = nodes.length;

            // 1. Calculate Forces
            for (let i = 0; i < nodeCount; i++) {
                const node = nodes[i];
                let fx = 0, fy = 0, fz = 0;

                // Center Gravity (Surface Tension)
                // Pulls nodes towards (0,0,0)
                const distToCenter = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
                if (distToCenter > 0) {
                    // Stronger pull if far away (Rubber band)
                    const pull = -distToCenter * GRAVITY_STRENGTH;
                    fx += (node.x / distToCenter) * pull;
                    fy += (node.y / distToCenter) * pull;
                    fz += (node.z / distToCenter) * pull;
                }

                // Node Repulsion (Collision)
                for (let j = 0; j < nodeCount; j++) {
                    if (i === j) continue;
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dz = node.z - other.z;
                    const distSq = dx * dx + dy * dy + dz * dz;

                    // Optimization: Only repulsive if close
                    if (distSq < REPULSION_RADIUS * REPULSION_RADIUS && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const force = (REPULSION_RADIUS - dist) * REPULSION_STRENGTH;
                        fx += (dx / dist) * force;
                        fy += (dy / dist) * force;
                        fz += (dz / dist) * force;
                    }
                }

                // Hover Interaction Repulsion
                if (activeHoverId) {
                    // Check if *this* node is the hovered one? Or if *neighbor* is hovered?
                    // User requested: "Mouse hover will gather without overlapping" (actually "mouse hover will gather" or "mouse hover repels"?)
                    // "鼠标hover了会聚拢又不重复的" -> "Hover will gather (bring closer?) but not overlap".
                    // Usually "Lens" effect means pushing neighbors AWAY to see current clearly.
                    // Or maybe pulling current node TO mouse?
                    // Let's interpret as: Hovered node stays/moves to front? 
                    // Or neighbors push away.

                    // Let's implement: Hovered node is attractive? OR Hovered node pushes others away?
                    // Typically 'Fish eye': Push others away.
                    // If `node.id` is the hovered one, maybe it pulls to center?
                    // If another node is hovered, it gets pushed away from THAT node.

                    if (node.id === activeHoverId) {
                        // Hovered node: Pull to camera/front slightly? Or just stay put?
                        // Let's gently pull it towards user (negative Z)
                        // fz -= 2.0; 
                    } else {
                        // Find the hovered node
                        const hoveredNode = nodes.find(n => n.id === activeHoverId);
                        if (hoveredNode) {
                            const dx = node.x - hoveredNode.x;
                            const dy = node.y - hoveredNode.y;
                            const dz = node.z - hoveredNode.z;
                            const distSq = dx * dx + dy * dy + dz * dz;

                            if (distSq < HOVER_REPULSION_RADIUS * HOVER_REPULSION_RADIUS && distSq > 0) {
                                const dist = Math.sqrt(distSq);
                                const force = (HOVER_REPULSION_RADIUS - dist) * HOVER_REPULSION_STRENGTH;
                                fx += (dx / dist) * force;
                                fy += (dy / dist) * force;
                                fz += (dz / dist) * force;
                            }
                        }
                    }
                }

                // Apply Velocity
                node.vx = (node.vx + fx) * DAMPING;
                node.vy = (node.vy + fy) * DAMPING;
                node.vz = (node.vz + fz) * DAMPING;

                // Update Position
                node.x += node.vx * dt;
                node.y += node.vy * dt;
                node.z += node.vz * dt;
            }

            // Sync state for React
            // Optimization: Maybe toggle this usage based on frame rate or only if changed significantly
            setPositions(nodes.map(n => ({ x: n.x, y: n.y, z: n.z })));

            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [count, radius, activeHoverId, REPULSION_RADIUS,
        REPULSION_STRENGTH,
        GRAVITY_STRENGTH,
        DAMPING,
        HOVER_REPULSION_RADIUS,
        HOVER_REPULSION_STRENGTH]);

    return positions;
}
