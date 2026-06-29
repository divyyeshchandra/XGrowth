"use client";

import { useState } from "react";
import {
  Copy,
  RotateCcw,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { parseThread, CHAR_LIMIT } from "@/lib/thread";

interface OutputCardProps {
  output: string;
  isLoading: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
}

export function OutputCard({
  output,
  isLoading,
  onCopy,
  onRegenerate,
}: OutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweets = parseThread(output);
  const isThread = tweets.length > 1;

  return (
    <div className="glass-card rounded-2xl p-5 min-h-[280px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#6C8EEF]" />
          <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            GlowUp
          </span>
          {output && isThread && (
            <span className="text-[11px] text-muted-foreground/40 ml-1">
              {tweets.length} tweets
            </span>
          )}
        </div>
        {output && (
          <div className="flex gap-1">
            <button
              onClick={handleCopy}
              className="rounded-xl p-2 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-all"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="rounded-xl p-2 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && !output ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/30">
          <Loader2 className="h-6 w-6 animate-spin mb-3 text-[#6C8EEF]/50" />
          <p className="text-[14px]">Writing your GlowUp...</p>
        </div>
      ) : output ? (
        <div className="space-y-0">
          {isThread ? (
            <div className="space-y-3">
              {tweets.map((tweet) => (
                <div
                  key={tweet.index}
                  className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
                >
                  <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-foreground/90">
                    {tweet.text}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                    <span className="text-[11px] text-muted-foreground/30">
                      Tweet {tweet.index + 1}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        tweet.isOverLimit
                          ? "text-red-400"
                          : tweet.charCount > CHAR_LIMIT * 0.9
                            ? "text-amber-400/70"
                            : "text-muted-foreground/30"
                      }`}
                    >
                      {tweet.charCount}/{CHAR_LIMIT}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-foreground/90">
                {output}
                {isLoading && (
                  <span className="inline-block w-1.5 h-5 bg-[#6C8EEF] ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
              {!isLoading && (
                <div className="flex justify-end mt-3 pt-2 border-t border-white/[0.04]">
                  <span
                    className={`text-[11px] font-mono ${
                      output.length > CHAR_LIMIT
                        ? "text-red-400"
                        : output.length > CHAR_LIMIT * 0.9
                          ? "text-amber-400/70"
                          : "text-muted-foreground/30"
                    }`}
                  >
                    {output.length}/{CHAR_LIMIT}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/30">
          <Sparkles className="h-8 w-8 mb-3" />
          <p className="text-[14px]">Your glowed-up post appears here</p>
        </div>
      )}
    </div>
  );
}
