import { describe, test, expect } from "bun:test";
import { getPortPosition, calculateConnectionPath } from "../CircuitRouteUtils";
import { CircuitComponent, CircuitConnection } from "../types";

describe("CircuitRouteUtils", () => {
    describe("getPortPosition", () => {
        test("should return correct position for horizontal resistor left port", () => {
            const comp: CircuitComponent = {
                id: "r1",
                type: "resistor",
                position: { x: 100, y: 100 },
                rotation: 0,
            };

            const result = getPortPosition(comp, "left");
            expect(result).toEqual({ x: 70, y: 100 });
        });

        test("should return correct position for horizontal resistor right port", () => {
            const comp: CircuitComponent = {
                id: "r1",
                type: "resistor",
                position: { x: 100, y: 100 },
                rotation: 0,
            };

            const result = getPortPosition(comp, "right");
            expect(result).toEqual({ x: 130, y: 100 });
        });

        test("should handle 90° rotation for capacitor", () => {
            const comp: CircuitComponent = {
                id: "c1",
                type: "capacitor",
                position: { x: 100, y: 100 },
                rotation: 90,
            };

            // For 90° rotation: right becomes bottom, left becomes top
            const rightPort = getPortPosition(comp, "right");
            const leftPort = getPortPosition(comp, "left");

            // At 90°: (30, 0) rotates to (0, 30) - bottom
            // At 90°: (-30, 0) rotates to (0, -30) - top
            expect(rightPort.x).toBeCloseTo(100, 0);
            expect(rightPort.y).toBeCloseTo(130, 0);
            expect(leftPort.x).toBeCloseTo(100, 0);
            expect(leftPort.y).toBeCloseTo(70, 0);
        });

        test("should return top port for ground", () => {
            const comp: CircuitComponent = {
                id: "gnd",
                type: "ground",
                position: { x: 100, y: 100 },
            };

            const result = getPortPosition(comp, "top");
            expect(result).toEqual({ x: 100, y: 85 });
        });
    });

    describe("calculateConnectionPath", () => {
        test("should generate valid SVG path for simple connection", () => {
            const fromComp: CircuitComponent = {
                id: "r1",
                type: "resistor",
                position: { x: 100, y: 100 },
                rotation: 0,
            };

            const toComp: CircuitComponent = {
                id: "r2",
                type: "resistor",
                position: { x: 200, y: 100 },
                rotation: 0,
            };

            const connection: CircuitConnection = {
                from: "r1",
                to: "r2",
            };

            const path = calculateConnectionPath(connection, fromComp, toComp);

            // Should start with M (moveTo)
            expect(path.startsWith("M")).toBe(true);
            // Should contain L (lineTo) commands
            expect(path.includes("L")).toBe(true);
            // Should not be empty
            expect(path.length).toBeGreaterThan(0);
        });

        test("should handle vertical capacitor to resistor connection", () => {
            const capacitor: CircuitComponent = {
                id: "c1",
                type: "capacitor",
                position: { x: 100, y: 150 },
                rotation: 90,  // Vertical
            };

            const resistor: CircuitComponent = {
                id: "r1",
                type: "resistor",
                position: { x: 100, y: 50 },
                rotation: 0,  // Horizontal
            };

            const connection: CircuitConnection = {
                from: "r1",
                to: "c1",
            };

            const path = calculateConnectionPath(connection, resistor, capacitor);

            // Path should be generated
            expect(path.length).toBeGreaterThan(0);
            expect(path.startsWith("M")).toBe(true);
        });

        test("should handle ground connection", () => {
            const capacitor: CircuitComponent = {
                id: "c1",
                type: "capacitor",
                position: { x: 100, y: 150 },
                rotation: 90,
            };

            const ground: CircuitComponent = {
                id: "gnd",
                type: "ground",
                position: { x: 150, y: 200 },
            };

            const connection: CircuitConnection = {
                from: "c1",
                to: "gnd",
            };

            const path = calculateConnectionPath(connection, capacitor, ground);

            expect(path.length).toBeGreaterThan(0);
            expect(path.startsWith("M")).toBe(true);
        });

        test("should return empty string if components are missing", () => {
            const connection: CircuitConnection = {
                from: "r1",
                to: "r2",
            };

            const path = calculateConnectionPath(connection, undefined, undefined);
            expect(path).toBe("");
        });
    });
});
