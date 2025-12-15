import { describe, test, expect } from "bun:test";
import { computeCircuitLayout } from "../circuit-layout-engine";
import type { SemanticCircuitConfig } from "../semantic-circuit-types";
import { CircuitComponent } from "../types";

// Standard Q6 Circuit Config for Testing
const TEST_CONFIG: SemanticCircuitConfig = {
    components: [
        { id: "vs", type: "voltage-source", label: "uᵢ(t)", role: "input" },
        { id: "r1", type: "resistor", label: "R₁" },
        { id: "c1", type: "capacitor", label: "C₁", orientation: "vertical" },
        { id: "r2", type: "resistor", label: "R₂" },
        { id: "c2", type: "capacitor", label: "C₂", orientation: "vertical" },
        { id: "out", type: "node", role: "output" },
        { id: "gnd", type: "ground", role: "ground" },
    ],
    connections: [
        { from: "vs", to: "r1" },
        { from: "r1", to: "c1" },
        { from: "r1", to: "r2" },
        { from: "r2", to: "c2" },
        { from: "r2", to: "out" },
        { from: "c1", to: "gnd" },
        { from: "c2", to: "gnd" },
    ],
    constraints: {
        flowDirection: "left-to-right",
        groundAtBottom: true,
    },
};

type Box = { x: number; y: number; width: number; height: number; id: string };

function getComponentBox(comp: CircuitComponent): Box {
    // ELK layout returns center coordinates, but dimensions are usually full width/height
    // However, in our fromElkGraph, we map center x/y.
    // Let's assume the 'position' is center.
    // src/components/question/ui/ControlVisualization/CircuitSymbols.tsx defines symbols centered at (0,0)
    // CircuitLayoutEngine returns { position: {x,y}, ... }

    // We need to know the dimensions. Since fromElkGraph doesn't return width/height in the final CircuitComponent,
    // we must estimate them from COMPONENT_DIMENSIONS or similar.
    // BUT! Wait, fromElkGraph returns components with `position` (center).
    // Let's use standard dimensions for collision checking.

    const w = 60; // Standard large width
    const h = 60; // Standard large height to be safe
    // Or customize based on type if we had access to dims here

    return {
        id: comp.id,
        x: comp.position.x - w / 2,
        y: comp.position.y - h / 2,
        width: w,
        height: h
    };
}

describe("Circuit Layout Geometric Validation", () => {

    test("should have no overlapping components", async () => {
        const layout = await computeCircuitLayout(TEST_CONFIG);
        const boxes = layout.components.map(getComponentBox);

        const overlaps: string[] = [];

        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i];
                const b = boxes[j];

                // Check intersection with a small buffer (e.g. 5px) to allow touching but not overlapping
                const buffer = -5;

                const isOverlapping =
                    (a.x < b.x + b.width + buffer) &&
                    (a.x + a.width + buffer > b.x) &&
                    (a.y < b.y + b.height + buffer) &&
                    (a.y + a.height + buffer > b.y);

                if (isOverlapping) {
                    overlaps.push(`${a.id} overlaps with ${b.id}`);
                }
            }
        }

        if (overlaps.length > 0) {
            console.error("Detected Overlaps:", overlaps);
        }

        expect(overlaps).toHaveLength(0);
    });

    test("should not have excessive empty space (sparsity check)", async () => {
        const layout = await computeCircuitLayout(TEST_CONFIG);
        const boxes = layout.components.map(getComponentBox);

        // Calculate total bounding box of the circuit
        const minX = Math.min(...boxes.map(b => b.x));
        const maxX = Math.max(...boxes.map(b => b.x + b.width));
        const minY = Math.min(...boxes.map(b => b.y));
        const maxY = Math.max(...boxes.map(b => b.y + b.height));

        const totalArea = (maxX - minX) * (maxY - minY);

        // Calculate sum of individual component areas
        const componentArea = boxes.reduce((sum, b) => sum + (b.width * b.height), 0);

        // Sparsity Ratio
        // Higher means more empty space.
        // For a circuit diagram, we expect some space for wires.
        // 5-10x consists of normal wire spacing. >50x implies huge gaps.
        const ratio = totalArea / componentArea;

        console.log(`Layout Sparsity Ratio: ${ratio.toFixed(2)}`);

        // This threshold needs tuning based on typical ELK output
        expect(ratio).toBeLessThan(50);
    });

    test("should align connections precisely to component ports", async () => {
        const layout = await computeCircuitLayout(TEST_CONFIG);

        // Define expected port offsets for standard components
        // These must match CircuitSymbols.tsx and circuit-layout-engine.ts logic
        const getValidPorts = (comp: CircuitComponent) => {
            const ports: { x: number, y: number }[] = [];
            const { x, y } = comp.position;

            if (comp.type === 'resistor') {
                // Horizontal: left/right +/- 30
                ports.push({ x: x - 30, y: y });
                ports.push({ x: x + 30, y: y });
            }
            else if (comp.type === 'capacitor' && (comp.rotation === 90 || comp.rotation === 270)) {
                // Vertical: top/bottom +/- 30
                ports.push({ x: x, y: y - 30 }); // Top (North)
                ports.push({ x: x, y: y + 30 }); // Bottom (South)
            }
            else if (comp.type === 'ground') {
                // Ground: Top at -15
                ports.push({ x: x, y: y - 15 });
            }
            // Add other types as needed for coverage

            return ports;
        };

        const misalignmentErrors: string[] = [];

        layout.connections.forEach((conn, idx) => {
            const fromComp = layout.components.find(c => c.id === conn.from);
            const toComp = layout.components.find(c => c.id === conn.to);

            if (!fromComp || !toComp) return; // Should be caught by other tests

            // Check Start Point
            if (conn.startPoint) {
                const validPorts = getValidPorts(fromComp);
                // If we have defined ports for this type, check if startPoint matches one of them
                if (validPorts.length > 0) {
                    const match = validPorts.some(p =>
                        Math.abs(p.x - conn.startPoint!.x) < 1 &&
                        Math.abs(p.y - conn.startPoint!.y) < 1
                    );
                    if (!match) {
                        misalignmentErrors.push(
                            `Edge ${idx} start (${conn.startPoint.x}, ${conn.startPoint.y}) does not match any port of ${fromComp.id} (${fromComp.type})`
                        );
                    }
                }
            }

            // Check End Point
            if (conn.endPoint) {
                const validPorts = getValidPorts(toComp);
                if (validPorts.length > 0) {
                    const match = validPorts.some(p =>
                        Math.abs(p.x - conn.endPoint!.x) < 1 &&
                        Math.abs(p.y - conn.endPoint!.y) < 1
                    );
                    if (!match) {
                        misalignmentErrors.push(
                            `Edge ${idx} end (${conn.endPoint.x}, ${conn.endPoint.y}) does not match any port of ${toComp.id} (${toComp.type})`
                        );
                    }
                }
            }
        });

        if (misalignmentErrors.length > 0) {
            console.error("Misalignment Errors:", misalignmentErrors);
        }

        expect(misalignmentErrors).toHaveLength(0);
    });

    test("should use integer pixel coordinates", async () => {
        const layout = await computeCircuitLayout(TEST_CONFIG);

        const nonInteger = layout.components.filter(c =>
            !Number.isInteger(c.position.x) || !Number.isInteger(c.position.y)
        );

        if (nonInteger.length > 0) {
            console.error("Non-integer component positions:", nonInteger.map(c => `${c.id}(${c.position.x},${c.position.y})`));
        }

        expect(nonInteger).toHaveLength(0);
    });
});
