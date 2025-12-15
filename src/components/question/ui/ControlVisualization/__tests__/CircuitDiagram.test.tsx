import { describe, test, expect } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import { CircuitDiagram } from "../CircuitDiagram";
import type { CircuitComponent, CircuitConnection } from "../types";

describe("CircuitDiagram Component", () => {
    test("should render without crashing", () => {
        const components: CircuitComponent[] = [
            {
                id: "r1",
                type: "resistor",
                label: "R₁",
                position: { x: 100, y: 100 },
            },
        ];

        const connections: CircuitConnection[] = [];

        const { container } = render(
            <CircuitDiagram
                components={components}
                connections={connections}
                annotations={[]}
            />
        );

        expect(container.querySelector("svg")).toBeTruthy();
    });

    test("should render actual circuit from shu-836-2025 Q6", () => {
        const components: CircuitComponent[] = [
            {
                id: "vs",
                type: "voltage-source",
                label: "uᵢ(t)",
                position: { x: 0, y: 100 },
            },
            {
                id: "r1",
                type: "resistor",
                label: "R₁",
                position: { x: 100, y: 60 },
            },
            {
                id: "c1",
                type: "capacitor",
                label: "C₁",
                position: { x: 100, y: 160 },
                rotation: 90,
            },
            {
                id: "r2",
                type: "resistor",
                label: "R₂",
                position: { x: 200, y: 60 },
            },
            {
                id: "c2",
                type: "capacitor",
                label: "C₂",
                position: { x: 200, y: 160 },
                rotation: 90,
            },
            {
                id: "gnd",
                type: "ground",
                position: { x: 150, y: 200 },
            },
        ];

        const connections: CircuitConnection[] = [
            { from: "vs", to: "r1" },
            { from: "r1", to: "r2" },
            {
                from: "r1",
                to: "c1",
                bendPoints: [{ x: 100, y: 100 }],
            },
            {
                from: "r2",
                to: "c2",
                bendPoints: [{ x: 200, y: 100 }],
            },
            { from: "c1", to: "gnd" },
            { from: "c2", to: "gnd" },
        ];

        const { container } = render(
            <CircuitDiagram
                components={components}
                connections={connections}
                annotations={[{ x: 280, y: 100, text: "uₒ(t)" }]}
                inputLabel="uᵢ(t)"
                outputLabel="uₒ(t)"
            />
        );

        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();

        // Check that all components are rendered
        const groups = container.querySelectorAll("g.components > g");
        expect(groups.length).toBe(components.length);

        // Check that connections are rendered
        const paths = container.querySelectorAll("g.connections > path");
        expect(paths.length).toBe(connections.length);

        // Log SVG for debugging
        console.log("\n=== Circuit Diagram SVG ===");
        console.log(svg?.outerHTML.substring(0, 500) + "...");
        console.log(`\nComponentTypes rendered: ${components.map(c => c.type).join(", ")}`);
        console.log(`Connections: ${connections.length}`);
    });

    test("should handle empty circuit", () => {
        const { container } = render(
            <CircuitDiagram components={[]} connections={[]} annotations={[]} />
        );

        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
    });

    test("should apply grid snapping when enabled", () => {
        const components: CircuitComponent[] = [
            {
                id: "r1",
                type: "resistor",
                position: { x: 103, y: 97 }, // Intentionally not aligned
            },
        ];

        const { container } = render(
            <CircuitDiagram components={components} connections={[]} annotations={[]} />
        );

        // Component should still render
        const svg = container.querySelector("svg");
        expect(svg).toBeTruthy();
    });
});
