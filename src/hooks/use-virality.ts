"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/store/settings-store";
import type { ViralityScore } from "@/types";

export function useVirality() {
  const { provider, customBaseUrl, customModel, currentApiKey } =
    useSettingsStore();

  const [score, setScore] = useState<ViralityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkVirality = useCallback(
    async (post: string) => {
      if (!post.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/virality", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post,
            provider,
            apiKey: currentApiKey(),
            customBaseUrl,
            customModel,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Scoring failed");

        setScore(data as ViralityScore);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Scoring failed");
      } finally {
        setIsLoading(false);
      }
    },
    [provider, customBaseUrl, customModel, currentApiKey]
  );

  const reset = useCallback(() => {
    setScore(null);
    setError(null);
  }, []);

  return { score, isLoading, error, checkVirality, reset };
}
