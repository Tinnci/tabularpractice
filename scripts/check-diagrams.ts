
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Define minimal types to avoid importing from UI code with complex dependencies
interface Point { x: number; y: number }
interface Component { id: string; type: string; position: Point; rotation?: number }
interface Connection { from: string; to: string; bendPoints?: Point[] }
interface DiagramConfig { components: Component[]; connections: Connection[] }
interface Question { id: string; eureka?: { visualization?: { type: string; config: DiagramConfig } } }
interface Paper { questions: Record<string, Question> }

const DATA_REPO_PATH = join(process.cwd(), '../tabularpractice-data');

async function validateDiagrams() {
    console.log("🔍 Validating Circuit Diagrams in data repo...");

    // Find all index.json files
    const files = await glob(join(DATA_REPO_PATH, 'papers/*/index.json'));

    let issueCount = 0;

    for (const file of files) {
        try {
            const content = await readFile(file, 'utf-8');
            const paper = JSON.parse(content) as Paper;

            if (!paper.questions) continue;

            for (const [qId, question] of Object.entries(paper.questions)) {
                const viz = question.eureka?.visualization;

                if (viz && viz.type === 'circuit-diagram') {
                    const config = viz.config;
                    const issues = checkCircuitConstraints(qId, config);

                    if (issues.length > 0) {
                        console.log(`\n❌ Issues in ${qId} (${file}):`);
                        issues.forEach(issue => console.log(`   - ${issue}`));
                        issueCount += issues.length;
                    }
                }
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }

    if (issueCount === 0) {
        console.log("\n✅ No circuit diagram issues found!");
    } else {
        console.log(`\nFound ${issueCount} issues.`);
        process.exit(1);
    }
}

function checkCircuitConstraints(context: string, config: DiagramConfig): string[] {
    const issues: string[] = [];
    const compMap = new Map(config.components.map(c => [c.id, c]));

    // 1. Check for valid component references
    config.connections.forEach((conn, idx) => {
        if (!compMap.has(conn.from)) issues.push(`Connection #${idx} refers to missing 'from' component: ${conn.from}`);
        if (!compMap.has(conn.to)) issues.push(`Connection #${idx} refers to missing 'to' component: ${conn.to}`);
    });

    if (issues.length > 0) return issues;

    // 2. Geometric Constraints
    config.connections.forEach((conn) => {
        const c1 = compMap.get(conn.from)!;
        const c2 = compMap.get(conn.to)!;

        // Skip if bendPoints are manually defined (assume manual routing is correct/intentional)
        if (conn.bendPoints && conn.bendPoints.length > 0) return;

        // Check alignment
        const isAlignedX = Math.abs(c1.position.x - c2.position.x) < 5;
        const isAlignedY = Math.abs(c1.position.y - c2.position.y) < 5;

        // Strict Orthogonality Check for direct connections
        // We tolerate misalignment only if one component is likely "small" or offset logic handles it, 
        // but generally direct connections should be aligned.
        // Exception: Ground (often below). 

        // Refined Logic based on Component Types:
        // Horizontal components (Resistor, Cap): Ports are at Left/Right.
        // Vertical components: Ports at Top/Bottom.

        // Case A: Horizontal -> Horizontal (e.g. R1 -> R2). Should be Y-aligned.
        if (isHorizontal(c1) && isHorizontal(c2)) {
            if (!isAlignedY) {
                issues.push(`Misaligned Horizontal connection: ${c1.id} (${fmt(c1.position)}) -> ${c2.id} (${fmt(c2.position)}). Should have same Y.`);
            }
        }

        // Case B: Vertical -> Vertical (e.g. C1 -> C2 stacked). Should be X-aligned.
        else if (isVertical(c1) && isVertical(c2)) {
            if (!isAlignedX) {
                issues.push(`Misaligned Vertical connection: ${c1.id} (${fmt(c1.position)}) -> ${c2.id} (${fmt(c2.position)}). Should have same X.`);
            }
        }

        // Case C: Mixed (H -> V). This is a corner (L-shape).
        // A direct wire without bendpoints implies the auto-router must generate an L-shape.
        // Does the auto-router support L-shape safely?
        // Yes, "Default L-shaped connection" in CircuitRouteUtils.
        // BUT, if they are diagonally offset, the L-shape is valid.
        // However, if they are "too close" or weirdly overlapping, it might be bad.

        // For now, let's complain about "Diagonal Direct Lines" ONLY if the components overlap in a way that suggests a straight line would cut through.
        // Actually, the simplest check for "Bad Diagram" is just:
        // "Are adjacent components overlapping?"

        // Intersection Check
        if (isOverlapping(c1, c2)) {
            issues.push(`Overlapping components: ${c1.id} and ${c2.id}`);
        }
    });

    return issues;
}

function isHorizontal(c: Component): boolean {
    const rot = c.rotation || 0;
    // R, C, L, V are horizontal at 0 deg.
    // Node is size 0.
    if (c.type === 'node' || c.type === 'ground') return false; // Treat as point-ish
    return rot === 0 || rot === 180;
}

function isVertical(c: Component): boolean {
    const rot = c.rotation || 0;
    return rot === 90 || rot === 270;
}

function fmt(p: Point) { return `${p.x},${p.y}`; }

function isOverlapping(c1: Component, c2: Component): boolean {
    // Simple bounding box 
    const size = 40; // Approx
    const dist = Math.hypot(c1.position.x - c2.position.x, c1.position.y - c2.position.y);
    return dist < size;
}

validateDiagrams().catch(console.error);
