import { useMemo } from 'react';

// Fibonacci Sphere algorithm for even distribution
export function use3DLayout(count: number, radius: number) {
    return useMemo(() => {
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
        const positions = [];

        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y

            const theta = phi * i; // golden angle increment

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            positions.push({
                x: x * radius,
                y: y * radius,
                z: z * radius
            });
        }
        return positions;
    }, [count, radius]);
}
