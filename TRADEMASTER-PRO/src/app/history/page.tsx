"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat2,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxStatus = "Completed" | "Pending" | "Failed";
type TxTab = "Trades" | "Deposits" | "Withdrawals";

interface Transaction {
  id: string;
  date: string;
  pair: string;
  type: string;
  price: string;
  amount: string;
  total: string;
  status: TxStatus;
  tab: TxTab;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_HISTORY: Transaction[] = [
  { id: "TX-9921", date: "2026-06-16 10:45", pair: "BTC/USD", type: "Market Buy",  price: "64,230.50", amount: "0.1500 BTC",  total: "9,634.57 USDT",  status: "Completed", tab: "Trades"      },
  { id: "TX-9920", date: "2026-06-15 18:12", pair: "ETH/USD", type: "Limit Sell",  price: "3,500.00",  amount: "2.0000 ETH",  total: "7,000.00 USDT",  status: "Completed", tab: "Trades"      },
  { id: "TX-9919", date: "2026-06-14 09:30", pair: "SOL/USD", type: "Market Buy",  price: "142.10",    amount: "10.000 SOL",  total: "1,421.00 USDT",  status: "Completed", tab: "Trades"      },
  { id: "TX-9918", date: "2026-06-13 14:05", pair: "BNB/USD", type: "Limit Buy",   price: "578.20",    amount: "5.0000 BNB",  total: "2,891.00 USDT",  status: "Pending",   tab: "Trades"      },
  { id: "TX-9917", date: "2026-06-12 22:18", pair: "XRP/USD", type: "Market Sell", price: "0.6240",    amount: "5000 XRP",    total: "3,120.00 USDT",  status: "Failed",    tab: "Trades"      },
  { id: "DEP-441", date: "2026-06-11 08:00", pair: "USDT",    type: "Bank Wire",   price: "—",         amount: "20,000 USDT", total: "20,000.00 USDT", status: "Completed", tab: "Deposits"    },
  { id: "DEP-440", date: "2026-06-09 11:33", pair: "BTC",     type: "On-chain",    price: "—",         amount: "0.5000 BTC",  total: "31,800.00 USDT", status: "Completed", tab: "Deposits"    },
  { id: "WD-221",  date: "2026-06-10 16:45", pair: "USDT",    type: "Bank Wire",   price: "—",         amount: "5,000 USDT",  total: "5,000.00 USDT",  status: "Completed", tab: "Withdrawals" },
  { id: "WD-220",  date: "2026-06-08 13:20", pair: "ETH",     type: "On-chain",    price: "—",         amount: "1.2000 ETH",  total: "4,140.00 USDT",  status: "Pending",   tab: "Withdrawals" },
];

const TABS: TxTab[] = ["Trades", "Deposits", "Withdrawals"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TxStatus, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  Completed: { icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
  Pending:   { icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  Failed:    { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
};

const TAB_ICONS: Record<TxTab, typeof Repeat2> = {
  Trades:      Repeat2,
  Deposits:    ArrowDownLeft,
  Withdrawals: ArrowUpRight,
};

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
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 },
  }),
};

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const isBuy = type.toLowerCase().includes("buy") || type.toLowerCase().includes("deposit") || type.toLowerCase().includes("wire") || type.toLowerCase().includes("chain");
  const isSell = type.toLowerCase().includes("sell") || type.toLowerCase().includes("withdrawal");
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
        isBuy
          ? "bg-green-500/8 text-green-400 border-green-500/15"
          : isSell
          ? "bg-red-500/8 text-red-400 border-red-500/15"
          : "bg-white/5 text-white/60 border-white/10"
      }`}
    >
      {type}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TxTab>("Trades");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return MOCK_HISTORY.filter(
      (tx) =>
        tx.tab === activeTab &&
        (query === "" ||
          tx.id.toLowerCase().includes(query.toLowerCase()) ||
          tx.pair.toLowerCase().includes(query.toLowerCase()) ||
          tx.type.toLowerCase().includes(query.toLowerCase()))
    );
  }, [activeTab, query]);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t, MOCK_HISTORY.filter((tx) => tx.tab === t).length])),
    []
  );

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />

      <div className="pt-[72px]">
        <TickerTape />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
              Account
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trade History
            </h1>
            <p className="text-muted-foreground/50 text-sm mt-1">
              Past transactions and execution logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, pair…"
                className="w-48 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-muted-foreground/30 outline-none border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
              />
            </div>

            {/* Filter stub */}
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white border border-white/10 bg-white/5 hover:bg-white/8 rounded-xl transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
            </button>

            {/* Export */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white border border-white/10 bg-white/5 hover:bg-white/8 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </motion.button>
          </div>
        </motion.div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0.05}
          className="flex items-center gap-1 mb-4 border-b border-white/5 pb-0"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-colors focus-visible:outline-none"
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                <span className={active ? "text-white" : "text-muted-foreground hover:text-white/70"}>
                  {tab}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                    active
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/5 text-muted-foreground/40"
                  }`}
                >
                  {counts[tab]}
                </span>
                {active && (
                  <motion.div
                    layoutId="history-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants} initial="hidden" animate="visible" custom={0.1}
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
                  {["Date", "Tx ID", "Pair", "Type", "Price", "Amount", "Total", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="wait">
                  {filtered.map((tx, i) => {
                    const S = STATUS_CONFIG[tx.status];
                    const StatusIcon = S.icon;
                    return (
                      <motion.tr
                        key={tx.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        custom={i}
                        className="group hover:bg-white/[0.025] transition-colors"
                      >
                        {/* Date */}
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground/50 whitespace-nowrap">
                          {tx.date}
                        </td>

                        {/* Tx ID */}
                        <td className="px-5 py-4 font-mono text-xs text-primary/80 whitespace-nowrap">
                          {tx.id}
                        </td>

                        {/* Pair */}
                        <td className="px-5 py-4 font-bold text-white text-sm whitespace-nowrap">
                          {tx.pair}
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypeBadge type={tx.type} />
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 font-mono text-sm text-white/80 tabular-nums whitespace-nowrap">
                          {tx.price !== "—" ? `$${tx.price}` : <span className="text-muted-foreground/30">—</span>}
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 font-mono text-sm text-white/80 tabular-nums whitespace-nowrap">
                          {tx.amount}
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4 font-mono text-sm font-semibold text-white tabular-nums whitespace-nowrap">
                          {tx.total}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${S.color} ${S.bg} ${S.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>

                        {/* Link */}
                        <td className="px-5 py-4 text-right">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-white">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-sm text-muted-foreground/30">
                      No {activeTab.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filtered.length > 0 && (
            <div
              className="flex items-center justify-between px-5 py-3 border-t border-white/5 text-xs text-muted-foreground/30"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <span>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
              <span>Updated just now</span>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}