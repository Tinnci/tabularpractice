import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';

// --- Data Structures ---

export const CanvasUniforms = d.struct({
    resolution: d.vec2f,
});

export const StrokePoint = d.struct({
    position: d.vec2f,
    pressure: d.f32,
    size: d.f32,
    color: d.vec4f,
});

// --- Shaders ---

const unstable = tgpu['~unstable'] as any;

/**
 * Vertex Shader
 */
export const vertexShader = unstable.vertexFn({
    in: {
        vertexIndex: d.builtin.vertexIndex,
        instanceIndex: d.builtin.instanceIndex, // 获取当前实例ID
    },
    uniforms: {
        canvas: CanvasUniforms,
        // 关键修改：将点数据作为 Storage Buffer 传入，而不是 Attribute
        // Storage Buffer 允许我们在 Shader 中像数组一样随机访问
        points: d.arrayOf(StrokePoint),
    },
    out: {
        pos: d.builtin.position,
        uv: d.vec2f,
        color: d.vec4f,
    },
}, (input: any, resources: any) => {
    // 手动读取数据：根据 draw 调用中的 instanceIndex 获取对应的点数据
    // 注意：TypeGPU/WGSL 会自动处理 buffer offset
    // 这里的 instanceIndex 是全局的，对应于 draw 调用中的 firstInstance + index
    const point = resources.points[input.instanceIndex];

    let x = -1.0;
    let y = -1.0;
    if (input.vertexIndex === 1) { x = 1.0; }
    if (input.vertexIndex === 2) { y = 1.0; }
    if (input.vertexIndex === 3) { x = 1.0; y = 1.0; }

    const quadPos = d.vec2f(x, y);

    // 使用读取到的 point 数据
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
    const dist = std.length(input.uv);
    if (dist > 1.0) {
        std.discard();
    }
    const alpha = std.sub(1.0, std.smoothstep(0.8, 1.0, dist));
    return d.vec4f(input.color.rgb, std.mul(input.color.a, alpha));
});
