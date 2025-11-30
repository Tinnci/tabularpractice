import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';

export const CanvasUniforms = d.struct({
    resolution: d.vec2f,
});

export const StrokePoint = d.struct({
    position: d.vec2f,
    pressure: d.f32,
    size: d.f32,
    color: d.vec4f,
});

const unstable = tgpu['~unstable'] as any;

/**
 * Vertex Shader
 */
export const vertexShader = unstable.vertexFn({
    in: {
        vertexIndex: d.builtin.vertexIndex,
        instanceIndex: d.builtin.instanceIndex,
    },
    uniforms: {
        canvas: CanvasUniforms,
        // 使用不定长数组，TypeGPU 会将其映射为 Storage Buffer (read-only)
        points: d.arrayOf(StrokePoint),
    },
    out: {
        pos: d.builtin.position,
        uv: d.vec2f,
        color: d.vec4f,
    },
}, (input: any, resources: any) => {
    // 通过 instanceIndex 索引 Storage Buffer
    const point = resources.points[input.instanceIndex];

    // 生成 Quad 坐标
    // 修正顶点顺序以避免背面剔除问题 (Triangle Strip: 0,1,2,3 -> Z-shape)
    // 0:(-1,-1), 1:(1,-1), 2:(-1,1), 3:(1,1)
    let x = -1.0;
    let y = -1.0;
    if (input.vertexIndex === 1) { x = 1.0; }
    if (input.vertexIndex === 2) { y = 1.0; }
    if (input.vertexIndex === 3) { x = 1.0; y = 1.0; }

    const quadPos = d.vec2f(x, y);

    // --- DEBUG: Force centered quad ---
    // Ignore calculated position, use quadPos directly scaled to 0.5 screen size
    return {
        pos: d.vec4f(quadPos.x * 0.5, quadPos.y * 0.5, 0.0, 1.0),
        uv: quadPos,
        color: d.vec4f(1.0, 0.0, 0.0, 1.0), // Force Red
    };

    // Normal logic
    /*
    const size = std.mul(point.size, std.max(point.pressure, 0.1));
    const offset = std.mul(quadPos, size);
    const pixelPos = std.add(point.position, offset);

    const ndcX = std.sub(std.mul(std.div(pixelPos.x, resources.canvas.resolution.x), 2.0), 1.0);
    const ndcY = std.sub(std.mul(std.sub(1.0, std.div(pixelPos.y, resources.canvas.resolution.y)), 2.0), 1.0);

    return {
        pos: d.vec4f(ndcX, ndcY, 0.0, 1.0),
        uv: quadPos,
        color: point.color,
    };
    */
});

/**
 * Fragment Shader
 */
export const fragmentShader = unstable.fragmentFn({
    in: {
        uv: d.vec2f,
        color: d.vec4f,
    },
    out: d.vec4f,
}, (input: any) => {
    // --- DEBUG: Force Red Output ---
    return d.vec4f(1.0, 0.0, 0.0, 1.0);

    /*
    const dist = std.length(input.uv);
    if (dist > 1.0) {
        std.discard();
    }
    const alpha = std.sub(1.0, std.smoothstep(0.8, 1.0, dist));
    return d.vec4f(input.color.rgb, std.mul(input.color.a, alpha));
    */
});
