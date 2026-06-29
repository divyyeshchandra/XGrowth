import { streamText } from "ai";
import { headers } from "next/headers";
import { createProviderModel, PROVIDER_INFO } from "@/lib/ai/providers";
import { getRestructurePrompt } from "@/lib/ai/prompts";
import { checkRateLimit } from "@/lib/ratelimit";
import type { Provider, Tone, OutputMode } from "@/types";

export const runtime = "edge";

interface RequestBody {
  input: string;
  tone: Tone;
  mode: OutputMode;
  provider: Provider;
  apiKey?: string;
  customBaseUrl?: string;
  customModel?: string;
}

export async function POST(req: Request) {
  const body: RequestBody = await req.json();
  const { input, tone, mode = "single", provider, apiKey, customBaseUrl, customModel } = body;

  if (!input?.trim()) {
    return new Response(
      JSON.stringify({ error: "Input is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (input.length > 5000) {
    return new Response(
      JSON.stringify({ error: "Input too long (max 5000 chars)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const isBYOK = !!apiKey;
  let resolvedKey = apiKey || "";

  if (!isBYOK) {
    // Free tier — use server-side key + rate limit
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    const { allowed, remaining } = await checkRateLimit(ip);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Daily free limit reached. Add your own API key in settings to continue.",
          remaining: 0,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pick a free-tier key
    if (provider === "groq" || !provider) {
      resolvedKey = process.env.GROQ_FREE_KEY || "";
    } else if (provider === "openrouter") {
      resolvedKey = process.env.OPENROUTER_FREE_KEY || "";
    }

    if (!resolvedKey) {
      return new Response(
        JSON.stringify({
          error: "Free tier not configured. Please add your own API key in settings.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return remaining count in header for client UX
    const res = await generateStream(
      provider || "groq",
      resolvedKey,
      input,
      tone,
      mode,
      customBaseUrl,
      customModel
    );
    res.headers.set("X-Free-Remaining", String(remaining));
    return res;
  }

  // BYOK — validate provider+key combo
  if (!PROVIDER_INFO[provider]) {
    return new Response(
      JSON.stringify({ error: "Invalid provider" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  return generateStream(provider, resolvedKey, input, tone, mode, customBaseUrl, customModel);
}

async function generateStream(
  provider: Provider,
  apiKey: string,
  input: string,
  tone: Tone,
  mode: OutputMode,
  customBaseUrl?: string,
  customModel?: string,
) {
  try {
    const model = createProviderModel(provider, apiKey, {
      baseUrl: customBaseUrl,
      model: customModel,
    });

    const result = streamText({
      model,
      system: getRestructurePrompt(tone, mode),
      prompt: input,
      maxOutputTokens: 2048,
      temperature: 0.7,
    });

    // Sanitize the stream: strip any leaked <think> reasoning (qwen-style)
    // and normalize fancy unicode so any BYOK model produces clean output.
    const stream = sanitizeStream(result.textStream);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Normalizes characters that some models emit (non-breaking hyphens, exotic
// spaces) into plain ASCII so bullets and spacing render cleanly on X.
function normalize(s: string): string {
  return s
    .replace(/‑/g, "-") // non-breaking hyphen -> hyphen
    .replace(/[    ]/g, " "); // exotic spaces -> space
}

// A few corporate/AI cliches the model stubbornly reaches for even when told
// not to (especially on competition-themed drafts). The prompt handles ~80%;
// this deterministic net catches the rest. Each phrase is unambiguous hype, so
// a plain replacement is always safe. Longest phrase < TAIL (below).
const CLICHE_REPLACEMENTS: [RegExp, string][] = [
  [/\bgame[- ]?changer\b/gi, "a big deal"],
  [/\bgame[- ]?changing\b/gi, "major"],
  [/\bmaking waves\b/gi, "getting real attention"],
  [/\btak(?:e|es|ing) notice of\b/gi, "paying attention to"],
  [/\btak(?:e|es|ing) notice\b/gi, "paying attention"],
  [/\bwake[- ]?up call\b/gi, "a warning sign"],
  [/\bseismic shift\b/gi, "a big shift"],
  [/\bparadigm shift\b/gi, "a big shift"],
  [/\bdisrupts the market\b/gi, "shakes things up"],
];

// Normalizes unicode (via normalize) and swaps the stubborn cliches above.
// Deterministic and idempotent, so it is safe to re-run on the growing buffer.
function clean(s: string): string {
  let out = normalize(s);
  for (const [re, rep] of CLICHE_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

// Cleans the raw model stream while preserving streaming:
//  1. strips a leading <think>...</think> reasoning block (qwen-style leaks),
//  2. normalizes unicode + replaces stubborn cliches.
// To replace multi-word phrases that may span chunk boundaries, it holds back a
// short tail (TAIL chars, longer than any banned phrase) before emitting.
function sanitizeStream(
  textStream: AsyncIterable<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const TAIL = 24;
  let pre = ""; // buffer during the think-detection phase
  let started = false; // true once the real post text has begun
  let inThink = false;
  let post = ""; // accumulated post source (pre-clean)
  let emitted = 0; // chars already emitted from the cleaned text

  return new ReadableStream({
    async start(controller) {
      const pump = (final: boolean) => {
        const cleaned = clean(post);
        const end = final ? cleaned.length : Math.max(0, cleaned.length - TAIL);
        if (end > emitted) {
          controller.enqueue(encoder.encode(cleaned.slice(emitted, end)));
          emitted = end;
        }
      };

      try {
        for await (const chunk of textStream) {
          if (started) {
            post += chunk;
            pump(false);
            continue;
          }

          pre += chunk;

          // Inside a think block: wait for the closing tag, then drop it all.
          if (inThink) {
            const close = pre.indexOf("</think>");
            if (close !== -1) {
              pre = pre.slice(close + "</think>".length);
              inThink = false;
            } else {
              continue;
            }
          }

          const trimmed = pre.replace(/^\s+/, "");

          if (trimmed.startsWith("<think>")) {
            inThink = true;
            pre = trimmed;
            continue;
          }

          // Once we can rule out a leading "<think>" (enough chars or a newline),
          // the post has begun.
          if (trimmed.length >= 8 || trimmed.includes("\n")) {
            started = true;
            post = trimmed;
            pump(false);
          }
        }

        // Finalize: a very short output may never have tripped the start check.
        if (!started && !inThink) post = pre.replace(/^\s+/, "");
        pump(true);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
