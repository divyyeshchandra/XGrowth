import { generateText } from "ai";
import { headers } from "next/headers";
import { createProviderModel, PROVIDER_INFO } from "@/lib/ai/providers";
import { getRestructurePrompt } from "@/lib/ai/prompts";
import { finalizePost } from "@/lib/ai/format";
import { checkRateLimit } from "@/lib/ratelimit";
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

  const isBYOK = !!apiKey;
  let resolvedKey = apiKey || "";
  let remaining = 999;

  if (!isBYOK) {
    // Free tier — use server-side key + rate limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const limit = await checkRateLimit(ip);
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error:
            "Daily free limit reached. Add your own API key in settings to continue.",
          remaining: 0,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    remaining = limit.remaining;

    if (provider === "groq" || !provider) {
      resolvedKey = process.env.GROQ_FREE_KEY || "";
    } else if (provider === "openrouter") {
      resolvedKey = process.env.OPENROUTER_FREE_KEY || "";
    }

    if (!resolvedKey) {
      return new Response(
        JSON.stringify({
          error:
            "Free tier not configured. Please add your own API key in settings.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (!PROVIDER_INFO[provider]) {
    return new Response(JSON.stringify({ error: "Invalid provider" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return generatePost(
    provider || "groq",
    resolvedKey,
    input,
    tone,
    structure,
    { customBaseUrl, customModel, remaining: isBYOK ? undefined : remaining }
  );
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
      system: getRestructurePrompt(tone, structure, input.length),
      prompt: input,
      maxOutputTokens: 1536,
      temperature: 0.7,
    });

    // Deterministic clean-up runs on the full post (cliches, symbols, spacing).
    const post = finalizePost(text);

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
