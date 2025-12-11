export const FALLBACK_WGSL = `
struct CanvasUniforms {
    resolution: vec2f,
}

struct StrokePoint {
    position: vec2f,
    pressure: f32,
    size: f32,
    color: vec4f,
}

@group(0) @binding(0) var<uniform> canvas: CanvasUniforms;
@group(0) @binding(1) var<storage, read> points: array<StrokePoint>;

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
    @location(1) color: vec4f,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    let point = points[instanceIndex];
    
    var x = -1.0;
    var y = -1.0;
    if (vertexIndex == 1u) { x = 1.0; }
    if (vertexIndex == 2u) { y = 1.0; }
    if (vertexIndex == 3u) { x = 1.0; y = 1.0; }
    
    let quadPos = vec2f(x, y);
    let size = point.size * max(point.pressure, 0.1);
    let offset = quadPos * size;
    let pixelPos = point.position + offset;
    
    // Convert to NDC
    // WebGPU NDC: X [-1, 1], Y [-1, 1] (Y is up in NDC, but screen Y is down)
    // We need to map screen (0,0) top-left to NDC (-1, 1) top-left.
    // Screen X: 0 -> -1, W -> 1 => (x / W) * 2 - 1
    // Screen Y: 0 -> 1, H -> -1 => (1 - y / H) * 2 - 1
    
    let ndcX = (pixelPos.x / canvas.resolution.x) * 2.0 - 1.0;
    let ndcY = (1.0 - (pixelPos.y / canvas.resolution.y)) * 2.0 - 1.0;
    
    var out: VertexOutput;
    out.pos = vec4f(ndcX, ndcY, 0.0, 1.0);
    out.uv = quadPos;
    out.color = point.color;
    return out;
}

@fragment
fn fs_main(@location(0) uv: vec2f, @location(1) color: vec4f) -> @location(0) vec4f {
    let dist = length(uv);
    if (dist > 1.0) {
        discard;
    }
    let alpha = 1.0 - smoothstep(0.8, 1.0, dist);
    return vec4f(color.rgb, color.a * alpha);
}
`;
