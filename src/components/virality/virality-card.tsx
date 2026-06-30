"use client";

import { TrendingUp, Loader2, AlertCircle, Lightbulb } from "lucide-react";
import type { ViralityScore } from "@/types";

const BREAKDOWN_LABELS: Record<keyof ViralityScore["breakdown"], string> = {
  readability: "Readability",
  hook: "Hook",
  body: "Body",
  closer: "Closer",
};

function scoreColor(value: number): string {
  if (value >= 70) return "from-emerald-400 to-emerald-500";
  if (value >= 40) return "from-amber-400 to-amber-500";
  return "from-rose-400 to-rose-500";
}

function ringColor(value: number): string {
  if (value >= 70) return "#34d399";
  if (value >= 40) return "#fbbf24";
  return "#fb7185";
}

interface ViralityCardProps {
  hasOutput: boolean;
  score: ViralityScore | null;
  isLoading: boolean;
  error: string | null;
  onCheck: () => void;
}

export function ViralityCard({
  hasOutput,
  score,
  isLoading,
  error,
  onCheck,
}: ViralityCardProps) {
  const circumference = 2 * Math.PI * 50;
  const dashOffset = score
    ? circumference - (score.score / 100) * circumference
    : circumference;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
          Virality Score
        </span>
        {score && (
          <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[11px] text-muted-foreground/50 uppercase tracking-wider">
            Estimated
          </span>
        )}
      </div>

      {!hasOutput ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/20">
          <p className="text-[14px]">Generate a post to see its virality score</p>
        </div>
      ) : !score && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 h-32">
          <button
            onClick={onCheck}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C8EEF] to-[#8B5CF6] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            Check Virality
          </button>
          {error && (
            <p className="flex items-center gap-1.5 text-[12px] text-red-400/80">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/30">
          <Loader2 className="h-6 w-6 animate-spin mb-3 text-[#6C8EEF]/50" />
          <p className="text-[14px]">Scoring against the viral formula...</p>
        </div>
      ) : score ? (
        <>
          {/* Gauge + breakdown */}
          <div className="flex items-center gap-6">
            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/[0.06]"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={ringColor(score.score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{score.score}</span>
                <span className="text-[10px] text-muted-foreground/40">/100</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {(Object.keys(score.breakdown) as (keyof ViralityScore["breakdown"])[]).map(
                (key) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground/60">
                        {BREAKDOWN_LABELS[key]}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground/40">
                        {score.breakdown[key]}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${scoreColor(
                          score.breakdown[key]
                        )} transition-all duration-700 ease-out`}
                        style={{ width: `${score.breakdown[key]}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.04]">
              {score.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-300/60" />
                  <p className="text-[12.5px] text-muted-foreground/70 leading-relaxed">
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onCheck}
            className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            Re-check
          </button>
        </>
      ) : null}
    </div>
  );
}
