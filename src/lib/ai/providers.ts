import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { Provider } from "@/types";

export interface ProviderInfo {
  name: string;
  defaultModel: string;
  getKeyUrl: string;
  placeholder: string;
}

export const PROVIDER_INFO: Record<Provider, ProviderInfo> = {
  groq: {
    name: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    getKeyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
  },
  openrouter: {
    name: "OpenRouter",
    // gemma-4-31b is the best free OpenRouter model for this app: consistently
    // available, fast-ish, clean output, follows the prompt. The old default
    // (meta-llama/llama-3.3-70b-instruct:free) is chronically 429 upstream at
    // Venice. Note: Groq stays the primary free provider; OpenRouter is fallback.
    defaultModel: "google/gemma-4-31b-it:free",
    getKeyUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
  anthropic: {
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-20250514",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    getKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  custom: {
    name: "Custom",
    defaultModel: "",
    getKeyUrl: "",
    placeholder: "Your API key",
  },
};

export function createProviderModel(
  provider: Provider,
  apiKey: string,
  options?: { baseUrl?: string; model?: string }
) {
  const model = options?.model || PROVIDER_INFO[provider].defaultModel;

  switch (provider) {
    case "groq": {
      const groq = createGroq({ apiKey });
      return groq(model);
    }
    case "openrouter": {
      const or = createOpenAICompatible({
        name: "openrouter",
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return or(model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }
    case "custom": {
      if (!options?.baseUrl) throw new Error("Custom provider requires a base URL");
      const custom = createOpenAICompatible({
        name: "custom",
        apiKey,
        baseURL: options.baseUrl,
      });
      return custom(model || "default");
    }
  }
}

export const FREE_PROVIDERS: Provider[] = ["groq", "openrouter"];

// Free OpenRouter models intermittently 429 at their upstream provider (shared
// pools saturate at peak). OpenRouter supports a `models` array (max 3) that it
// tries in order, falling through on a provider error. We pass a curated chain
// of real CHAT models (NOT openrouter/free, which can route to a non-chat model
// like a content-safety classifier and return empty output). The chosen model
// goes first (quality), with reliable fallbacks behind it.
const OPENROUTER_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export function openRouterModelChain(chosen?: string): string[] {
  const chain = chosen ? [chosen, ...OPENROUTER_FALLBACKS] : [...OPENROUTER_FALLBACKS];
  return [...new Set(chain)].slice(0, 3); // OpenRouter caps the array at 3
}

// Groq's token-per-day limit is PER MODEL, so when the primary model is capped
// we retry on a different Groq model (each has its own daily budget). All three
// are capable instruct chat models verified to return clean output (gpt-oss
// returns empty, qwen leaks <think>, compound is agentic — excluded).
const GROQ_FALLBACKS = [
  "llama-3.3-70b-versatile", // primary: best quality + prompt adherence
  "openai/gpt-oss-120b", // cleanest fallback (faithful, doesn't fabricate)
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant", // last resort: fast/reliable but weaker (can fabricate POV)
];

export function groqModelChain(chosen?: string): string[] {
  const chain = chosen ? [chosen, ...GROQ_FALLBACKS] : [...GROQ_FALLBACKS];
  return [...new Set(chain)];
}

// A clear client error (bad request / auth / not found) should NOT fall back to
// the next model, since it would fail identically everywhere. Everything else
// (rate-limit 429, 5xx, network) is worth retrying on the next model in a chain.
export function isClientError(err: unknown): boolean {
  const status = (err as { statusCode?: number })?.statusCode;
  return typeof status === "number" && status >= 400 && status < 500 && status !== 429;
}
