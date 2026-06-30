import { z } from "zod";

// Mirrors viralXpostAlgo.md's "4 parts to a viral tweet": readability, a
// powerful hook, a personal body, an emotional closer. Each is scored
// independently so the breakdown reflects that exact framework.
//
// The model is asked for the breakdown + suggestions only. The overall score
// is computed server-side as the average of the 4 breakdown values (see
// route.ts) rather than generated independently — letting the model also
// pick the overall number gave it a second, less-grounded judgment that
// tended to cluster on the same round figures across very different posts.
export const viralitySchema = z.object({
  breakdown: z.object({
    readability: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Is it instantly scannable? Whitespace between thoughts, short lines, concise (every extra word costs readability)."
      ),
    hook: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Does line 1 rope the reader in? Relatable, makes them curious, presents a challenge or opportunity they care about."
      ),
    body: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Does it feel personal and contextual, like a real person explaining it, not a dry list of facts?"
      ),
    closer: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Does the last line land? A gut-punch, a resolution to the hook's challenge, or a question worth replying to, never a flat or hanging line."
      ),
  }),
  suggestions: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      "1-3 short, specific, actionable suggestions tied to THIS post (reference its actual hook/body/closer), in plain human words."
    ),
});

export type ViralityScoreResult = z.infer<typeof viralitySchema>;
