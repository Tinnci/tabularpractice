import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import * as std from 'typegpu/std';

// --- Data Structures ---

// Uniforms: 仅保留全局通用的 Resolution
export const CanvasUniforms = d.struct({
    resolution: d.vec2f, // 画布宽高 [width, height]
});

// Instance Data: 每个点携带完整的渲染信息
export const StrokePoint = d.struct({
    position: d.vec2f, // 屏幕像素坐标 [x, y]
    pressure: d.f32,   // 压力值 (0.0 - 1.0)
    size: d.f32,       // 笔刷基础大小 (Added)
    color: d.vec4f,    // 笔刷颜色 (Added)
});

// --- Shaders ---

// Access unstable APIs
const unstable = tgpu['~unstable'] as any;

/**
 * Vertex Shader
 * 负责将每个点扩展为一个 Quad (四边形)，并计算其在屏幕上的位置
 */
export const vertexShader = unstable.vertexFn({
    in: {
        vertexIndex: d.builtin.vertexIndex, // 0-3 (Quad的4个顶点)
        instance: StrokePoint,              // 从 Instance Buffer 自动读取
    },
    uniforms: {
        canvas: CanvasUniforms,             // 绑定 Uniforms
    },
    out: {
        pos: d.builtin.position,
        uv: d.vec2f,                        // 传递给 Fragment Shader 用于画圆
        color: d.vec4f,                     // 传递颜色
    },
}, (input: any, uniforms: any) => {
    // 生成 Quad 的局部坐标 (-1 到 1)
    // 0: (-1, -1), 1: (1, -1), 2: (-1, 1), 3: (1, 1)

    let x = -1.0;
    let y = -1.0;

    if (input.vertexIndex === 1) { x = 1.0; }
    if (input.vertexIndex === 2) { y = 1.0; }
    if (input.vertexIndex === 3) { x = 1.0; y = 1.0; }

    const quadPos = d.vec2f(x, y);

    // 使用 Instance 中的 size 和 color
    // 计算实际半径: size * pressure
    const size = std.mul(input.instance.size, std.max(input.instance.pressure, 0.1));

    // 计算屏幕像素坐标
    // pixelPos = position + quadPos * size
    const offset = std.mul(quadPos, size);
    const pixelPos = std.add(input.instance.position, offset);

    // 像素坐标 -> NDC
    // ndcX = (pixelPos.x / resolution.x) * 2.0 - 1.0
    const ndcX = std.sub(std.mul(std.div(pixelPos.x, uniforms.canvas.resolution.x), 2.0), 1.0);

    // ndcY = (1.0 - (pixelPos.y / resolution.y)) * 2.0 - 1.0
    const ndcY = std.sub(std.mul(std.sub(1.0, std.div(pixelPos.y, uniforms.canvas.resolution.y)), 2.0), 1.0);

    return {
        pos: d.vec4f(ndcX, ndcY, 0.0, 1.0),
        uv: quadPos,
        color: input.instance.color, // 直接传递 Instance 颜色
    };
});

/**
 * Fragment Shader
 * 负责绘制圆形笔触，并进行边缘抗锯齿
 */
export const fragmentShader = unstable.fragmentFn({
    in: {
        uv: d.vec2f,
        color: d.vec4f,
    },
    out: d.vec4f,
}, (input: any) => {
    // 计算当前像素距离中心的距离 (SDF)
    const dist = std.length(input.uv);

    // 如果在圆外，丢弃
    if (dist > 1.0) {
        std.discard();
    }

    // 边缘抗锯齿 (Soft Edge)
    // alpha = 1.0 - smoothstep(0.8, 1.0, dist)
    const alpha = std.sub(1.0, std.smoothstep(0.8, 1.0, dist));

    return d.vec4f(input.color.rgb, std.mul(input.color.a, alpha));
});
