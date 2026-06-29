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
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
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
