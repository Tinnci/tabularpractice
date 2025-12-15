import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import { ControlVisualizationRenderer } from "../ControlVisualizationRenderer";

describe("ControlVisualizationRenderer Integration", () => {
    test("should render circuit-diagram type", () => {
        const config = {
            type: "circuit-diagram" as const,
            title: "Test Circuit",
            config: {
                components: [
                    {
                        id: "vs",
                        type: "voltage-source" as const,
                        label: "uᵢ(t)",
                        position: { x: 0, y: 100 },
                    },
                    {
                        id: "r1",
                        type: "resistor" as const,
                        label: "R₁",
                        position: { x: 100, y: 60 },
                    },
                    {
                        id: "c1",
                        type: "capacitor" as const,
                        label: "C₁",
                        position: { x: 100, y: 160 },
                        rotation: 90 as const,
                    },
                    {
                        id: "gnd",
                        type: "ground" as const,
                        position: { x: 150, y: 200 },
                    },
                ],
                connections: [
                    { from: "vs", to: "r1" },
                    { from: "r1", to: "c1", bendPoints: [{ x: 100, y: 100 }] },
                    { from: "c1", to: "gnd" },
                ],
                annotations: [{ x: 280, y: 100, text: "uₒ(t)" }],
                inputLabel: "uᵢ(t)",
                outputLabel: "uₒ(t)",
            },
        };

        const { container } = render(<ControlVisualizationRenderer config={config} />);

        // Should render SVG
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();

        // Should have title
        const title = container.textContent;
        expect(title).toContain("电路图");

        // Should have components
        const componentGroups = container.querySelectorAll("g.components > g");
        expect(componentGroups.length).toBe(4);

        // Should have connections
        const connectionPaths = container.querySelectorAll("g.connections > path");
        expect(connectionPaths.length).toBe(3);

        console.log("\n=== Renderer Output ===");
        console.log(`Title found: ${title?.includes("电路图")}`);
        console.log(`Components rendered: ${componentGroups.length}`);
        console.log(`Connections rendered: ${connectionPaths.length}`);
    });

    test("should handle shu-836-2025 Q6 full configuration", () => {
        // Full configuration from actual data
        const config = {
            type: "circuit-diagram" as const,
            title: "RC滤波电路",
            config: {
                components: [
                    {
                        id: "vs",
                        type: "voltage-source" as const,
                        label: "uᵢ(t)",
                        position: { x: 0, y: 100 },
                    },
                    {
                        id: "r1",
                        type: "resistor" as const,
                        label: "R₁",
                        position: { x: 100, y: 60 },
                    },
                    {
                        id: "c1",
                        type: "capacitor" as const,
                        label: "C₁",
                        position: { x: 100, y: 160 },
                        rotation: 90 as const,
                    },
                    {
                        id: "r2",
                        type: "resistor" as const,
                        label: "R₂",
                        position: { x: 200, y: 60 },
                    },
                    {
                        id: "c2",
                        type: "capacitor" as const,
                        label: "C₂",
                        position: { x: 200, y: 160 },
                        rotation: 90 as const,
                    },
                    {
                        id: "gnd",
                        type: "ground" as const,
                        position: { x: 150, y: 200 },
                    },
                ],
                connections: [
                    { from: "vs", to: "r1" },
                    { from: "r1", to: "r2" },
                    { from: "r1", to: "c1", bendPoints: [{ x: 100, y: 100 }] },
                    { from: "r2", to: "c2", bendPoints: [{ x: 200, y: 100 }] },
                    { from: "c1", to: "gnd" },
                    { from: "c2", to: "gnd" },
                ],
                annotations: [{ x: 280, y: 100, text: "uₒ(t)" }],
                inputLabel: "uᵢ(t)",
                outputLabel: "uₒ(t)",
            },
        };

        const { container } = render(<ControlVisualizationRenderer config={config} />);

        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();

        // Verify all components rendered
        expect(container.querySelectorAll("g.components > g").length).toBe(6);

        // Verify all connections rendered
        expect(container.querySelectorAll("g.connections > path").length).toBe(6);

        // Verify annotations
        const annotations = container.querySelectorAll("g.annotations text");
        expect(annotations.length).toBeGreaterThan(0);

        // Check for toolbar (Grid Snap and Auto Layout buttons)
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBeGreaterThanOrEqual(2);

        console.log("\n=== Full Q6 Circuit ===");
        console.log(`✅ All ${config.config.components.length} components rendered`);
        console.log(`✅ All ${config.config.connections.length} connections rendered`);
        console.log(`✅ Toolbar with ${buttons.length} buttons present`);
    });

    test("should render other visualization types without errors", () => {
        const configs = [
            {
                type: "step-response" as const,
                config: {
                    systemType: "first-order" as const,
                    timeConstant: 1,
                    gain: 1,
                    tRange: [0, 5] as [number, number],
                },
            },
            {
                type: "bode-plot" as const,
                config: {
                    transferFunction: {
                        zeros: [],
                        poles: [{ value: 0 }, { value: 10 }],
                        gain: 20,
                        systemType: 1,
                    },
                    omegaRange: [0.1, 100] as [number, number],
                    showAsymptotes: true,
                    showPhaseMargin: true,
                    showGainMargin: true,
                },
            },
        ];

        configs.forEach((config) => {
            const { container } = render(<ControlVisualizationRenderer config={config} />);
            // Should not crash
            expect(container).toBeTruthy();
        });
    });
});
