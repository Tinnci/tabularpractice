import { z } from 'zod';


// Define Status Schema based on the Status type
// Status type is likely: 'unanswered' | 'mastered' | 'confused' | 'failed' | 'reviewing'
// We should check src/lib/types.ts to be sure, but the user provided a list.
// Let's assume the user's list is correct or close enough.
// Actually, let's peek at types.ts to be 100% sure about Status values.

const StatusSchema = z.enum(['unanswered', 'mastered', 'confused', 'failed']);

export const SyncDataSchema = z.object({
    version: z.number(),
    timestamp: z.string(),
    progress: z.record(z.string(), StatusSchema).catch({}),
    progressLastModified: z.record(z.string(), z.number()).optional(),
    notes: z.record(z.string(), z.string()).catch({}),
    notesLastModified: z.record(z.string(), z.number()).optional(),
    stars: z.record(z.string(), z.boolean()).catch({}),
    repoSources: z.array(z.object({
        id: z.string(),
        url: z.string(),
        name: z.string(),
        enabled: z.boolean(),
        isBuiltin: z.boolean().optional()
    })).catch([]),
    times: z.record(z.string(), z.number()).optional(),
    timesLastModified: z.record(z.string(), z.number()).optional(),
});
