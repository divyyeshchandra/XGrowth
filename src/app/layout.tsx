import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { SettingsModal } from "@/components/settings/settings-modal";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X GlowUp — Turn rough drafts into viral X posts",
  description:
    "The best free webapp to turn rough drafts into high-quality, viral-ready X posts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground bg-mesh">
        <TooltipProvider>
          <Navbar />
          <SettingsModal />
          <main className="flex-1">{children}</main>
          <footer className="py-8 text-center text-[13px] text-muted-foreground/60 tracking-wide">
            Built for X creators &middot; X GlowUp
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
