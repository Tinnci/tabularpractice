/**
 * Semantic Circuit Diagram Types
 * 
 * This module defines a semantic data format for circuit diagrams.
 * Instead of specifying pixel coordinates, authors define:
 * - Component types and roles
 * - Connection relationships
 * - Layout constraints (optional)
 * 
 * The layout engine (ELK) then computes optimal positions.
 */

// ============== Semantic Component Roles ==============

/**
 * Semantic roles that affect layout positioning
 */
export type ComponentRole =
    | "input"           // Left side (signal source)
    | "output"          // Right side (signal destination)
    | "power"           // Top (VCC, VDD)
    | "ground"          // Bottom (GND, VSS)
    | "feedback"        // Right-to-left signal path
    | "internal";       // No special positioning

/**
 * Orientation hint for components
 */
export type ComponentOrientation = "horizontal" | "vertical" | "auto";

// ============== Semantic Component Definition ==============

export interface SemanticCircuitComponent {
    id: string;
    type: "resistor" | "capacitor" | "inductor" | "voltage-source" | "current-source" | "ground" | "node" | "opamp";
    label?: string;
    value?: string;                          // e.g., "10kΩ", "100μF"
    role?: ComponentRole;                    // Semantic role (affects positioning)
    orientation?: ComponentOrientation;      // Layout hint

    // Optional: override computed position (for fine-tuning)
    positionHint?: { x?: number; y?: number };
}

// ============== Semantic Connection Definition ==============

export interface SemanticCircuitConnection {
    from: string;
    to: string;
    fromPort?: "left" | "right" | "top" | "bottom";  // Explicit port (optional)
    toPort?: "left" | "right" | "top" | "bottom";
    label?: string;                                   // Optional label (e.g., "i₁")
    style?: "solid" | "dashed";
}

// ============== Layout Constraints ==============

export interface CircuitLayoutConstraints {
    /** Primary signal flow direction */
    flowDirection?: "left-to-right" | "top-to-bottom";

    /** Force ground components to bottom */
    groundAtBottom?: boolean;

    /** Force power components to top */
    powerAtTop?: boolean;

    /** Minimum spacing between components (in grid units) */
    minSpacing?: number;

    /** Grid size for snapping (pixels) */
    gridSize?: number;

    /** Preferred aspect ratio (width/height) */
    aspectRatio?: number;
}

// ============== Semantic Circuit Config ==============

export interface SemanticCircuitConfig {
    /** Components in the circuit */
    components: SemanticCircuitComponent[];

    /** Connections between components */
    connections: SemanticCircuitConnection[];

    /** Layout constraints */
    constraints?: CircuitLayoutConstraints;

    /** Annotations (labels, arrows, etc.) */
    annotations?: Array<{
        text: string;
        position?: "input" | "output" | "custom";
        x?: number;  // Only for "custom" position
        y?: number;
    }>;

    /** I/O labels */
    inputLabel?: string;
    outputLabel?: string;
}

// ============== Full Visualization Config ==============

/**
 * Complete circuit-diagram visualization config.
 * Used in question data (eureka.visualization).
 */
export interface SemanticCircuitVisualizationConfig {
    type: "circuit-diagram";
    title?: string;
    config: SemanticCircuitConfig;
}

// NOTE: ELK types are now imported directly from 'elkjs' in circuit-layout-engine.ts

// ============== Default Constraints ==============

export const DEFAULT_CIRCUIT_CONSTRAINTS: Required<CircuitLayoutConstraints> = {
    flowDirection: "left-to-right",
    groundAtBottom: true,
    powerAtTop: true,
    minSpacing: 2,
    gridSize: 20,
    aspectRatio: 1.5,
};

// ============== Component Dimensions ==============

/**
 * Standard dimensions for circuit components (in pixels)
 */
export const COMPONENT_DIMENSIONS: Record<string, { width: number; height: number }> = {
    "resistor": { width: 60, height: 20 },
    "capacitor": { width: 60, height: 24 },
    "inductor": { width: 60, height: 20 },
    "voltage-source": { width: 60, height: 30 },
    "current-source": { width: 60, height: 30 },
    "ground": { width: 24, height: 30 },
    "node": { width: 6, height: 6 },
    "opamp": { width: 60, height: 60 },
};
