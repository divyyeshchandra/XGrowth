"use client";

import { useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  ShieldAlert,
  Trash2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";
import { PROVIDER_INFO, FREE_PROVIDERS } from "@/lib/ai/providers";
import type { Provider } from "@/types";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "groq", label: "Groq" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
  { id: "custom", label: "Custom" },
];

export function SettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    provider,
    keys,
    customBaseUrl,
    customModel,
    setProvider,
    setKeyForProvider,
    setCustomBaseUrl,
    setCustomModel,
    clearAllKeys,
  } = useSettingsStore();

  const [showKey, setShowKey] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentKey = keys[provider] || "";
  const info = PROVIDER_INFO[provider];
  const isFreeProvider = FREE_PROVIDERS.includes(provider);

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="sm:max-w-[480px] bg-[#0a0a0a] border-white/[0.08] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/60">
            Connect your API key or use the free tier.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Provider Selector */}
          <div className="space-y-2.5">
            <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wider font-medium">
              Provider
            </label>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
                    provider === p.id
                      ? "bg-gradient-to-r from-[#6C8EEF] to-[#8B5CF6] text-white shadow-lg shadow-[#6C8EEF]/20"
                      : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                  }`}
                >
                  {p.label}
                  {FREE_PROVIDERS.includes(p.id) && (
                    <span className="ml-1.5 text-[10px] opacity-60">FREE</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Free tier notice */}
          {isFreeProvider && !currentKey && (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.1] px-4 py-3">
              <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] text-emerald-300/90 font-medium">
                  Free tier available
                </p>
                <p className="text-[12px] text-emerald-300/50 mt-0.5">
                  No key needed — limited to {process.env.NEXT_PUBLIC_FREE_LIMIT || "10"} uses/day.
                  Add your own key for unlimited access.
                </p>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-2.5">
            <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wider font-medium">
              API Key {isFreeProvider && <span className="normal-case">(optional)</span>}
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={currentKey}
                onChange={(e) => setKeyForProvider(provider, e.target.value)}
                placeholder={info.placeholder}
                className="h-11 rounded-xl bg-white/[0.03] border-white/[0.06] pr-10 text-[14px] focus:border-[#6C8EEF]/40 focus:bg-white/[0.04] placeholder:text-muted-foreground/25"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Get Free Key Link */}
            {info.getKeyUrl && (
              <a
                href={info.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-[#6C8EEF]/70 hover:text-[#6C8EEF] transition-colors font-medium"
              >
                Get a {info.name} API key
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Custom provider fields */}
          {provider === "custom" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                  Base URL
                </label>
                <Input
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="h-11 rounded-xl bg-white/[0.03] border-white/[0.06] text-[14px] focus:border-[#6C8EEF]/40 placeholder:text-muted-foreground/25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[12px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                  Model ID
                </label>
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. llama-3-70b"
                  className="h-11 rounded-xl bg-white/[0.03] border-white/[0.06] text-[14px] focus:border-[#6C8EEF]/40 placeholder:text-muted-foreground/25"
                />
              </div>
            </div>
          )}

          {/* Model info */}
          {provider !== "custom" && (
            <div className="text-[12px] text-muted-foreground/40">
              Model: <span className="text-muted-foreground/60">{info.defaultModel}</span>
            </div>
          )}

          {/* Security notice */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.08] px-4 py-3">
            <ShieldAlert className="h-4 w-4 text-amber-400/60 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-300/50 leading-relaxed">
              Your key is stored in your browser only and sent per-request. It
              is never saved or logged on our servers.
            </p>
          </div>

          {/* Clear all keys */}
          {Object.values(keys).some(Boolean) && (
            <div className="pt-2 border-t border-white/[0.04]">
              {showClearConfirm ? (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-muted-foreground/60">
                    Clear all saved keys?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearAllKeys();
                      setShowClearConfirm(false);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-[13px] h-8"
                  >
                    Yes, clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-muted-foreground/50 text-[13px] h-8"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-[13px] text-muted-foreground/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all keys
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
