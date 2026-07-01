import { generateText, tool } from "ai";
import {
  createProviderModel,
  openRouterModelChain,
  groqModelChain,
  isClientError,
} from "@/lib/ai/providers";
import { VIRALITY_PROMPT } from "@/lib/ai/prompts";
import { viralitySchema, type ViralityScoreResult } from "@/lib/ai/virality-schema";
import { resolveProviderAuth } from "@/lib/api-auth";
import { clean } from "@/lib/ai/format";
import type { Provider } from "@/types";

// Node runtime (not edge): forced tool-calling for structured output touches a
// Node-only API (process.emitWarning) that Edge doesn't support. This route
// returns a single JSON response, so edge's streaming benefit doesn't apply.

interface RequestBody {
  post: string;
  provider: Provider;
  apiKey?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export async function POST(req: Request) {
  const body: RequestBody = await req.json();
  const { post, provider, apiKey, customBaseUrl, customModel } = body;

  if (!post?.trim()) {
    return new Response(JSON.stringify({ error: "Post is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authResult = await resolveProviderAuth(provider, apiKey);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;

  try {
    // Forced tool-calling, not a native json_schema/json_object response format:
    // tool-calling is supported far more consistently across providers (and
    // across individual Groq models) than those modes.
    const tools = {
      score_post: tool({
        description: "Score the post using the 4-part viral framework.",
        inputSchema: viralitySchema,
      }),
    };
    const toolChoice = { type: "tool", toolName: "score_post" } as const;

    // Same resilience as the generate route: Groq retries across its model chain
    // (each model has its own daily token budget); OpenRouter uses its native
    // `models` array. Other providers (BYOK) make a single call.
    const runScore = async () => {
      if (auth.provider === "groq") {
        let lastErr: unknown;
        for (const modelId of groqModelChain(customModel)) {
          try {
            const model = createProviderModel("groq", auth.apiKey, { model: modelId });
            return await generateText({
              model,
              system: VIRALITY_PROMPT,
              prompt: post,
              temperature: 0.4,
              tools,
              toolChoice,
              maxRetries: 0,
            });
          } catch (err) {
            lastErr = err;
            if (isClientError(err)) throw err;
          }
        }
        throw lastErr;
      }
      const model = createProviderModel(auth.provider, auth.apiKey, {
        baseUrl: customBaseUrl,
        model: customModel,
      });
      const providerOptions =
        auth.provider === "openrouter"
          ? { openrouter: { models: openRouterModelChain(customModel) } }
          : undefined;
      return generateText({
        model,
        system: VIRALITY_PROMPT,
        prompt: post,
        temperature: 0.4,
        tools,
        toolChoice,
        providerOptions,
      });
    };

    const result = await runScore();

    const toolCall = result.toolCalls[0];
    if (!toolCall) throw new Error("No score was generated");

    const object = toolCall.input as ViralityScoreResult;
    const { breakdown } = object;

    // Computed deterministically from the breakdown rather than asked for
    // separately — keeps the overall number mathematically consistent with
    // the 4 parts instead of a second, independent model judgment.
    const score = Math.round(
      (breakdown.readability + breakdown.hook + breakdown.body + breakdown.closer) / 4
    );

    // Suggestions are free text from the model — run them through the same
    // symbol/cliche cleanup as generated posts (no em-dashes, no AI-tells).
    const scored = {
      score,
      breakdown,
      suggestions: object.suggestions.map((s) => clean(s)),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth.remaining !== undefined) {
      headers["X-Free-Remaining"] = String(auth.remaining);
    }

    return new Response(JSON.stringify(scored), { headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
