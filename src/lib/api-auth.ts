import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import type { Provider } from "@/types";

export interface ResolvedAuth {
  provider: Provider;
  apiKey: string;
  /** Remaining free-tier generations for this IP today. Undefined for BYOK. */
  remaining?: number;
}

export type AuthResult =
  | { ok: true; auth: ResolvedAuth }
  | { ok: false; response: Response };

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Resolves which API key to use for a request: the user's own key (BYOK),
 * sent per-request and never persisted, or the server-only free-tier key,
 * gated by per-IP rate limiting. Shared by every AI route so this
 * security-sensitive logic lives in exactly one place.
 */
export async function resolveProviderAuth(
  provider: Provider,
  apiKey?: string
): Promise<AuthResult> {
  if (apiKey) {
    if (!PROVIDER_INFO[provider]) {
      return { ok: false, response: jsonError("Invalid provider", 400) };
    }
    return { ok: true, auth: { provider, apiKey } };
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "127.0.0.1";

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return {
      ok: false,
      response: jsonError(
        "Daily free limit reached. Add your own API key in settings to continue.",
        429
      ),
    };
  }

  const resolvedProvider: Provider = provider || "groq";
  let resolvedKey = "";
  if (resolvedProvider === "groq") {
    resolvedKey = process.env.GROQ_FREE_KEY || "";
  } else if (resolvedProvider === "openrouter") {
    resolvedKey = process.env.OPENROUTER_FREE_KEY || "";
  }

  if (!resolvedKey) {
    return {
      ok: false,
      response: jsonError(
        "Free tier not configured. Please add your own API key in settings.",
        503
      ),
    };
  }

  return {
    ok: true,
    auth: { provider: resolvedProvider, apiKey: resolvedKey, remaining: limit.remaining },
  };
}
