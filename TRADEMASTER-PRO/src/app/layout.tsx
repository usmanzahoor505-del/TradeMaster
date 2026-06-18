import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "TRADEMASTER PRO — Institutional Grade Exchange",
    template: "%s | TRADEMASTER PRO",
  },
  description:
    "Ultra-premium crypto trading platform. Real-time order books, advanced charting, and zero-latency execution for professionals.",
  keywords: [
    "crypto", "trading", "exchange", "bitcoin", "ethereum",
    "order book", "DeFi", "institutional", "derivatives", "spot trading",
  ],
  authors: [{ name: "TRADEMASTER PRO" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "TRADEMASTER PRO — Institutional Grade Exchange",
    description: "Ultra-premium crypto trading platform for professionals.",
    type: "website",
    locale: "en_US",
    siteName: "TRADEMASTER PRO",
  },
  twitter: {
    card: "summary_large_image",
    title: "TRADEMASTER PRO",
    description: "Institutional-grade crypto trading platform.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen font-sans bg-[#0a0a0f] text-foreground antialiased",
          "selection:bg-indigo-500/30 selection:text-white",
          inter.variable,
          jetbrainsMono.variable
        )}
      >

        {/* ── Ambient Background ─────────────────────────────────────────── */}
        <div
          className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {/* Base */}
          <div className="absolute inset-0 bg-[#0a0a0f]" />

          {/* Top center — main indigo nebula */}
          <div
            className="absolute -top-64 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-25"
            style={{
              background: "radial-gradient(ellipse at center, rgba(99,102,241,0.5) 0%, rgba(79,70,229,0.2) 40%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />

          {/* Top-left — blue accent */}
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[500px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle at center, rgba(59,130,246,0.4) 0%, transparent 65%)",
              filter: "blur(90px)",
            }}
          />

          {/* Top-right — violet accent */}
          <div
            className="absolute -top-16 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle at center, rgba(139,92,246,0.45) 0%, transparent 65%)",
              filter: "blur(100px)",
            }}
          />

          {/* Mid-left — subtle blue */}
          <div
            className="absolute top-1/3 -left-48 w-[400px] h-[600px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle at center, rgba(59,130,246,0.35) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />

          {/* Mid-right — indigo */}
          <div
            className="absolute top-1/2 -right-48 w-[400px] h-[600px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle at center, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />

          {/* Bottom-center — teal glow */}
          <div
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-12"
            style={{
              background: "radial-gradient(ellipse at center, rgba(20,184,166,0.3) 0%, transparent 70%)",
              filter: "blur(120px)",
            }}
          />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "256px 256px",
            }}
          />

          {/* Vignette — edges dark */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          {/* Top edge fade */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent)",
            }}
          />
        </div>

        {/* ── App Shell ──────────────────────────────────────────────────── */}
        <Providers>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </Providers>

      </body>
    </html>
  );
}