"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCircle2, TrendingUp, TrendingDown, Clock, Activity,
  ShieldCheck, Loader2, AlertCircle, Inbox, Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useSignalR } from "@/lib/signalr";
import type { Signal, Teacher, Subscription, Trade } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// % move from entry to a target, signed for profit/loss direction by action.
// BUY profits when price rises; SELL profits when price falls.
function pct(entry: number, target: number, action: string): string {
  if (!entry) return "";
  const raw = ((target - entry) / entry) * 100;
  const dir = action.toUpperCase() === "BUY" ? 1 : -1;
  const val = raw * dir;
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user, ready } = useRequireAuth();
  const router = useRouter();

  // Teachers belong in the teacher portal.
  useEffect(() => {
    if (ready && user && user.role === "Teacher") {
      router.replace("/teacher");
    }
  }, [ready, user, router]);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sig, tea, sub, trd] = await Promise.all([
          api.get<Signal[]>("/api/signals"),
          api.get<Teacher[]>("/api/users/teachers", { auth: false }),
          api.get<Subscription[]>(`/api/subscriptions/student/${user.id}`).catch(() => []),
          api.get<Trade[]>(`/api/trades/student/${user.id}`).catch(() => []),
        ]);
        if (cancelled) return;
        setSignals(sig);
        setTeachers(tea);
        setSubs(sub);
        setTrades(trd);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ready, user]);

  // ── Real-time signal feed (SignalR) ─────────────────────────────────────
  const sr = useSignalR();

  // Join groups for subscribed teachers so Pro signals reach this client
  useEffect(() => {
    if (!sr?.connected) return;
    const ids = subs.filter((s) => s.status === "Active").map((s) => s.teacherId);
    if (ids.length) sr.joinTeachers(ids);
  }, [sr, subs]);

  // Prepend new signals as they arrive (no duplicates)
  useEffect(() => {
    if (!sr) return;
    return sr.onSignal((incoming) => {
      setSignals((prev) => (prev.some((s) => s.id === incoming.id) ? prev : [incoming, ...prev]));
    });
  }, [sr]);

  // Teacher lookup
  const teacherById = useMemo(() => {
    const m = new Map<number, Teacher>();
    teachers.forEach((t) => m.set(t.id, t));
    return m;
  }, [teachers]);

  // Derived stats
  const activeSubs = useMemo(() => subs.filter((s) => s.status === "Active"), [subs]);
  const closedTrades = useMemo(() => trades.filter((t) => t.outcome !== "Open"), [trades]);
  const totalPnl = useMemo(
    () => closedTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0),
    [closedTrades]
  );
  const winRate = useMemo(() => {
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter((t) => t.outcome === "Win").length;
    return (wins / closedTrades.length) * 100;
  }, [closedTrades]);

  const followedTeachers = useMemo(
    () => activeSubs.map((s) => teacherById.get(s.teacherId)).filter(Boolean) as Teacher[],
    [activeSubs, teacherById]
  );

  async function handleCopySignal(signal: Signal) {
    const teacher = teacherById.get(signal.teacherId);
    const entryMid = (signal.entryLow + signal.entryHigh) / 2;
    const handle = "@" + (teacher?.name ?? `Teacher${signal.teacherId}`).replace(/\s+/g, "");

    const lines = [
      "SIGNAL ALERT  --  TradeMaster Pro",
      "----------------------------------------",
      `Pair:          ${signal.pair}`,
      `Action:        ${signal.action.toUpperCase()}`,
      `Entry Zone:    $${fmt(signal.entryLow)} - $${fmt(signal.entryHigh)}`,
      `Take Profit 1: $${fmt(signal.tp1)}  (${pct(entryMid, signal.tp1, signal.action)})`,
    ];
    if (signal.tp2) {
      lines.push(`Take Profit 2: $${fmt(signal.tp2)}  (${pct(entryMid, signal.tp2, signal.action)})`);
    }
    lines.push(`Stop Loss:     $${fmt(signal.sl)}  (${pct(entryMid, signal.sl, signal.action)})`);
    lines.push(`Leverage:      ${signal.leverage}`);
    lines.push(`Risk Level:    ${signal.riskLevel}`);
    lines.push(`Teacher:       ${handle}`);
    lines.push("----------------------------------------");
    lines.push("* Not financial advice. Trade at your own risk.");

    const copyText = lines.join("\n");
    navigator.clipboard.writeText(copyText);
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Log an open position once per signal so it shows in History / Portfolio.
    if (trackedIds.has(signal.id)) return;
    try {
      const entryPrice = (signal.entryLow + signal.entryHigh) / 2;
      const trade = await api.post<Trade>("/api/trades", { signalId: signal.id, entryPrice });
      setTrades((prev) => [...prev, trade]);
      setTrackedIds((prev) => new Set(prev).add(signal.id));
    } catch {
      // Clipboard copy already succeeded; trade logging is best-effort.
    }
  }

  // Auth guard still resolving
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="text-primary">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here is your live trading overview.</p>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Total Net P&L
            </div>
            <div className={`text-3xl font-black font-mono ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">From {closedTrades.length} closed trade{closedTrades.length !== 1 ? "s" : ""}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Activity className="w-5 h-5 text-green-500" /> Win Rate
            </div>
            <div className="text-3xl font-black font-mono text-white">{winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-2">Across your copied trades</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl border border-white/10 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-primary font-bold">
                <ShieldCheck className="w-5 h-5" /> Active Plan
              </div>
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">{user?.tier ?? "Free"} Tier</span>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Following: <span className="text-white font-bold">{activeSubs.length} Teacher{activeSubs.length !== 1 ? "s" : ""}</span>
            </div>
          </motion.div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Signal Feed */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" /> Live Signal Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground font-medium">{signals.length} signal{signals.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/[0.02]">
                <Inbox className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">No active signals</h3>
                <p className="text-sm text-muted-foreground mb-4">Follow more teachers to see their signals here.</p>
                <Link href="/discover" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-sm font-bold transition-colors">
                  <Users className="w-4 h-4" /> Discover Teachers
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {signals.map((signal, idx) => {
                    const teacher = teacherById.get(signal.teacherId);
                    const isBuy = signal.action.toUpperCase() === "BUY";
                    const isActive = signal.status === "Active";
                    return (
                      <motion.div
                        key={signal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative p-6 rounded-2xl border transition-all ${
                          isActive ? "bg-white/[0.02] border-white/10 hover:border-white/20" : "bg-black/40 border-white/5 opacity-70"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm">
                              {(teacher?.name ?? "T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                {teacher?.name ?? `Teacher #${signal.teacherId}`}
                                {teacher?.tier === "Pro" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {timeAgo(signal.createdAt)}
                              </div>
                            </div>
                          </div>

                          <div className={`px-3 py-1 rounded font-bold text-xs tracking-wider flex items-center gap-1 ${
                            isBuy ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {signal.action.toUpperCase()} {signal.pair}
                          </div>
                        </div>

                        {/* Data */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Entry Zone</div>
                            <div className="font-mono font-bold text-white text-base">{fmt(signal.entryLow)}–{fmt(signal.entryHigh)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Take Profit</div>
                            <div className="font-mono font-bold text-green-400 text-base">{fmt(signal.tp1)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</div>
                            <div className="font-mono font-bold text-red-400 text-base">{fmt(signal.sl)}</div>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                          <span>Leverage: <span className="text-white font-semibold">{signal.leverage}</span></span>
                          <span>Risk: <span className="text-white font-semibold">{signal.riskLevel}</span></span>
                        </div>

                        {/* One-Click Copy */}
                        {isActive && (
                          <button
                            onClick={() => handleCopySignal(signal)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                              copiedId === signal.id
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-primary hover:bg-blue-600 text-white"
                            }`}
                          >
                            {copiedId === signal.id ? (
                              <><CheckCircle2 className="w-4 h-4" /> Copied &amp; Tracked!</>
                            ) : trackedIds.has(signal.id) ? (
                              <><CheckCircle2 className="w-4 h-4" /> Copy Again (Tracked)</>
                            ) : (
                              <><Copy className="w-4 h-4" /> One-Click Copy</>
                            )}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Followed Teachers</h3>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />)}
                </div>
              ) : followedTeachers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">You are not following anyone yet.</p>
                  <Link href="/discover" className="text-xs font-bold text-primary hover:underline">Browse teachers →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {followedTeachers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white/70">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-sm text-white/90 flex items-center gap-1">
                            {t.name}
                            {t.tier === "Pro" && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                          </span>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>
                  ))}
                </div>
              )}
              <Link href="/discover">
                <button className="w-full mt-6 py-2 border border-white/10 rounded-lg text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Discover More Teachers
                </button>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
