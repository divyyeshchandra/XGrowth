import type { Provider } from "@/types";

const KEYS_STORAGE_KEY = "xglowup:keys";
const USAGE_STORAGE_KEY = "xglowup:usage";

interface StoredKeys {
  provider: Provider;
  keys: Partial<Record<Provider, string>>;
  customBaseUrl?: string;
  customModel?: string;
}

export function loadStoredKeys(): StoredKeys {
  if (typeof window === "undefined") {
    return { provider: "groq", keys: {} };
  }
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { provider: "groq", keys: {} };
    return JSON.parse(raw);
  } catch {
    return { provider: "groq", keys: {} };
  }
}

export function saveStoredKeys(data: StoredKeys): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredKeys(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS_STORAGE_KEY);
}

interface UsageData {
  count: number;
  date: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getUsage(): UsageData {
  if (typeof window === "undefined") return { count: 0, date: todayStr() };
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return { count: 0, date: todayStr() };
    const data: UsageData = JSON.parse(raw);
    if (data.date !== todayStr()) return { count: 0, date: todayStr() };
    return data;
  } catch {
    return { count: 0, date: todayStr() };
  }
}

export function incrementUsage(): UsageData {
  const usage = getUsage();
  usage.count += 1;
  usage.date = todayStr();
  if (typeof window !== "undefined") {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  }
  return usage;
}
