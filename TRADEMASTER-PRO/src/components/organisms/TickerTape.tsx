"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface Ticker {
  pair: string;
  price: string;
  change: string;
  volume?: string;
}

const MOCK_TICKERS: Ticker[] = [
  { pair: "BTC/USD", price: "64,230.00", change: "+2.4%", volume: "1.2B" },
  { pair: "ETH/USD", price: "3,450.12", change: "+1.8%", volume: "820M" },
  { pair: "SOL/USD", price: "145.20",   change: "-0.5%", volume: "310M" },
  { pair: "BNB/USD", price: "580.40",   change: "+0.9%", volume: "190M" },
  { pair: "XRP/USD", price: "0.6248",   change: "+4.2%", volume: "540M" },
  { pair: "ADA/USD", price: "0.4512",   change: "-1.1%", volume: "98M"  },
  { pair: "DOGE/USD", price: "0.1384",  change: "+6.3%", volume: "430M" },
  { pair: "AVAX/USD", price: "38.74",   change: "-2.0%", volume: "175M" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDirection(change: string): "up" | "down" | "flat" {
  if (change.startsWith("+")) return "up";
  if (change.startsWith("-")) return "down";
  return "flat";
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <span
      className="w-px h-4 shrink-0 rounded-full"
      style={{ background: "rgba(255,255,255,0.08)" }}
      aria-hidden
    />
  );
}

// ─── Single Ticker Item ───────────────────────────────────────────────────────

function TickerItem({ ticker }: { ticker: Ticker }) {
  const dir = getDirection(ticker.change);
  const isUp = dir === "up";
  const isDown = dir === "down";

  const changeColor = isUp
    ? "text-green-400"
    : isDown
    ? "text-red-400"
    : "text-muted-foreground";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-3 shrink-0 group cursor-default select-none">
      {/* Pair */}
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
        {ticker.pair}
      </span>

      {/* Price */}
      <span className="text-sm font-bold font-mono text-white tabular-nums">
        ${ticker.price}
      </span>

      {/* Change pill */}
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
          isUp
            ? "bg-green-500/10 text-green-400"
            : isDown
            ? "bg-red-500/10 text-red-400"
            : "bg-white/5 text-muted-foreground"
        }`}
      >
        <Icon className="w-3 h-3" />
        {ticker.change}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// Duplicate twice for seamless loop — motion animates from 0% → -50%
const LOOP_ITEMS = [...MOCK_TICKERS, ...MOCK_TICKERS];

export function TickerTape() {
  return (
    <div
      className="w-full overflow-hidden flex items-center border-y border-white/5 py-2.5 relative"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(0,0,0,0.25) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      />

      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      />

      <motion.div
        className="flex items-center gap-8 min-w-max px-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
      >
        {LOOP_ITEMS.map((ticker, i) => (
          <div key={i} className="flex items-center gap-8">
            <TickerItem ticker={ticker} />
            <Divider />
          </div>
        ))}
      </motion.div>
    </div>
  );
}