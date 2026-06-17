"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Star, Bell, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeHeaderProps {
  pair: string;
}

interface StatItem {
  label: string;
  value: string;
  highlight?: "up" | "down" | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS: StatItem[] = [
  { label: "Mark Price",   value: "64,230.50", highlight: "up" },
  { label: "24h Change",   value: "+2.45%",    highlight: "up" },
  { label: "24h High",     value: "65,100.00", highlight: null },
  { label: "24h Low",      value: "62,800.00", highlight: null },
  { label: "24h Vol (BTC)", value: "12,450.22", highlight: null },
  { label: "24h Vol (USD)", value: "799.1M",    highlight: null },
];

const PAIRS = ["BTC/USD", "ETH/USD", "SOL/USD", "BNB/USD", "XRP/USD"];

// ─── Stat Cell ────────────────────────────────────────────────────────────────

function StatCell({ stat }: { stat: StatItem }) {
  const color =
    stat.highlight === "up"
      ? "text-green-400"
      : stat.highlight === "down"
      ? "text-red-400"
      : "text-white/85";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        {stat.label}
      </span>
      <span className={`text-sm font-bold font-mono tabular-nums ${color}`}>
        {stat.value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TradeHeader({ pair }: TradeHeaderProps) {
  const formattedPair = pair.replace("-", "/").toUpperCase();
  const [showPairs, setShowPairs] = useState(false);
  const [activePair, setActivePair] = useState(formattedPair);
  const [starred, setStarred] = useState(false);

  const isUp = true; // derived from 24h change sign

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-between w-full px-4 h-16 border-b border-white/5"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* ── Left: Pair Selector + Stats ──────────────────────────────────── */}
      <div className="flex items-center gap-6 min-w-0">

        {/* Pair Selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPairs((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: isUp
                  ? "linear-gradient(135deg,#16a34a,#22c55e)"
                  : "linear-gradient(135deg,#dc2626,#ef4444)",
                boxShadow: isUp
                  ? "0 0 8px rgba(34,197,94,0.5)"
                  : "0 0 8px rgba(239,68,68,0.5)",
              }}
            />
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-primary transition-colors">
              {activePair}
            </h1>
            <motion.span
              animate={{ rotate: showPairs ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
            </motion.span>
          </button>

          {/* Pair Dropdown */}
          <AnimatePresence>
            {showPairs && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-full mt-2 z-50 w-40 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                style={{
                  background: "rgba(8,8,16,0.96)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {PAIRS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setActivePair(p); setShowPairs(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/5 flex items-center justify-between ${
                      activePair === p ? "text-primary" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {p}
                    {activePair === p && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Divider */}
        <span className="hidden md:block w-px h-6 bg-white/8 shrink-0" />

        {/* Stats Row */}
        <div className="hidden md:flex items-center gap-6 overflow-x-auto no-scrollbar">
          {STATS.map((s) => (
            <StatCell key={s.label} stat={s} />
          ))}
        </div>
      </div>

      {/* ── Right: Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {/* Star */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => setStarred((v) => !v)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Watchlist"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50 hover:text-white/60"
            }`}
          />
        </motion.button>

        {/* Alert */}
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/50 hover:text-white/60">
          <Bell className="w-4 h-4" />
        </button>

        {/* Share */}
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/50 hover:text-white/60">
          <Share2 className="w-4 h-4" />
        </button>

        {/* 24h trend badge */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ml-1 ${
            isUp
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isUp ? "Bullish" : "Bearish"}
        </div>
      </div>
    </motion.div>
  );
}