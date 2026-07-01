"use client";

import { useState } from "react";
import {
  Zap,
  Square,
  AlertCircle,
  Sparkles,
  AlignLeft,
  List,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard } from "@/components/editor/output-card";
import { DevicePreview } from "@/components/preview/device-preview";
import { ViralityCard } from "@/components/virality/virality-card";
import { useGenerate } from "@/hooks/use-generate";
import { useVirality } from "@/hooks/use-virality";
import { useSettingsStore } from "@/store/settings-store";
import type { Tone, Structure } from "@/types";

const TONES: Tone[] = ["Professional", "Casual", "Bold", "Witty"];

const STRUCTURES: { id: Structure; label: string; icon: typeof Sparkles }[] = [
  { id: "smart", label: "Smart", icon: Sparkles },
  { id: "narrative", label: "Narrative", icon: AlignLeft },
  { id: "listicle", label: "Listicle", icon: List },
  { id: "curated", label: "Curated", icon: ListTree },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<Tone>("Casual");
  const [structure, setStructure] = useState<Structure>("smart");

  const { output, modelUsed, isLoading, error, generate, stop } = useGenerate();
  const {
    score: viralityScore,
    isLoading: viralityLoading,
    error: viralityError,
    checkVirality,
    reset: resetVirality,
  } = useVirality();
  const { openSettings } = useSettingsStore();

  const handleGenerate = () => {
    if (!input.trim() || isLoading) return;
    resetVirality();
    generate(input, tone, structure);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  };

  const handleRegenerate = () => {
    if (!input.trim() || isLoading) return;
    resetVirality();
    generate(input, tone, structure);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Hero heading */}
      <div className="text-center space-y-3 pt-4 pb-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          GlowUp your posts
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          Paste your rough draft. Get a polished, viral-ready X post in seconds.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/[0.06] border border-red-500/[0.1] px-5 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-[13px] text-red-300/80">{error}</p>
          {error.includes("API key") && (
            <button
              onClick={openSettings}
              className="ml-auto text-[12px] font-medium text-[#6C8EEF] hover:underline shrink-0"
            >
              Open settings
            </button>
          )}
        </div>
      )}

      {/* Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
                Draft
              </span>
              <span className="text-[12px] text-muted-foreground/50">
                {input.length} chars
              </span>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your rough draft here..."
              className="min-h-[200px] resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Tone */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                Tone
              </span>
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                    tone === t
                      ? "bg-gradient-to-r from-[#6C8EEF] to-[#8B5CF6] text-white shadow-lg shadow-[#6C8EEF]/20"
                      : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Structure selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              Structure
            </span>
            <div className="flex rounded-xl bg-white/[0.04] p-1 flex-wrap">
              {STRUCTURES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStructure(s.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                      structure === s.id
                        ? "bg-white/[0.1] text-foreground shadow-sm"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <Button
              onClick={stop}
              className="w-full h-12 gap-2.5 rounded-2xl text-[15px] font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-foreground border-0 transition-all"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!input.trim()}
              className="w-full h-12 gap-2.5 rounded-2xl text-[15px] font-semibold bg-gradient-to-r from-[#6C8EEF] to-[#8B5CF6] hover:opacity-90 glow-primary border-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              GlowUp
            </Button>
          )}

          <p className="text-center text-[11px] text-muted-foreground/30">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] text-muted-foreground/50">
              Cmd+Enter
            </kbd>{" "}
            to generate
          </p>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <OutputCard
            output={output}
            modelUsed={modelUsed}
            isLoading={isLoading}
            onCopy={handleCopy}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>

      {/* Device Preview */}
      <DevicePreview output={output} />

      {/* Virality Score & Niche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ViralityCard
          hasOutput={!!output}
          score={viralityScore}
          isLoading={viralityLoading}
          error={viralityError}
          onCheck={() => checkVirality(output)}
        />

        {/* Niche Angles */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            Niche Angle Ideas
          </span>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/20">
            <p className="text-[14px]">Niche angles coming in M5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
