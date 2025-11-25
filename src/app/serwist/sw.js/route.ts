import { createSerwistRoute } from "@serwist/turbopack";
import type { NextRequest } from "next/server";
import nextConfig from "../../../../next.config";

const { GET: originalGet } = createSerwistRoute({
    swSrc: "src/app/sw.ts",
    nextConfig,
});

export async function GET(req: NextRequest, context: any) {
    return originalGet(req, { ...context, params: Promise.resolve({ path: "sw.js" }) });
}
