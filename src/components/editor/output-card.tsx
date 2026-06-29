"use client";

import { useState } from "react";
import { Copy, RotateCcw, Sparkles, Loader2, Check } from "lucide-react";

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

  return (
    <div className="glass-card rounded-2xl p-5 min-h-[280px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#6C8EEF]" />
          <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            GlowUp
          </span>
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/30">
          <Loader2 className="h-6 w-6 animate-spin mb-3 text-[#6C8EEF]/50" />
          <p className="text-[14px]">Writing your GlowUp...</p>
        </div>
      ) : output ? (
        <div>
          <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-foreground/90">
            {output}
          </div>
          <div className="flex justify-end mt-3 pt-2 border-t border-white/[0.04]">
            <span className="text-[11px] font-mono text-muted-foreground/30">
              {output.length} chars
            </span>
          </div>
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
