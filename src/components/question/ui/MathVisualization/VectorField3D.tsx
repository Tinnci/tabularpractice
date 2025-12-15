"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text, Sphere } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { Viz3DInfoHint } from "./Viz3DControls";

// ============== Expression Parser ==============

const MATH_CONTEXT = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    exp: Math.exp,
    log: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    pow: Math.pow,
    PI: Math.PI,
    E: Math.E,
};

function parseExpr3D(expr: string): (x: number, y: number, z: number) => number {
    const processed = expr.replace(/\^/g, "**");
    return (x: number, y: number, z: number) => {
        try {
            const fn = new Function(
                "x", "y", "z",
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            return fn(x, y, z, ...Object.values(MATH_CONTEXT));
        } catch {
            return 0;
        }
    };
}

// ============== Arrow 3D ==============

interface Arrow3DProps {
    start: THREE.Vector3;
    direction: THREE.Vector3;
    length?: number;
    color?: string;
}

function Arrow3D({ start, direction, length = 0.3, color = "#3b82f6" }: Arrow3DProps) {
    const normalizedDir = direction.clone().normalize();
    const end = start.clone().add(normalizedDir.clone().multiplyScalar(length));

    // Arrow head
    const headLength = length * 0.2;
    const headWidth = length * 0.1;

    return (
        <group>
            <Line
                points={[start, end]}
                color={color}
                lineWidth={2}
            />
            <mesh position={end.toArray()}>
                <coneGeometry args={[headWidth, headLength, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}

// ============== Vector Field 3D Component ==============

export interface VectorField3DVisualizerProps {
    /** P(x,y,z) - x component */
    fx: string;
    /** Q(x,y,z) - y component */
    fy: string;
    /** R(x,y,z) - z component */
    fz: string;
    /** Range for all axes */
    /** Range for all axes (deprecated, use xRange/yRange/zRange) */
    range?: [number, number];
    xRange?: [number, number];
    yRange?: [number, number];
    zRange?: [number, number];
    /** Number of arrows per axis */
    density?: number;
    /** Arrow scale factor */
    scale?: number;
    height?: number;
    className?: string;
    /** Show divergence coloring (for Gauss theorem) */
    showDivergence?: boolean;
}

export function VectorField3DVisualizer({
    fx,
    fy,
    fz,
    range,
    xRange,
    yRange,
    zRange,
    density = 4,
    scale = 0.3,
    height = 400,
    className,
    showDivergence = false,
}: VectorField3DVisualizerProps) {
    const fnX = useMemo(() => parseExpr3D(fx), [fx]);
    const fnY = useMemo(() => parseExpr3D(fy), [fy]);
    const fnZ = useMemo(() => parseExpr3D(fz), [fz]);

    // Calculate divergence if needed
    const calculateDivergence = useMemo(() => {
        const finalXRange = xRange || range || [-2, 2];
        const finalYRange = yRange || range || [-2, 2];
        const finalZRange = zRange || range || [-2, 2];
        
        if (!showDivergence) return { fn: null, finalXRange, finalYRange, finalZRange };
        return {
            fn: (x: number, y: number, z: number) => {
                const h = 0.01;
                const dPdx = (fnX(x + h, y, z) - fnX(x - h, y, z)) / (2 * h);
                const dQdy = (fnY(x, y + h, z) - fnY(x, y - h, z)) / (2 * h);
                const dRdz = (fnZ(x, y, z + h) - fnZ(x, y, z - h)) / (2 * h);
                return dPdx + dQdy + dRdz;
            },
            finalXRange,
            finalYRange,
            finalZRange
        };
    }, [fnX, fnY, fnZ, showDivergence, xRange, yRange, zRange, range]);

    const arrows = useMemo(() => {
        const result: React.ReactNode[] = [];
        const { finalXRange, finalYRange, finalZRange, fn: divFn } = calculateDivergence;
        const [xMin, xMax] = finalXRange;
        const [yMin, yMax] = finalYRange;
        const [zMin, zMax] = finalZRange;

        const xStep = (xMax - xMin) / density;
        const yStep = (yMax - yMin) / density;
        const zStep = (zMax - zMin) / density;

        for (let i = 0; i <= density; i++) {
            for (let j = 0; j <= density; j++) {
                for (let k = 0; k <= density; k++) {
                    const x = xMin + i * xStep;
                    const y = yMin + j * yStep;
                    const z = zMin + k * zStep;

                    const vx = fnX(x, y, z);
                    const vy = fnY(x, y, z);
                    const vz = fnZ(x, y, z);
                    const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);

                    if (mag > 0.01) {
                        let color = "#3b82f6";
                        if (showDivergence && divFn) {
                            const div = divFn(x, y, z);
                            if (div > 0.1) color = "#22c55e"; // source
                            else if (div < -0.1) color = "#ef4444"; // sink
                        }

                        result.push(
                            <Arrow3D
                                key={`${i}-${j}-${k}`}
                                start={new THREE.Vector3(x, z, y)} // swap y,z for Three.js
                                direction={new THREE.Vector3(vx, vz, vy)}
                                length={Math.min(mag * scale, 0.5)}
                                color={color}
                            />
                        );
                    }
                }
            }
        }

        return result;
    }, [fnX, fnY, fnZ, density, scale, showDivergence, calculateDivergence]);

    return (
        <div className={cn("w-full rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-900 relative", className)} style={{ height }}>
            <Viz3DInfoHint />
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />

                {arrows}

                {/* Coordinate axes */}
                <group>
                    <Line points={[[-3, 0, 0], [3, 0, 0]]} color="#ef4444" lineWidth={2} />
                    <Line points={[[0, -3, 0], [0, 3, 0]]} color="#22c55e" lineWidth={2} />
                    <Line points={[[0, 0, -3], [0, 0, 3]]} color="#3b82f6" lineWidth={2} />
                    <Text position={[3.3, 0, 0]} fontSize={0.25} color="#888">X</Text>
                    <Text position={[0, 3.3, 0]} fontSize={0.25} color="#888">Z</Text>
                    <Text position={[0, 0, 3.3]} fontSize={0.25} color="#888">Y</Text>
                </group>

                {showDivergence && (
                    <group position={[-2.5, 2.5, 0]}>
                        <Text fontSize={0.15} color="#22c55e" position={[0, 0, 0]}>● 源 (div &gt; 0)</Text>
                        <Text fontSize={0.15} color="#ef4444" position={[0, -0.3, 0]}>● 汇 (div &lt; 0)</Text>
                    </group>
                )}

                <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
        </div>
    );
}

// ============== Closed Surface 3D Component (Gauss Theorem) ==============

export interface ClosedSurface3DProps {
    /** Surface type */
    surface: "sphere" | "ellipsoid" | "cube" | "cylinder" | "cone" | "custom";
    /** Surface parameters */
    params?: Record<string, number>;
    /** Vector field for flux visualization */
    vectorField?: {
        fx: string;
        fy: string;
        fz: string;
    };
    /** Show flux arrows on surface */
    showFluxArrows?: boolean;
    /** Show interior volume */
    showVolume?: boolean;
    /** Component height */
    height?: number;
    className?: string;
}

export function ClosedSurface3D({
    surface,
    params = {},
    vectorField,
    showFluxArrows = true,
    showVolume = true,
    height = 400,
    className,
}: ClosedSurface3DProps) {
    const { radius = 1, a = 1, b = 1, c = 1 } = params;

    const fnX = useMemo(() => vectorField ? parseExpr3D(vectorField.fx) : null, [vectorField]);
    const fnY = useMemo(() => vectorField ? parseExpr3D(vectorField.fy) : null, [vectorField]);
    const fnZ = useMemo(() => vectorField ? parseExpr3D(vectorField.fz) : null, [vectorField]);

    // Generate flux arrows on the surface
    const fluxArrows = useMemo(() => {
        if (!showFluxArrows || !fnX || !fnY || !fnZ) return [];

        const arrows: React.ReactNode[] = [];
        const samples = 8;

        if (surface === "sphere") {
            for (let i = 0; i < samples; i++) {
                for (let j = 0; j < samples / 2; j++) {
                    const theta = (i / samples) * 2 * Math.PI;
                    const phi = (j / (samples / 2)) * Math.PI;

                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.sin(phi) * Math.sin(theta);
                    const z = radius * Math.cos(phi);

                    const vx = fnX(x, y, z);
                    const vy = fnY(x, y, z);
                    const vz = fnZ(x, y, z);

                    // Normal vector (for sphere, it's just the position normalized)
                    const normal = new THREE.Vector3(x, z, y).normalize();
                    const fieldVec = new THREE.Vector3(vx, vz, vy);
                    const flux = fieldVec.dot(normal);

                    const color = flux > 0 ? "#22c55e" : "#ef4444";

                    arrows.push(
                        <Arrow3D
                            key={`${i}-${j}`}
                            start={new THREE.Vector3(x, z, y)}
                            direction={new THREE.Vector3(vx, vz, vy)}
                            length={0.3}
                            color={color}
                        />
                    );
                }
            }
        }

        return arrows;
    }, [surface, radius, fnX, fnY, fnZ, showFluxArrows]);

    const renderSurface = () => {
        switch (surface) {
            case "sphere":
                return (
                    <Sphere args={[radius, 32, 32]}>
                        <meshStandardMaterial
                            color="#3b82f6"
                            transparent
                            opacity={showVolume ? 0.3 : 0.6}
                            side={THREE.DoubleSide}
                            wireframe={!showVolume}
                        />
                    </Sphere>
                );
            case "ellipsoid":
                return (
                    <mesh scale={[a, c, b]}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshStandardMaterial
                            color="#3b82f6"
                            transparent
                            opacity={showVolume ? 0.3 : 0.6}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            case "cylinder":
                return (
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[radius, radius, params.height || 2, 32, 1, false]} />
                        <meshStandardMaterial
                            color="#3b82f6"
                            transparent
                            opacity={showVolume ? 0.3 : 0.6}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            case "cube":
                return (
                    <mesh>
                        <boxGeometry args={[a * 2, c * 2, b * 2]} />
                        <meshStandardMaterial
                            color="#3b82f6"
                            transparent
                            opacity={showVolume ? 0.3 : 0.6}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            case "cone":
                return (
                    <mesh rotation={[Math.PI, 0, 0]} position={[0, (params.height || 2) / 2, 0]}>
                        <coneGeometry args={[params.radius || 1, params.height || 2, 32]} />
                        <meshStandardMaterial
                            color="#3b82f6"
                            opacity={showVolume ? 0.3 : 0.6}
                            transparent
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                );
            case "custom":
                // Placeholder for custom geometry
                return (
                    <mesh>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial
                            color="#a855f7"
                            opacity={showVolume ? 0.3 : 0.6}
                            transparent
                        />
                    </mesh>
                );
            default:
                return null;
        }
    };

    return (
        <div className={cn("w-full rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-900 relative", className)} style={{ height }}>
            <Viz3DInfoHint />
            <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />

                {renderSurface()}
                {fluxArrows}

                {/* Coordinate axes */}
                <group>
                    <Line points={[[-2, 0, 0], [2, 0, 0]]} color="#ef4444" lineWidth={2} />
                    <Line points={[[0, -2, 0], [0, 2, 0]]} color="#22c55e" lineWidth={2} />
                    <Line points={[[0, 0, -2], [0, 0, 2]]} color="#3b82f6" lineWidth={2} />
                </group>

                {vectorField && (
                    <group position={[-2, 2, 0]}>
                        <Text fontSize={0.12} color="#22c55e" position={[0, 0, 0]}>→ 流出 (通量+)</Text>
                        <Text fontSize={0.12} color="#ef4444" position={[0, -0.2, 0]}>→ 流入 (通量-)</Text>
                    </group>
                )}

                <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
        </div>
    );
}
