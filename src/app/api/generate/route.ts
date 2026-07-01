import { generateText } from "ai";
import {
  createProviderModel,
  openRouterModelChain,
  groqModelChain,
  isClientError,
} from "@/lib/ai/providers";
import { getRestructurePrompt } from "@/lib/ai/prompts";
import { finalizePost } from "@/lib/ai/format";
import { resolveProviderAuth } from "@/lib/api-auth";
import type { Provider, Tone, Structure } from "@/types";

export const runtime = "edge";

interface RequestBody {
  input: string;
  tone: Tone;
  structure: Structure;
  provider: Provider;
  apiKey?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export async function POST(req: Request) {
  const body: RequestBody = await req.json();
  const {
    input,
    tone,
    structure = "smart",
    provider,
    apiKey,
    customBaseUrl,
    customModel,
  } = body;

  if (!input?.trim()) {
    return new Response(JSON.stringify({ error: "Input is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (input.length > 5000) {
    return new Response(
      JSON.stringify({ error: "Input too long (max 5000 chars)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const authResult = await resolveProviderAuth(provider, apiKey);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  return generatePost(auth.provider, auth.apiKey, input, tone, structure, {
    customBaseUrl,
    customModel,
    remaining: auth.remaining,
  });
}

async function generatePost(
  provider: Provider,
  apiKey: string,
  input: string,
  tone: Tone,
  structure: Structure,
  opts: { customBaseUrl?: string; customModel?: string; remaining?: number }
) {
  try {
    const system = getRestructurePrompt(tone, structure, input);
    const { text, model } = await runGeneration(provider, apiKey, system, input, opts);

    // Deterministic clean-up runs on the full post (cliches, symbols, spacing,
    // and stripping any link the model invented that wasn't in the draft).
    const draftUrls = new Set(input.match(/https?:\/\/\S+/g) || []);
    const post = finalizePost(text, draftUrls);

    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      // Which model actually produced the post (after any fallback). The client
      // shows this so the user can see when a fallback model was used.
      "X-Model-Used": model,
    };
    if (opts.remaining !== undefined) {
      headers["X-Free-Remaining"] = String(opts.remaining);
    }

    return new Response(post, { headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const GEN_PARAMS = { maxOutputTokens: 1200, temperature: 0.6 } as const;

// Picks the generation strategy per provider:
// - groq: app-level fallback across models (each has its own daily token budget,
//   so a capped primary retries on the next model).
// - openrouter: OpenRouter's native `models` array (it 429s intermittently
//   upstream; the array makes it try the next model server-side).
// - others (BYOK anthropic/openai/custom): a single call, no fallback needed.
async function runGeneration(
  provider: Provider,
  apiKey: string,
  system: string,
  input: string,
  opts: { customBaseUrl?: string; customModel?: string }
): Promise<{ text: string; model: string }> {
  if (provider === "groq") {
    const models = groqModelChain(opts.customModel);
    let lastErr: unknown;
    for (const modelId of models) {
      try {
        const model = createProviderModel("groq", apiKey, { model: modelId });
        // maxRetries 0: don't waste backoff retrying a token-capped model, just
        // move to the next one in the chain (that's our retry).
        const result = await generateText({
          model,
          system,
          prompt: input,
          ...GEN_PARAMS,
          maxRetries: 0,
        });
        return { text: result.text, model: result.response?.modelId ?? modelId };
      } catch (err) {
        lastErr = err;
        if (isClientError(err)) throw err;
        const status = (err as { statusCode?: number })?.statusCode ?? "?";
        console.warn(`[generate] groq "${modelId}" failed (${status}), trying next model`);
        // rate-limit / 5xx / network -> try the next model
      }
    }
    throw lastErr;
  }

  const model = createProviderModel(provider, apiKey, {
    baseUrl: opts.customBaseUrl,
    model: opts.customModel,
  });
  const providerOptions =
    provider === "openrouter"
      ? { openrouter: { models: openRouterModelChain(opts.customModel) } }
      : undefined;
  const result = await generateText({
    model,
    system,
    prompt: input,
    ...GEN_PARAMS,
    providerOptions,
  });
  return {
    text: result.text,
    model: result.response?.modelId ?? opts.customModel ?? provider,
  };
}
