import { createSerwistRoute } from "@serwist/turbopack";
import type { NextRequest } from "next/server";

const { GET: originalGet } = createSerwistRoute({
    swSrc: "src/app/sw.ts",
});

export async function GET(req: NextRequest, context: any) {
    return originalGet(req, { ...context, params: Promise.resolve({ path: "sw.js" }) });
}
