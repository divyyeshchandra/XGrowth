export type Provider = "groq" | "openrouter" | "anthropic" | "openai" | "custom";

export type Tone = "Professional" | "Casual" | "Bold" | "Witty";

export type Structure = "smart" | "narrative" | "listicle" | "curated";

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// Mirrors viralXpostAlgo.md's "4 parts to a viral tweet": readability, hook,
// personal body, emotional closer.
export interface ViralityScore {
  score: number;
  breakdown: {
    readability: number;
    hook: number;
    body: number;
    closer: number;
  };
  suggestions: string[];
}

export interface GenerationResult {
  output: string;
  virality?: ViralityScore;
}

export interface HistoryEntry {
  id: string;
  input: string;
  output: string;
  tone: Tone;
  virality?: ViralityScore;
  createdAt: number;
}
