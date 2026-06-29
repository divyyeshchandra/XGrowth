export type Provider = "groq" | "openrouter" | "anthropic" | "openai" | "custom";

export type Tone = "Professional" | "Casual" | "Bold" | "Witty";

export type OutputMode = "single" | "thread";

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface ViralityScore {
  score: number;
  breakdown: {
    hookStrength: number;
    emotionalTrigger: number;
    callToAction: number;
    readability: number;
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
