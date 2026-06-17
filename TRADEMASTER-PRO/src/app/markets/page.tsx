"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Star,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Market {
  pair: string;
  name: string;
  price: string;
  change: string;
  vol: string;
  cap: string;
  dotColor: string;
  sparkDir: "up" | "down";
}

type SortKey = "pair" | "price" | "change" | "vol" | "cap";
type SortDir = "asc" | "desc";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MARKETS: Market[] = [
  { pair: "BTC",  name: "Bitcoin",   price: "64,230.50", change: "+2.45%", vol: "32.4B", cap: "1.2T",  dotColor: "#fb923c", sparkDir: "up"   },
  { pair: "ETH",  name: "Ethereum",  price: "3,450.12",  change: "+1.82%", vol: "15.2B", cap: "415B",  dotColor: "#60a5fa", sparkDir: "up"   },
  { pair: "SOL",  name: "Solana",    price: "145.20",    change: "-0.54%", vol: "3.1B",  cap: "65B",   dotColor: "#c084fc", sparkDir: "down" },
  { pair: "BNB",  name: "BNB",       price: "580.40",    change: "+0.91%", vol: "1.8B",  cap: "89B",   dotColor: "#facc15", sparkDir: "up"   },
  { pair: "XRP",  name: "Ripple",    price: "0.6248",    change: "+4.20%", vol: "2.1B",  cap: "34B",   dotColor: "#38bdf8", sparkDir: "up"   },
  { pair: "DOGE", name: "Dogecoin",  price: "0.1538",    change: "-2.10%", vol: "1.2B",  cap: "21B",   dotColor: "#fbbf24", sparkDir: "down" },
  { pair: "ADA",  name: "Cardano",   price: "0.4512",    change: "+0.20%", vol: "450M",  cap: "16B",   dotColor: "#34d399", sparkDir: "up"   },
  { pair: "AVAX", name: "Avalanche", price: "38.74",     change: "-1.88%", vol: "820M",  cap: "15.8B", dotColor: "#f87171", sparkDir: "down" },
];

const FILTERS = ["All", "Gainers", "Losers", "Watchlist"] as const;
type Filter = typeof FILTERS[number];

// ─── Animation Variants ───────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: d },
  }),
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 },
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(val: string): number {
  const clean = val.replace(/[$,]/g, "");
  const mult = clean.endsWith("T") ? 1e12 : clean.endsWith("B") ? 1e9 : clean.endsWith("M") ? 1e6 : 1;
  return parseFloat(clean) * mult;
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ dir }: { dir: "up" | "down" }) {
  const color = dir === "up" ? "#4ade80" : "#f87171";
  const path =
    dir === "up"
      ? "M0,20 C10,18 20,14 30,10 C40,6 50,8 60,4"
      : "M0,4 C10,6 20,8 30,12 C40,16 50,14 60,18";
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" className="opacity-80">
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

function SortTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <th
      className={`px-5 py-4 whitespace-nowrap cursor-pointer select-none group ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
        {label}
        <span className={`transition-colors ${active ? "text-primary" : "opacity-0 group-hover:opacity-50"}`}>
          {active ? (dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
        </span>
      </span>
    </th>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("cap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(["BTC", "ETH"]));

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleWatch(pair: string) {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.has(pair) ? next.delete(pair) : next.add(pair);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let list = [...MOCK_MARKETS];
    if (query) list = list.filter((m) => m.pair.toLowerCase().includes(query.toLowerCase()) || m.name.toLowerCase().includes(query.toLowerCase()));
    if (filter === "Gainers") list = list.filter((m) => m.change.startsWith("+"));
    if (filter === "Losers")  list = list.filter((m) => m.change.startsWith("-"));
    if (filter === "Watchlist") list = list.filter((m) => watchlist.has(m.pair));
    list.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "pair") return sortDir === "asc" ? a.pair.localeCompare(b.pair) : b.pair.localeCompare(a.pair);
      if (sortKey === "change") { av = parseFloat(a.change); bv = parseFloat(b.change); }
      else { av = parseNum(a[sortKey] as string); bv = parseNum(b[sortKey] as string); }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [query, filter, sortKey, sortDir, watchlist]);

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="pt-[72px]">
        <TickerTape />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <motion.div
            variants={cardVariants} initial="hidden" animate="visible" custom={0}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
              Live Data
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Global{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
              >
                Markets
              </span>
            </h1>
            <p className="text-muted-foreground/60 text-sm mt-2">
              Real-time prices and market data for top crypto assets.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            variants={cardVariants} initial="hidden" animate="visible" custom={0.05}
            className="relative w-full md:w-72"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset…"
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/30 outline-none border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
              }}
            />
          </motion.div>
        </div>

        {/* ── Filter Tabs ───────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0.08}
          className="flex items-center gap-1 mb-4"
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active ? "text-white" : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="market-filter-pill"
                    className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {f === "Watchlist" && <Star className="w-3 h-3" />}
                  {f === "Gainers"   && <TrendingUp className="w-3 h-3 text-green-400" />}
                  {f === "Losers"    && <TrendingDown className="w-3 h-3 text-red-400" />}
                  {f}
                  {f === "Watchlist" && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                      {watchlist.size}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0.12}
          className="w-full overflow-hidden rounded-2xl border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b border-white/5"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >
                  <th className="px-5 py-4 w-8" />
                  <SortTh label="#"         sortKey="pair"   current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Price"     sortKey="price"  current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="24h"       sortKey="change" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      7D Trend
                    </span>
                  </th>
                  <SortTh label="Volume"    sortKey="vol"    current={sortKey} dir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                  <SortTh label="Mkt Cap"   sortKey="cap"    current={sortKey} dir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <th className="px-5 py-4 text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Action
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {filtered.map((market, i) => {
                    const up = market.change.startsWith("+");
                    const isWatched = watchlist.has(market.pair);
                    return (
                      <motion.tr
                        key={market.pair}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: 8 }}
                        custom={i}
                        className="group hover:bg-white/[0.025] transition-colors cursor-default"
                      >
                        {/* Star */}
                        <td className="px-5 py-4 w-8">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggleWatch(market.pair)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star
                              className={`w-3.5 h-3.5 transition-colors ${
                                isWatched
                                  ? "fill-yellow-400 text-yellow-400 !opacity-100"
                                  : "text-muted-foreground/40 hover:text-yellow-400"
                              }`}
                            />
                          </motion.button>
                        </td>

                        {/* Asset */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shrink-0"
                              style={{
                                background: `radial-gradient(circle at 35% 35%, ${market.dotColor}25, rgba(0,0,0,0.5))`,
                                color: market.dotColor,
                              }}
                            >
                              {market.pair[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{market.pair}</p>
                              <p className="text-[11px] text-muted-foreground/50">{market.name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-white tabular-nums">
                          ${market.price}
                        </td>

                        {/* Change */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
                              up
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {market.change}
                          </span>
                        </td>

                        {/* Sparkline */}
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <Sparkline dir={market.sparkDir} />
                        </td>

                        {/* Volume */}
                        <td className="px-5 py-4 font-mono text-sm text-muted-foreground/60 tabular-nums hidden md:table-cell">
                          ${market.vol}
                        </td>

                        {/* Market Cap */}
                        <td className="px-5 py-4 font-mono text-sm text-muted-foreground/60 tabular-nums hidden lg:table-cell">
                          ${market.cap}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <Link href={`/trade/${market.pair}-USD`}>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all"
                            >
                              <Zap className="w-3 h-3" />
                              Trade
                            </motion.button>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground/40">
                      No assets match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer count */}
        <p className="text-[11px] text-muted-foreground/30 mt-3 px-1">
          Showing {filtered.length} of {MOCK_MARKETS.length} assets
        </p>
      </main>
    </div>
  );
}