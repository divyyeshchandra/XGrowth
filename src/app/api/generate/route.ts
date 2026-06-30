import { generateText } from "ai";
import { createProviderModel } from "@/lib/ai/providers";
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
    const model = createProviderModel(provider, apiKey, {
      baseUrl: opts.customBaseUrl,
      model: opts.customModel,
    });

    const { text } = await generateText({
      model,
      system: getRestructurePrompt(tone, structure, input),
      prompt: input,
      maxOutputTokens: 2500,
      temperature: 0.6,
    });

    // Deterministic clean-up runs on the full post (cliches, symbols, spacing,
    // and stripping any link the model invented that wasn't in the draft).
    const draftUrls = new Set(input.match(/https?:\/\/\S+/g) || []);
    const post = finalizePost(text, draftUrls);

    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
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
