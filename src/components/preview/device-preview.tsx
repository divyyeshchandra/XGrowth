"use client";

import { useState } from "react";
import { MessageCircle, Repeat2, Heart, Eye } from "lucide-react";

// X truncates a post in the timeline feed around this length and shows a
// "Show more" link, even for long-form posts. This preview mirrors that so
// users can see what followers will actually see while scrolling.
const FEED_TRUNCATE_LIMIT = 280;
const STANDARD_POST_LIMIT = 280;

type DeviceTab = "mobile" | "tablet" | "desktop";

const DEVICE_WIDTHS: Record<DeviceTab, string> = {
  mobile: "max-w-[375px]",
  tablet: "max-w-[580px]",
  desktop: "max-w-[680px]",
};

interface DevicePreviewProps {
  output: string;
}

export function DevicePreview({ output }: DevicePreviewProps) {
  const [device, setDevice] = useState<DeviceTab>("mobile");
  const [expanded, setExpanded] = useState(false);

  // Collapse back to truncated view whenever the output changes. Tracking the
  // previous output in render (the React-recommended "adjust state during
  // render" pattern) avoids an extra effect-driven render pass.
  const [prevOutput, setPrevOutput] = useState(output);
  if (output !== prevOutput) {
    setPrevOutput(output);
    setExpanded(false);
  }

  const charCount = output.length;
  const isLongForm = charCount > STANDARD_POST_LIMIT;
  const isTruncated = !expanded && charCount > FEED_TRUNCATE_LIMIT;
  const displayText = isTruncated
    ? output.slice(0, FEED_TRUNCATE_LIMIT).trimEnd()
    : output;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            Preview on X
          </span>
          {output && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono ${
                isLongForm
                  ? "bg-amber-400/10 text-amber-300/80"
                  : "bg-emerald-400/10 text-emerald-300/80"
              }`}
            >
              {charCount} chars{isLongForm ? " · long-form" : ""}
            </span>
          )}
        </div>
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
          className={`w-full ${DEVICE_WIDTHS[device]} rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300`}
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
                {displayText || "Your post preview will show here..."}
                {isTruncated && (
                  <>
                    {"... "}
                    <button
                      onClick={() => setExpanded(true)}
                      className="text-[#1d9bf0] hover:underline font-medium"
                    >
                      Show more
                    </button>
                  </>
                )}
              </div>
              <div className="mt-5 flex justify-between pt-3 border-t border-white/[0.04]">
                {[
                  {
                    icon: MessageCircle,
                    val: "24",
                    hoverColor: "hover:text-[#1d9bf0]",
                  },
                  {
                    icon: Repeat2,
                    val: "142",
                    hoverColor: "hover:text-emerald-400",
                  },
                  {
                    icon: Heart,
                    val: "1.2K",
                    hoverColor: "hover:text-rose-400",
                  },
                  {
                    icon: Eye,
                    val: "45K",
                    hoverColor: "hover:text-muted-foreground",
                  },
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
  );
}
