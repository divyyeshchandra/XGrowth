"use client";

import { useState } from "react";
import {
  Zap,
  MessageCircle,
  Repeat2,
  Heart,
  Eye,
  ArrowRight,
  Square,
  AlertCircle,
  AlignLeft,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard } from "@/components/editor/output-card";
import { useGenerate } from "@/hooks/use-generate";
import { useSettingsStore } from "@/store/settings-store";
import type { Tone, OutputMode } from "@/types";

const TONES: Tone[] = ["Professional", "Casual", "Bold", "Witty"];

type DeviceTab = "mobile" | "tablet" | "desktop";

export default function Home() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<Tone>("Casual");
  const [mode, setMode] = useState<OutputMode>("single");
  const [device, setDevice] = useState<DeviceTab>("mobile");

  const { output, isLoading, error, generate, stop } = useGenerate();
  const { openSettings } = useSettingsStore();

  const handleGenerate = () => {
    if (!input.trim() || isLoading) return;
    generate(input, tone, mode);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  };

  const handleRegenerate = () => {
    if (!input.trim() || isLoading) return;
    generate(input, tone, mode);
  };

  const deviceWidths: Record<DeviceTab, string> = {
    mobile: "max-w-[375px]",
    tablet: "max-w-[580px]",
    desktop: "max-w-[680px]",
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

          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground/60 uppercase tracking-wider font-medium">
              Format
            </span>
            <div className="flex rounded-xl bg-white/[0.04] p-1">
              <button
                onClick={() => setMode("single")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  mode === "single"
                    ? "bg-white/[0.1] text-foreground shadow-sm"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Single
              </button>
              <button
                onClick={() => setMode("thread")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  mode === "thread"
                    ? "bg-white/[0.1] text-foreground shadow-sm"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Thread
              </button>
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
            isLoading={isLoading}
            onCopy={handleCopy}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>

      {/* Device Preview */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            Preview on X
          </span>
          <div className="flex rounded-xl bg-white/[0.04] p-1">
            {(["mobile", "tablet", "desktop"] as DeviceTab[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`rounded-lg px-4 py-1.5 text-[13px] font-medium capitalize transition-all ${
                  device === d
                    ? "bg-white/[0.1] text-foreground shadow-sm"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Mock X Post */}
        <div className="flex justify-center">
          <div
            className={`w-full ${deviceWidths[device]} rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300`}
          >
            <div className="flex gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C8EEF]/30 to-[#8B5CF6]/30 text-[14px] font-bold text-[#6C8EEF]">
                Y
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[15px]">You</span>
                  <svg
                    className="h-4 w-4 text-[#1d9bf0]"
                    fill="currentColor"
                    viewBox="0 0 22 22"
                  >
                    <path d="M20.4 8.86a8.16 8.16 0 01-2.3.64 4.1 4.1 0 001.8-2.27 8.07 8.07 0 01-2.6 1 4.07 4.07 0 00-6.95 3.71A11.56 11.56 0 013 5.78a4.08 4.08 0 001.26 5.44 4 4 0 01-1.85-.51v.05a4.07 4.07 0 003.27 4 4 4 0 01-1.84.07 4.08 4.08 0 003.8 2.83A8.17 8.17 0 012 19.28a11.5 11.5 0 006.29 1.84A11.5 11.5 0 0019.85 9.7v-.53A8.25 8.25 0 0022 7.1a8.2 8.2 0 01-2.36.65 4.12 4.12 0 001.8-2.27l-.04-.01z" />
                  </svg>
                  <span className="text-[13px] text-muted-foreground/50">
                    @you · 1m
                  </span>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.7] text-foreground/85">
                  {output
                    ? output.replaceAll("\n---\n", "\n\n")
                    : "Your post preview will show here..."}
                </div>
                <div className="mt-5 flex justify-between pt-3 border-t border-white/[0.04]">
                  {[
                    { icon: MessageCircle, val: "24", hoverColor: "hover:text-[#1d9bf0]" },
                    { icon: Repeat2, val: "142", hoverColor: "hover:text-emerald-400" },
                    { icon: Heart, val: "1.2K", hoverColor: "hover:text-rose-400" },
                    { icon: Eye, val: "45K", hoverColor: "hover:text-muted-foreground" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className={`flex items-center gap-1.5 text-[12px] text-muted-foreground/40 ${item.hoverColor} transition-colors`}
                    >
                      <item.icon className="h-[15px] w-[15px]" />
                      {item.val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virality Score & Niche — placeholders for M4/M5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Virality Score */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
              Virality Score
            </span>
            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] text-muted-foreground/50 uppercase tracking-wider">
              Coming in M4
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/20">
            <p className="text-[14px]">Generate a post to see its virality score</p>
          </div>
        </div>

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
