"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Layers, RefreshCw, Loader2,
  AlertCircle, Inbox, Trophy, Check, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import type { Trade, Signal } from "@/lib/types";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PortfolioPage() {
  const { user, ready } = useRequireAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Closing an open position
  const [closingId, setClosingId] = useState<number | null>(null);
  const [exitInput, setExitInput] = useState("");
  const [closingBusy, setClosingBusy] = useState(false);

  async function handleClosePosition(tradeId: number) {
    const exit = parseFloat(exitInput);
    if (Number.isNaN(exit) || exit <= 0) { setError("Enter a valid exit price."); return; }
    setClosingBusy(true);
    setError(null);
    try {
      const updated = await api.put<Trade>(`/api/trades/${tradeId}/close?exitPrice=${exit}`);
      setTrades((prev) => prev.map((t) => (t.id === tradeId ? updated : t)));
      setClosingId(null);
      setExitInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close position.");
    } finally {
      setClosingBusy(false);
    }
  }

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [trd, sig] = await Promise.all([
        api.get<Trade[]>(`/api/trades/student/${user.id}`).catch(() => []),
        api.get<Signal[]>("/api/signals").catch(() => []),
      ]);
      setTrades(trd);
      setSignals(sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio.");
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

  const openPositions = useMemo(() => trades.filter((t) => t.outcome === "Open"), [trades]);
  const closedTrades = useMemo(() => trades.filter((t) => t.outcome !== "Open"), [trades]);
  const totalPnl = useMemo(() => closedTrades.reduce((a, t) => a + (t.pnl ?? 0), 0), [closedTrades]);
  const wins = useMemo(() => closedTrades.filter((t) => t.outcome === "Win").length, [closedTrades]);
  const winRate = closedTrades.length ? (wins / closedTrades.length) * 100 : 0;

  // Cumulative realized P&L over closed trades (ordered by close time)
  const pnlSeries = useMemo(() => {
    const sorted = [...closedTrades].sort(
      (a, b) => new Date(a.closedAt ?? 0).getTime() - new Date(b.closedAt ?? 0).getTime()
    );
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.pnl ?? 0;
      return {
        label: t.closedAt ? new Date(t.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `#${i + 1}`,
        value: Number(cum.toFixed(2)),
      };
    });
  }, [closedTrades]);

  const isUp = totalPnl >= 0;

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
        {/* Title */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Overview</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">My Portfolio</h1>
          </div>
          <button onClick={loadData} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Realized P&L + chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <GlassPanel className="p-6 sm:p-8 flex flex-col h-full">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                <Activity className="w-3.5 h-3.5" /> Realized P&amp;L
              </p>
              <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums font-mono ${isUp ? "text-white" : "text-red-400"}`}>
                {isUp ? "+" : "-"}${fmt(Math.abs(totalPnl))}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${isUp ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {winRate.toFixed(1)}% win rate
                </span>
                <span className="text-xs text-muted-foreground/50">{closedTrades.length} closed trades</span>
              </div>

              <div className="flex-1 min-h-[220px] mt-6">
                {loading ? (
                  <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
                ) : pnlSeries.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <Inbox className="w-10 h-10 text-white/15 mb-3" />
                    <p className="text-sm text-muted-foreground">No closed trades yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Your realized P&amp;L curve appears here once trades close.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pnlSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<PnlTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                      <Area type="monotone" dataKey="value" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#pnlGrad)" dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Right column */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
            <GlassPanel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">Snapshot</p>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Realized P&L" value={`${isUp ? "+" : "-"}$${fmt(Math.abs(totalPnl))}`} cls={isUp ? "text-green-400" : "text-red-400"} />
                <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} />
                <Stat label="Open" value={`${openPositions.length}`} />
                <Stat label="Total Trades" value={`${trades.length}`} />
              </div>
            </GlassPanel>

            <GlassPanel className="p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Open Positions
                </p>
                <span className="text-[10px] text-muted-foreground/40">{openPositions.length}</span>
              </div>
              {loading ? (
                <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />)}</div>
              ) : openPositions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No open positions.</p>
                  <Link href="/dashboard" className="text-xs font-bold text-primary hover:underline">Go to signal feed →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {openPositions.map((t) => (
                    <div key={t.id} className="rounded-xl border border-transparent hover:border-white/8 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white/70">
                            {(pairBySignal.get(t.signalId) ?? "S")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{pairBySignal.get(t.signalId) ?? `Signal #${t.signalId}`}</p>
                            <p className="text-[11px] text-muted-foreground/50">Trade #{t.id} · Entry ${fmt(t.entryPrice)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setClosingId(closingId === t.id ? null : t.id); setExitInput(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {closingId === t.id ? "Cancel" : "Close"}
                        </button>
                      </div>

                      {closingId === t.id && (
                        <div className="flex items-center gap-2 px-3 pb-3">
                          <input
                            type="number"
                            value={exitInput}
                            onChange={(e) => setExitInput(e.target.value)}
                            placeholder="Exit price"
                            autoFocus
                            className="flex-1 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                          />
                          <button
                            onClick={() => handleClosePosition(t.id)}
                            disabled={closingBusy}
                            className="p-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                            title="Confirm close"
                          >
                            {closingBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setClosingId(null); setExitInput(""); }}
                            className="p-2 rounded-lg border border-white/10 text-muted-foreground hover:text-white transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>

            {winRate >= 60 && closedTrades.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-200/80">Great work — your copied win rate is above 60%.</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 ${className}`} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }}>
      {children}
    </div>
  );
}

function Stat({ label, value, cls = "text-white/80" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{label}</span>
      <span className={`text-sm font-bold font-mono tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function PnlTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value ?? 0;
  return (
    <div className="px-3 py-2 rounded-xl border border-white/10 text-xs" style={{ background: "rgba(8,8,16,0.95)" }}>
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className={`font-bold font-mono ${v >= 0 ? "text-green-400" : "text-red-400"}`}>
        {v >= 0 ? "+" : ""}${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
