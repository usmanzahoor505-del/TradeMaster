"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Repeat2, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle,
  Loader2, AlertCircle, Inbox,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import type { Trade, Transaction, Signal } from "@/lib/types";

type Tab = "Trades" | "Deposits" | "Withdrawals";
const TABS: Tab[] = ["Trades", "Deposits", "Withdrawals"];

const TAB_ICONS: Record<Tab, typeof Repeat2> = {
  Trades: Repeat2,
  Deposits: ArrowDownLeft,
  Withdrawals: ArrowUpRight,
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateStr(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  Completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  Win: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  Pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  Open: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  Failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  Loss: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const S = STATUS_CONFIG[status] ?? { icon: Clock, color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
  const Icon = S.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${S.color} ${S.bg} ${S.border}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function HistoryPage() {
  const { user, ready } = useRequireAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("Trades");
  const [query, setQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [trd, tx, sig] = await Promise.all([
        api.get<Trade[]>(`/api/trades/student/${user.id}`).catch(() => []),
        api.get<Transaction[]>(`/api/transactions/user/${user.id}`).catch(() => []),
        api.get<Signal[]>("/api/signals").catch(() => []),
      ]);
      setTrades(trd);
      setTxns(tx);
      setSignals(sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) loadData();
  }, [ready, user, loadData]);

  const pairBySignal = useMemo(() => {
    const m = new Map<number, string>();
    signals.forEach((s) => m.set(s.id, s.pair));
    return m;
  }, [signals]);

  const deposits = useMemo(() => txns.filter((t) => t.type === "credit"), [txns]);
  const withdrawals = useMemo(() => txns.filter((t) => t.type === "debit"), [txns]);

  const counts: Record<Tab, number> = {
    Trades: trades.length,
    Deposits: deposits.length,
    Withdrawals: withdrawals.length,
  };

  const tradeRows = useMemo(() => {
    return trades.filter((t) => {
      if (!query) return true;
      const pair = pairBySignal.get(t.signalId) ?? "";
      return pair.toLowerCase().includes(query.toLowerCase()) || String(t.id).includes(query);
    });
  }, [trades, query, pairBySignal]);

  const txRows = useMemo(() => {
    const list = activeTab === "Deposits" ? deposits : withdrawals;
    return list.filter((t) => !query || t.gateway.toLowerCase().includes(query.toLowerCase()) || String(t.id).includes(query));
  }, [activeTab, deposits, withdrawals, query]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />
      <div className="pt-[72px]"><TickerTape /></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Account</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Trade History</h1>
            <p className="text-muted-foreground/50 text-sm mt-1">Your copied trades and account transactions.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
              className="w-48 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-muted-foreground/30 outline-none border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-white/5">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            const Icon = TAB_ICONS[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="relative flex items-center gap-1.5 px-3 pb-3 text-sm font-medium transition-colors">
                <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                <span className={active ? "text-white" : "text-muted-foreground hover:text-white/70"}>{tab}</span>
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  active ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground/40"
                }`}>{counts[tab]}</span>
                {active && <motion.div layoutId="history-tab-underline" className="absolute bottom-0 left-0 right-0 h-px bg-primary" />}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}>
          {loading ? (
            <div className="p-6 flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : activeTab === "Trades" ? (
            tradeRows.length === 0 ? (
              <EmptyRow label="trades" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
                      {["Date", "Trade", "Pair", "Entry", "Exit", "P&L", "Outcome"].map((h) => (
                        <th key={h} className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tradeRows.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.025] transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground/50 whitespace-nowrap">{dateStr(t.closedAt)}</td>
                        <td className="px-5 py-4 font-mono text-xs text-primary/80">#{t.id}</td>
                        <td className="px-5 py-4 font-bold text-white whitespace-nowrap">{pairBySignal.get(t.signalId) ?? `Signal #${t.signalId}`}</td>
                        <td className="px-5 py-4 font-mono text-white/80 tabular-nums">${fmt(t.entryPrice)}</td>
                        <td className="px-5 py-4 font-mono text-white/80 tabular-nums">{t.exitPrice != null ? `$${fmt(t.exitPrice)}` : <span className="text-muted-foreground/30">—</span>}</td>
                        <td className={`px-5 py-4 font-mono font-semibold tabular-nums ${(t.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}$${fmt(t.pnl)}` : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={t.outcome} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : txRows.length === 0 ? (
            <EmptyRow label={activeTab.toLowerCase()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
                    {["Date", "Tx ID", "Amount", "Gateway", "Status"].map((h) => (
                      <th key={h} className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {txRows.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground/50 whitespace-nowrap">{dateStr(t.createdAt)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-primary/80">#{t.id}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-white tabular-nums">${fmt(t.amount)} <span className="text-muted-foreground/40 text-xs">{t.currency}</span></td>
                      <td className="px-5 py-4 text-white/70">{t.gateway || "—"}</td>
                      <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="py-16 text-center">
      <Inbox className="w-10 h-10 text-white/15 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">No {label} yet.</p>
    </div>
  );
}
