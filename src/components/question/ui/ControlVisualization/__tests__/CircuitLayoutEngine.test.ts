import { describe, test, expect } from "bun:test";
import { computeCircuitLayout } from "../circuit-layout-engine";
import type { SemanticCircuitConfig } from "../semantic-circuit-types";

describe("ELK Circuit Layout Engine", () => {
    test("should compute layout for simple RC circuit", async () => {
        const config: SemanticCircuitConfig = {
            components: [
                { id: "vs", type: "voltage-source", label: "uᵢ(t)", role: "input" },
                { id: "r1", type: "resistor", label: "R₁" },
                { id: "c1", type: "capacitor", label: "C₁", orientation: "vertical" },
                { id: "gnd", type: "ground", role: "ground" },
            ],
            connections: [
                { from: "vs", to: "r1" },
                { from: "r1", to: "c1" },
                { from: "c1", to: "gnd" },
            ],
            constraints: {
                flowDirection: "left-to-right",
                groundAtBottom: true,
            },
            inputLabel: "uᵢ(t)",
            outputLabel: "uₒ(t)",
        };

        const result = await computeCircuitLayout(config);

        // Should return all components with positions
        expect(result.components).toHaveLength(4);
        expect(result.connections).toHaveLength(3);

        // All components should have valid positions
        result.components.forEach(comp => {
            expect(comp.position).toBeDefined();
            expect(typeof comp.position.x).toBe("number");
            expect(typeof comp.position.y).toBe("number");
            expect(comp.position.x).toBeGreaterThanOrEqual(0);
            expect(comp.position.y).toBeGreaterThanOrEqual(0);
        });

        // Ground should be at bottom (higher Y value)
        const groundComp = result.components.find(c => c.id === "gnd");
        const otherComps = result.components.filter(c => c.id !== "gnd");
        const avgOtherY = otherComps.reduce((sum, c) => sum + c.position.y, 0) / otherComps.length;

        expect(groundComp?.position.y).toBeGreaterThanOrEqual(avgOtherY);

        console.log("\n=== Simple RC Circuit Layout ===");
        result.components.forEach(c => {
            console.log(`${c.id}: (${c.position.x}, ${c.position.y}) rot=${c.rotation}`);
        });
    });

    test("should compute layout for two-stage RC ladder", async () => {
        const config: SemanticCircuitConfig = {
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
            inputLabel: "uᵢ(t)",
            outputLabel: "uₒ(t)",
        };

        const result = await computeCircuitLayout(config);

        expect(result.components).toHaveLength(7);
        expect(result.connections).toHaveLength(7);

        // Input should be leftmost (smallest X)
        const inputComp = result.components.find(c => c.id === "vs");
        const outputComp = result.components.find(c => c.id === "out");

        expect(inputComp?.position.x).toBeLessThan(outputComp?.position.x ?? 0);

        console.log("\n=== Two-Stage RC Ladder Layout ===");
        result.components.forEach(c => {
            console.log(`${c.id}: (${c.position.x}, ${c.position.y}) rot=${c.rotation}`);
        });
    });

    test("should produce integer pixel positions", async () => {
        const config: SemanticCircuitConfig = {
            components: [
                { id: "r1", type: "resistor", label: "R" },
                { id: "c1", type: "capacitor", label: "C" },
            ],
            connections: [
                { from: "r1", to: "c1" },
            ],
            constraints: {
                gridSize: 20,
            },
        };

        const result = await computeCircuitLayout(config);

        // Positions are rounded to integer pixels; we don't snap to grid
        result.components.forEach(comp => {
            expect(Number.isInteger(comp.position.x)).toBe(true);
            expect(Number.isInteger(comp.position.y)).toBe(true);
        });
    });

    test("should handle empty circuit gracefully", async () => {
        const config: SemanticCircuitConfig = {
            components: [],
            connections: [],
        };

        const result = await computeCircuitLayout(config);

        expect(result.components).toHaveLength(0);
        expect(result.connections).toHaveLength(0);
    });
});
