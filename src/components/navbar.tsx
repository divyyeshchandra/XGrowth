"use client";

import { useEffect } from "react";
import { Zap, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";
import { getUsage } from "@/lib/storage";

export function Navbar() {
  const { openSettings, hydrate, hydrated, isBYOK } = useSettingsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const usage = hydrated ? getUsage() : { count: 0 };
  const limit = 10;
  const isUsingFree = !isBYOK();

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-5xl px-6 pt-4">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C8EEF] to-[#8B5CF6]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              X GlowUp
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isUsingFree && (
              <div className="hidden sm:flex items-center rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-muted-foreground">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {limit - usage.count} / {limit} free
              </div>
            )}
            {!isUsingFree && (
              <div className="hidden sm:flex items-center rounded-full bg-[#6C8EEF]/[0.08] px-3.5 py-1.5 text-[12px] text-[#6C8EEF]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#6C8EEF]" />
                BYOK
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={openSettings}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
