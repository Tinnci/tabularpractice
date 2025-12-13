"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Line } from "@react-three/drei";
import React, { useMemo, useRef } from "react";
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
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    pow: Math.pow,
    PI: Math.PI,
    E: Math.E,
    atan: Math.atan,
    asin: Math.asin,
    acos: Math.acos,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
};

function parseExpression(expr: string, variables: string[]): (...args: number[]) => number {
    const processed = expr
        .replace(/\^/g, "**")
        .replace(/(\d)([xyz])/g, "$1*$2")
        .replace(/([xyz])(\d)/g, "$1*$2");

    return (...args: number[]) => {
        try {
            const fn = new Function(
                ...variables,
                ...Object.keys(MATH_CONTEXT),
                `return ${processed}`
            );
            return fn(...args, ...Object.values(MATH_CONTEXT));
        } catch {
            return 0;
        }
    };
}

// ============== Color Schemes ==============

const COLOR_SCHEMES: Record<string, (t: number) => THREE.Color> = {
    viridis: (t) => new THREE.Color().setHSL(0.7 - t * 0.5, 0.8, 0.3 + t * 0.4),
    plasma: (t) => new THREE.Color().setHSL(0.8 - t * 0.6, 0.9, 0.4 + t * 0.3),
    coolwarm: (t) => new THREE.Color().lerpColors(
        new THREE.Color(0x3b4cc0),
        new THREE.Color(0xb40426),
        t
    ),
    rainbow: (t) => new THREE.Color().setHSL(t, 0.8, 0.5),
};

// ============== Axis Labels ==============

function AxisLabels() {
    return (
        <group>
            <Text position={[3.5, 0, 0]} fontSize={0.3} color="#666">X</Text>
            <Text position={[0, 3.5, 0]} fontSize={0.3} color="#666">Y</Text>
            <Text position={[0, 0, 3.5]} fontSize={0.3} color="#666">Z</Text>
        </group>
    );
}

// ============== Coordinate Axes ==============

function CoordinateAxes({ size = 3 }: { size?: number }) {
    return (
        <group>
            {/* X axis - red */}
            <Line points={[[-size, 0, 0], [size, 0, 0]]} color="#ef4444" lineWidth={2} />
            {/* Y axis - green */}
            <Line points={[[0, -size, 0], [0, size, 0]]} color="#22c55e" lineWidth={2} />
            {/* Z axis - blue */}
            <Line points={[[0, 0, -size], [0, 0, size]]} color="#3b82f6" lineWidth={2} />
            <AxisLabels />
        </group>
    );
}

// ============== Surface Plot Component ==============

interface SurfaceMeshProps {
    fn: (x: number, y: number) => number;
    xRange: [number, number];
    yRange: [number, number];
    resolution?: number;
    colorScheme?: string;
    opacity?: number;
    showWireframe?: boolean;
}

function SurfaceMesh({
    fn,
    xRange,
    yRange,
    resolution = 50,
    colorScheme = "viridis",
    opacity = 0.85,
    showWireframe = false,
}: SurfaceMeshProps) {
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const vertices: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];

        const [xMin, xMax] = xRange;
        const [yMin, yMax] = yRange;
        const dx = (xMax - xMin) / resolution;
        const dy = (yMax - yMin) / resolution;

        // Track z range for color mapping
        let zMin = Infinity, zMax = -Infinity;
        const zValues: number[][] = [];

        for (let i = 0; i <= resolution; i++) {
            zValues[i] = [];
            for (let j = 0; j <= resolution; j++) {
                const x = xMin + i * dx;
                const y = yMin + j * dy;
                const z = fn(x, y);
                if (isFinite(z)) {
                    zValues[i][j] = z;
                    zMin = Math.min(zMin, z);
                    zMax = Math.max(zMax, z);
                } else {
                    zValues[i][j] = 0;
                }
            }
        }

        const getColor = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.viridis;
        const zRange = zMax - zMin || 1;

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const x = xMin + i * dx;
                const y = yMin + j * dy;
                const z = zValues[i][j];

                vertices.push(x, z, y); // Note: Three.js uses Y-up, so swap y and z

                const t = (z - zMin) / zRange;
                const color = getColor(t);
                colors.push(color.r, color.g, color.b);
            }
        }

        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const a = i * (resolution + 1) + j;
                const b = a + 1;
                const c = a + resolution + 1;
                const d = c + 1;

                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }

        geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        return geo;
    }, [fn, xRange, yRange, resolution, colorScheme]);

    return (
        <group>
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    vertexColors
                    transparent
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {showWireframe && (
                <mesh geometry={geometry}>
                    <meshBasicMaterial wireframe color="#333" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
}

// ============== Critical Point Marker ==============

interface CriticalPointProps {
    position: [number, number, number];
    type: "maximum" | "minimum" | "saddle";
    label?: string;
}

function CriticalPoint({ position, type, label }: CriticalPointProps) {
    const color = type === "maximum" ? "#22c55e" : type === "minimum" ? "#ef4444" : "#f59e0b";
    const [x, y, z] = position;

    return (
        <group position={[x, z, y]}>
            <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {label && (
                <Text position={[0, 0.2, 0]} fontSize={0.15} color={color}>
                    {label}
                </Text>
            )}
        </group>
    );
}

// ============== Gradient Arrow ==============

interface GradientArrowProps {
    position: [number, number, number];
    direction: [number, number, number];
    color?: string;
}

function GradientArrow({ position, direction, color = "#f59e0b" }: GradientArrowProps) {
    const [x, y, z] = position;
    const [dx, dy, dz] = direction;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const normalized = [dx / length, dy / length, dz / length];

    const arrowRef = useRef<THREE.ArrowHelper>(null);

    return (
        <primitive
            ref={arrowRef}
            object={new THREE.ArrowHelper(
                new THREE.Vector3(...normalized),
                new THREE.Vector3(x, z, y), // swap y and z for Three.js
                length * 0.5,
                new THREE.Color(color),
                0.1,
                0.05
            )}
        />
    );
}

// ============== 3D Vector Field ==============

interface VectorField3DProps {
    fx: (x: number, y: number, z: number) => number;
    fy: (x: number, y: number, z: number) => number;
    fz: (x: number, y: number, z: number) => number;
    range: [number, number];
    density?: number;
}

function VectorField3D({ fx, fy, fz, range, density = 5 }: VectorField3DProps) {
    const arrows = useMemo(() => {
        const result: React.ReactNode[] = [];
        const [min, max] = range;
        const step = (max - min) / density;

        for (let i = 0; i <= density; i++) {
            for (let j = 0; j <= density; j++) {
                for (let k = 0; k <= density; k++) {
                    const x = min + i * step;
                    const y = min + j * step;
                    const z = min + k * step;

                    const vx = fx(x, y, z);
                    const vy = fy(x, y, z);
                    const vz = fz(x, y, z);

                    const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
                    if (len > 0.01) {
                        result.push(
                            <GradientArrow
                                key={`${i}-${j}-${k}`}
                                position={[x, y, z]}
                                direction={[vx, vy, vz]}
                                color="#3b82f6"
                            />
                        );
                    }
                }
            }
        }

        return result;
    }, [fx, fy, fz, range, density]);

    return <group>{arrows}</group>;
}

// ============== Main Surface Plot 3D Component ==============

export interface SurfacePlot3DProps {
    function: string;
    xRange?: [number, number];
    yRange?: [number, number];
    zRange?: [number, number];
    colorScheme?: "viridis" | "plasma" | "inferno" | "magma" | "rainbow" | "coolwarm";
    opacity?: number;
    showWireframe?: boolean;
    showContours?: boolean;
    criticalPoints?: Array<{
        x: number;
        y: number;
        type: "maximum" | "minimum" | "saddle";
        label?: string;
    }>;
    height?: number;
    className?: string;
    showGradient?: boolean;
    gradientPoint?: [number, number];
}

export function SurfacePlot3D({
    function: funcExpr,
    xRange = [-2, 2],
    yRange = [-2, 2],
    colorScheme = "viridis",
    opacity = 0.85,
    showWireframe = false,
    criticalPoints = [],
    height = 400,
    className,
    showGradient = false,
    gradientPoint,
}: SurfacePlot3DProps) {
    const fn = useMemo(() => parseExpression(funcExpr, ["x", "y"]), [funcExpr]);

    // Calculate gradient at a point
    const gradientData = useMemo(() => {
        if (!showGradient || !gradientPoint) return null;
        const [px, py] = gradientPoint;
        const h = 0.001;
        const dfdx = (fn(px + h, py) - fn(px - h, py)) / (2 * h);
        const dfdy = (fn(px, py + h) - fn(px, py - h)) / (2 * h);
        const fz = fn(px, py);
        return { position: [px, py, fz] as [number, number, number], direction: [dfdx, dfdy, 0] as [number, number, number] };
    }, [fn, showGradient, gradientPoint]);

    return (
        <div className={cn("w-full rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-900 relative", className)} style={{ height }}>
            <Viz3DInfoHint />
            <Canvas
                camera={{ position: [4, 4, 4], fov: 50 }}
                gl={{ antialias: true }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />
                <directionalLight position={[-5, -5, -5]} intensity={0.3} />

                <SurfaceMesh
                    fn={fn}
                    xRange={xRange}
                    yRange={yRange}
                    colorScheme={colorScheme}
                    opacity={opacity}
                    showWireframe={showWireframe}
                />

                {criticalPoints.map((cp, idx) => (
                    <CriticalPoint
                        key={idx}
                        position={[cp.x, cp.y, fn(cp.x, cp.y)]}
                        type={cp.type}
                        label={cp.label}
                    />
                ))}

                {gradientData && (
                    <GradientArrow
                        position={gradientData.position}
                        direction={gradientData.direction}
                    />
                )}

                <CoordinateAxes size={3} />
                <Grid
                    args={[10, 10]}
                    position={[0, -0.01, 0]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#444"
                    sectionSize={1}
                    sectionThickness={1}
                    sectionColor="#666"
                    fadeDistance={20}
                    fadeStrength={1}
                />

                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={20}
                />
            </Canvas>
        </div>
    );
}

export { parseExpression, VectorField3D, GradientArrow, CriticalPoint, SurfaceMesh };
