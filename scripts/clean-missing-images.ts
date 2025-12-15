
import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

// Configuration
const _DATA_DIR = join(process.cwd(), 'papers'); // Adjust based on where this script runs. Assuming root.
// Actually allow passing paper directory

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function validatePaperImages(paperId: string) {
    const paperDir = join(process.cwd(), '..', 'tabularpractice-data', 'papers', paperId);
    const indexJsonPath = join(paperDir, 'index.json');

    console.log(`Checking paper: ${paperId} at ${paperDir}`);

    if (!await fileExists(indexJsonPath)) {
        console.error(`Index file not found: ${indexJsonPath}`);
        return;
    }

    const content = await readFile(indexJsonPath, 'utf-8');
    const data = JSON.parse(content);
    let changed = false;

    // Helper to check and update image field
    const checkImage = async (qId: string, field: string, url: string | null) => {
        if (!url) return url;

        // Remove leading slash for local path resolution if needed, 
        // but typically these are public paths. We need to map them to the filesystem.
        // Assumption: /papers/paper-id/assets/file.png -> tabularpractice-data/papers/paper-id/assets/file.png
        // The url starts with /papers/

        const relativePath = url.replace(/^\/papers\//, '');
        const fullPath = join(process.cwd(), '..', 'tabularpractice-data', 'papers', relativePath);

        if (!await fileExists(fullPath)) {
            console.warn(`[${qId}] Missing image: ${field} = ${url}`);
            // We verify if we should remove it. For now, let's just report.
            // If we want to auto-fix: return null;
            return null; // AUTO-FIX: Set to null
        }
        return url;
    };

    if (data.questions) {
        for (const [id, q] of Object.entries(data.questions) as [string, { contentImg?: string | null; answerImg?: string | null; analysisImg?: string | null }][]) {
            const oldContentImg = q.contentImg;
            const newContentImg = await checkImage(id, 'contentImg', q.contentImg ?? null);
            if (oldContentImg !== newContentImg) {
                q.contentImg = newContentImg;
                changed = true;
            }

            const oldAnswerImg = q.answerImg;
            const newAnswerImg = await checkImage(id, 'answerImg', q.answerImg ?? null);
            if (oldAnswerImg !== newAnswerImg) {
                q.answerImg = newAnswerImg;
                changed = true;
            }

            const oldAnalysisImg = q.analysisImg;
            const newAnalysisImg = await checkImage(id, 'analysisImg', q.analysisImg ?? null);
            if (oldAnalysisImg !== newAnalysisImg) {
                q.analysisImg = newAnalysisImg;
                changed = true;
            }
        }
    }

    if (changed) {
        console.log(`Updating ${indexJsonPath}...`);
        await writeFile(indexJsonPath, JSON.stringify(data, null, 2));
    } else {
        console.log('No invalid images found to remove.');
    }
}

async function main() {
    // Hardcoded for the current task, or parse args
    await validatePaperImages('shu-836-2025');
}

main().catch(console.error);
