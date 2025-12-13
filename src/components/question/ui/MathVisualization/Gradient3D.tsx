"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

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

// ============== Level Surface Component ==============

interface LevelSurfaceProps {
    fn: (x: number, y: number, z: number) => number;
    level: number;
    range: [number, number];
    resolution?: number;
    color?: string;
    opacity?: number;
}

function LevelSurface({ fn, level, range, resolution = 20, color = "#3b82f6", opacity = 0.5 }: LevelSurfaceProps) {
    const points = useMemo(() => {
        const result: THREE.Vector3[] = [];
        const [min, max] = range;
        const step = (max - min) / resolution;

        // Simple marching cubes approximation - just sample points near the level surface
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                for (let k = 0; k <= resolution; k++) {
                    const x = min + i * step;
                    const y = min + j * step;
                    const z = min + k * step;
                    const val = fn(x, y, z);

                    // Check if this point is close to the level surface
                    if (Math.abs(val - level) < step) {
                        result.push(new THREE.Vector3(x, z, y)); // swap y,z for Three.js
                    }
                }
            }
        }

        return result;
    }, [fn, level, range, resolution]);

    return (
        <group>
            {points.map((p, i) => (
                <mesh key={i} position={p.toArray()}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshStandardMaterial color={color} transparent opacity={opacity} />
                </mesh>
            ))}
        </group>
    );
}

// ============== Gradient Arrow ==============

interface GradientArrowProps {
    position: THREE.Vector3;
    direction: THREE.Vector3;
    length?: number;
    color?: string;
    label?: string;
}

function GradientArrow3D({ position, direction, length = 0.5, color = "#f59e0b", label }: GradientArrowProps) {
    const normalizedDir = direction.clone().normalize();
    const end = position.clone().add(normalizedDir.clone().multiplyScalar(length));

    return (
        <group>
            <Line
                points={[position, end]}
                color={color}
                lineWidth={4}
            />
            <mesh position={end.toArray()}>
                <coneGeometry args={[0.05, 0.12, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {label && (
                <Text
                    position={end.clone().add(normalizedDir.clone().multiplyScalar(0.2)).toArray()}
                    fontSize={0.12}
                    color={color}
                >
                    {label}
                </Text>
            )}
        </group>
    );
}

// ============== Main Gradient 3D Component ==============

export interface Gradient3DVisualizerProps {
    /** Scalar field u = f(x,y,z) */
    function: string;
    /** Point to evaluate gradient */
    point: [number, number, number];
    /** Show level surface through the point */
    showLevelSurface?: boolean;
    /** Show gradient vector */
    showGradientVector?: boolean;
    /** Show directional derivative in a specific direction */
    showDirectionalDerivative?: {
        direction: [number, number, number];
        label?: string;
    };
    /** View range */
    range?: [number, number];
    height?: number;
    className?: string;
}

export function Gradient3DVisualizer({
    function: funcExpr,
    point,
    showLevelSurface = true,
    showGradientVector = true,
    showDirectionalDerivative,
    range = [-2, 2],
    height = 400,
    className,
}: Gradient3DVisualizerProps) {
    const fn = useMemo(() => parseExpr3D(funcExpr), [funcExpr]);
    const [px, py, pz] = point;

    // Calculate gradient ∇f at the point
    const gradient = useMemo(() => {
        const h = 0.001;
        const dfdx = (fn(px + h, py, pz) - fn(px - h, py, pz)) / (2 * h);
        const dfdy = (fn(px, py + h, pz) - fn(px, py - h, pz)) / (2 * h);
        const dfdz = (fn(px, py, pz + h) - fn(px, py, pz - h)) / (2 * h);
        return new THREE.Vector3(dfdx, dfdz, dfdy); // swap y,z for Three.js
    }, [fn, px, py, pz]);

    const gradientMagnitude = gradient.length();

    // Calculate level at the point
    const level = useMemo(() => fn(px, py, pz), [fn, px, py, pz]);

    // Directional derivative
    const directionalDerivativeData = useMemo(() => {
        if (!showDirectionalDerivative) return null;
        const [dx, dy, dz] = showDirectionalDerivative.direction;
        const dir = new THREE.Vector3(dx, dz, dy).normalize(); // swap y,z
        const derivative = gradient.dot(dir);
        return { direction: dir, value: derivative };
    }, [showDirectionalDerivative, gradient]);

    const pointPos = new THREE.Vector3(px, pz, py); // swap y,z for Three.js

    return (
        <div className={cn("w-full rounded-lg overflow-hidden border bg-slate-900", className)} style={{ height }}>
            <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} />

                {/* Level surface */}
                {showLevelSurface && (
                    <LevelSurface
                        fn={fn}
                        level={level}
                        range={range}
                        color="#3b82f6"
                        opacity={0.4}
                    />
                )}

                {/* The point */}
                <mesh position={pointPos.toArray()}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#22c55e" />
                </mesh>
                <Text
                    position={pointPos.clone().add(new THREE.Vector3(0.15, 0.15, 0)).toArray()}
                    fontSize={0.12}
                    color="#22c55e"
                >
                    P({px}, {py}, {pz})
                </Text>

                {/* Gradient vector */}
                {showGradientVector && gradientMagnitude > 0.01 && (
                    <GradientArrow3D
                        position={pointPos}
                        direction={gradient}
                        length={Math.min(gradientMagnitude * 0.5, 1)}
                        color="#f59e0b"
                        label={`∇f = (${gradient.x.toFixed(1)}, ${gradient.z.toFixed(1)}, ${gradient.y.toFixed(1)})`}
                    />
                )}

                {/* Directional derivative */}
                {directionalDerivativeData && (
                    <GradientArrow3D
                        position={pointPos}
                        direction={directionalDerivativeData.direction}
                        length={0.6}
                        color="#ef4444"
                        label={showDirectionalDerivative?.label || `D_l f = ${directionalDerivativeData.value.toFixed(2)}`}
                    />
                )}

                {/* Coordinate axes */}
                <group>
                    <Line points={[[-2, 0, 0], [2, 0, 0]]} color="#ef4444" lineWidth={2} />
                    <Line points={[[0, -2, 0], [0, 2, 0]]} color="#22c55e" lineWidth={2} />
                    <Line points={[[0, 0, -2], [0, 0, 2]]} color="#3b82f6" lineWidth={2} />
                    <Text position={[2.2, 0, 0]} fontSize={0.2} color="#888">X</Text>
                    <Text position={[0, 2.2, 0]} fontSize={0.2} color="#888">Z</Text>
                    <Text position={[0, 0, 2.2]} fontSize={0.2} color="#888">Y</Text>
                </group>

                {/* Legend */}
                <group position={[-2.5, 2, 0]}>
                    {showLevelSurface && (
                        <Text fontSize={0.1} color="#3b82f6" position={[0, 0, 0]}>
                            ● 等值面 f = {level.toFixed(2)}
                        </Text>
                    )}
                    {showGradientVector && (
                        <Text fontSize={0.1} color="#f59e0b" position={[0, -0.15, 0]}>
                            → 梯度 ∇f (指向增长最快方向)
                        </Text>
                    )}
                </group>

                <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
        </div>
    );
}
