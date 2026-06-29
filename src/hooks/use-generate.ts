"use client";

import { useState, useCallback } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { incrementUsage, getUsage } from "@/lib/storage";
import type { Tone, Structure } from "@/types";

export function useGenerate() {
  const { provider, customBaseUrl, customModel, currentApiKey, isBYOK } =
    useSettingsStore();

  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const generate = useCallback(
    async (input: string, tone: Tone, structure: Structure) => {
      setOutput("");
      setError(null);
      setIsLoading(true);

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input,
            tone,
            structure,
            provider,
            apiKey: currentApiKey(),
            customBaseUrl,
            customModel,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Generation failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setOutput(fullText);
        }

        if (!isBYOK()) {
          incrementUsage();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped generation
        } else {
          setError(err instanceof Error ? err.message : "Generation failed");
        }
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
    },
    [provider, customBaseUrl, customModel, currentApiKey, isBYOK]
  );

  const stop = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const usage = typeof window !== "undefined" ? getUsage() : { count: 0, date: "" };

  return {
    output,
    isLoading,
    error,
    generate,
    stop,
    usage,
    isBYOK: isBYOK(),
  };
}
