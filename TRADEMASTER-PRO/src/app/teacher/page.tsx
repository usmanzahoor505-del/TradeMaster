"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps,
} from "recharts";
import {
  Users, Activity, Wallet, Plus, X, Loader2, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Clock, Lock, Send, Award, BarChart3,
  ShieldCheck, Crown, Trophy, Zap, Target,
  Heart, MessageSquare, Share2, FileText, ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import type { Signal, Transaction, Post } from "@/lib/types";

const POST_TYPES = [
  { value: "General", label: "General" },
  { value: "MarketAnalysis", label: "Market Analysis" },
  { value: "TradingInsight", label: "Trading Insight" },
  { value: "Educational", label: "Educational" },
];

interface TeacherStats {
  subscribers: number;
  winRate: number;
  earnings: number;
  wins: number;
  losses: number;
  closedTrades: number;
  totalSignals: number;
}

type Action = "BUY" | "SELL";
type Risk = "LOW" | "MEDIUM" | "HIGH";

interface SignalForm {
  pair: string;
  action: Action;
  entryLow: string;
  entryHigh: string;
  tp1: string;
  tp2: string;
  sl: string;
  leverage: string;
  riskLevel: Risk;
}

const EMPTY_FORM: SignalForm = {
  pair: "", action: "BUY", entryLow: "", entryHigh: "",
  tp1: "", tp2: "", sl: "", leverage: "5x", riskLevel: "LOW",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function TeacherDashboard() {
  const { user, ready } = useRequireAuth();
  const router = useRouter();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New-signal form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SignalForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  // Community posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("General");
  const [postImage, setPostImage] = useState("");
  const [postImageMode, setPostImageMode] = useState<"upload" | "url">("upload");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPostError("Please choose an image file."); return; }
    if (file.size > 3 * 1024 * 1024) { setPostError("Image must be under 3MB."); return; }
    setPostError(null);
    const reader = new FileReader();
    reader.onload = () => setPostImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Students shouldn't be here
  useEffect(() => {
    if (ready && user && user.role === "Student") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [sig, st, tx, pst] = await Promise.all([
        api.get<Signal[]>(`/api/signals/teacher/${user.id}`),
        api.get<TeacherStats>(`/api/users/teacher/${user.id}/stats`).catch(() => null),
        api.get<Transaction[]>(`/api/transactions/user/${user.id}`).catch(() => []),
        api.get<{ items: Post[] }>(`/api/posts/teacher/${user.id}?pageSize=20`).catch(() => ({ items: [] as Post[] })),
      ]);
      setSignals(sig);
      setStats(st);
      setTransactions(tx);
      setPosts(pst.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teacher data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user && user.role !== "Student") loadData();
  }, [ready, user, loadData]);

  // ── Derived analytics ──────────────────────────────────────────────────────

  const sig = useMemo(() => {
    const total = signals.length;
    const active = signals.filter((s) => s.status === "Active").length;
    // Win rate / wins / losses come from students' trade outcomes (backend).
    const wins = stats?.wins ?? 0;
    const losses = stats?.losses ?? 0;
    const closedTrades = stats?.closedTrades ?? wins + losses;
    const winRate = stats?.winRate ?? 0;
    return { total, active, wins, losses, closedTrades, winRate };
  }, [signals, stats]);

  // Cumulative commission earnings over time (the teacher's "P&L")
  const earningsSeries = useMemo(() => {
    const credits = transactions
      .filter((t) => t.type === "credit" && t.status === "Completed")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let cum = 0;
    return credits.map((t) => {
      cum += t.amount;
      return {
        date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Number(cum.toFixed(2)),
      };
    });
  }, [transactions]);

  const totalEarnings = stats?.earnings ?? earningsSeries.at(-1)?.value ?? 0;

  // Performance badge per PRD tier rules
  const badge = useMemo(() => {
    const wr = sig.winRate;
    if (sig.closedTrades === 0) return { label: "Building Track Record", icon: Target, cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    if (wr >= 75) return { label: "Top Performer", icon: Trophy, cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    if (wr >= 70) return { label: "Fast-Track Ready", icon: Zap, cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
    if (wr >= 60) return { label: "Pro Eligible", icon: TrendingUp, cls: "bg-green-500/10 text-green-400 border-green-500/20" };
    return { label: "Rising Trader", icon: Activity, cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
  }, [sig]);

  const isPro = user?.tier === "Pro";

  // ── Form handlers ──────────────────────────────────────────────────────────

  function update<K extends keyof SignalForm>(key: K, value: SignalForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePublish() {
    setFormError(null);
    const nums = {
      entryLow: parseFloat(form.entryLow),
      entryHigh: parseFloat(form.entryHigh),
      tp1: parseFloat(form.tp1),
      sl: parseFloat(form.sl),
    };
    if (!form.pair.trim()) return setFormError("Pair is required (e.g. BTC/USDT).");
    if (!form.leverage.trim()) return setFormError("Leverage is required (e.g. 5x).");
    if (Object.values(nums).some((n) => Number.isNaN(n))) {
      return setFormError("Entry Low/High, TP1 and Stop Loss must be valid numbers.");
    }
    if (nums.entryLow > nums.entryHigh) {
      return setFormError("Entry Low cannot be greater than Entry High.");
    }

    setSubmitting(true);
    try {
      const body = {
        pair: form.pair.trim(),
        action: form.action,
        entryLow: nums.entryLow,
        entryHigh: nums.entryHigh,
        tp1: nums.tp1,
        tp2: form.tp2.trim() ? parseFloat(form.tp2) : null,
        sl: nums.sl,
        leverage: form.leverage.trim(),
        riskLevel: form.riskLevel,
      };
      const created = await api.post<Signal>("/api/signals", body);
      setSignals((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to publish signal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(id: number) {
    try {
      const updated = await api.put<Signal>(`/api/signals/${id}/close`);
      setSignals((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close signal.");
    }
  }

  async function handlePublishPost() {
    setPostError(null);
    if (!postContent.trim()) { setPostError("Write something to share."); return; }
    setPostSubmitting(true);
    try {
      const created = await api.post<Post>("/api/posts", {
        content: postContent.trim(),
        postType,
        image: postImage.trim() || null,
      });
      setPosts((prev) => [created, ...prev]);
      setPostContent("");
      setPostImage("");
      setPostType("General");
      setShowPostForm(false);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setPostSubmitting(false);
    }
  }

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

        {/* Header + badges */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
              Teacher Portal
            </p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Welcome, <span className="text-primary">{user?.name?.split(" ")[0]}</span>
            </h1>
            {/* Performance badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isPro ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-zinc-500/10 text-zinc-300 border-white/10"
              }`}>
                {isPro ? <Crown className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {isPro ? "Pro Teacher" : "Free Teacher"}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.cls}`}>
                <badge.icon className="w-3.5 h-3.5" />
                {badge.label}
              </span>
            </div>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold transition-colors self-start"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Signal"}
          </button>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {justPublished && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Signal published! Subscribers have been notified.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} iconCls="text-primary" label="Subscribers" value={`${stats?.subscribers ?? 0}`} sub="Active followers" />
          <StatCard icon={Activity} iconCls="text-green-500" label="Win Rate" value={`${sig.winRate.toFixed(1)}%`} sub={`${sig.wins}W / ${sig.losses}L`} />
          <StatCard icon={Wallet} iconCls="text-amber-400" label="Earnings" value={`$${fmt(totalEarnings)}`} sub="Commission to date" />
          <StatCard icon={Send} iconCls="text-blue-400" label="Signals" value={`${sig.total}`} sub={`${sig.active} active`} />
        </div>

        {/* P&L chart + Follower analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* Live P&L / Earnings tracking */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Earnings &amp; P&amp;L Tracking
              </h3>
              <span className="text-xs text-muted-foreground">Cumulative commission</span>
            </div>
            <div className="h-[240px]">
              {loading ? (
                <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
              ) : earningsSeries.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <Wallet className="w-10 h-10 text-white/15 mb-3" />
                  <p className="text-sm text-muted-foreground">No commission earnings yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Earnings appear here once subscribers pay for your Pro signals.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="teacherEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip content={<EarnTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#teacherEarn)" dot={false} activeDot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Follower & performance analytics */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold flex items-center gap-2 mb-5">
              <Award className="w-4 h-4 text-primary" /> Performance Analytics
            </h3>

            {/* Win-rate bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-bold text-white">{sig.winRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, sig.winRate)}%`,
                    background: sig.winRate >= 60 ? "linear-gradient(90deg,#16a34a,#22c55e)" : "linear-gradient(90deg,#3b82f6,#6366f1)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                {sig.winRate >= 60 ? "Meets Pro tier threshold (60%+)" : "Reach 60%+ over 3 months to unlock Pro tier"}
              </p>
            </div>

            {/* Breakdown grid */}
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Subscribers" value={`${stats?.subscribers ?? 0}`} />
              <MiniStat label="Total Signals" value={`${sig.total}`} />
              <MiniStat label="Active" value={`${sig.active}`} valueCls="text-green-400" />
              <MiniStat label="Closed Trades" value={`${sig.closedTrades}`} />
              <MiniStat label="Wins" value={`${sig.wins}`} valueCls="text-green-400" />
              <MiniStat label="Losses" value={`${sig.losses}`} valueCls="text-red-400" />
            </div>
          </div>
        </div>

        {/* New Signal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass-panel p-6 rounded-2xl border border-primary/20">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Publish New Signal
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Pair">
                    <input value={form.pair} onChange={(e) => update("pair", e.target.value)} placeholder="BTC/USDT" className={inputCls} />
                  </Field>
                  <Field label="Action">
                    <div className="flex gap-2">
                      {(["BUY", "SELL"] as Action[]).map((a) => (
                        <button key={a} type="button" onClick={() => update("action", a)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                            form.action === a
                              ? a === "BUY" ? "bg-green-500/15 border-green-500/40 text-green-400" : "bg-red-500/15 border-red-500/40 text-red-400"
                              : "bg-black/30 border-white/10 text-muted-foreground hover:text-white"
                          }`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Leverage">
                    <input value={form.leverage} onChange={(e) => update("leverage", e.target.value)} placeholder="5x" className={inputCls} />
                  </Field>
                  <Field label="Entry Low">
                    <input type="number" value={form.entryLow} onChange={(e) => update("entryLow", e.target.value)} placeholder="64000" className={inputCls} />
                  </Field>
                  <Field label="Entry High">
                    <input type="number" value={form.entryHigh} onChange={(e) => update("entryHigh", e.target.value)} placeholder="64500" className={inputCls} />
                  </Field>
                  <Field label="Risk Level">
                    <select value={form.riskLevel} onChange={(e) => update("riskLevel", e.target.value as Risk)} className={inputCls}>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </Field>
                  <Field label="Take Profit 1">
                    <input type="number" value={form.tp1} onChange={(e) => update("tp1", e.target.value)} placeholder="68000" className={inputCls} />
                  </Field>
                  <Field label="Take Profit 2 (optional)">
                    <input type="number" value={form.tp2} onChange={(e) => update("tp2", e.target.value)} placeholder="71000" className={inputCls} />
                  </Field>
                  <Field label="Stop Loss">
                    <input type="number" value={form.sl} onChange={(e) => update("sl", e.target.value)} placeholder="63000" className={inputCls} />
                  </Field>
                </div>

                {formError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => { setShowForm(false); setFormError(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-white border border-white/10 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handlePublish} disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Send className="w-4 h-4" /> Publish Signal</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* My Signals (signal history) */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Signal History
          <span className="text-sm font-normal text-muted-foreground">({signals.length})</span>
        </h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />)}
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
            <Send className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No signals yet</h3>
            <p className="text-sm text-muted-foreground">Publish your first signal to start building your track record.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {signals.map((s) => {
              const isBuy = s.action.toUpperCase() === "BUY";
              const isActive = s.status === "Active";
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 ${isBuy ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {s.action.toUpperCase()} {s.pair}
                  </div>
                  <div className="flex items-center gap-5 text-xs font-mono">
                    <span className="text-muted-foreground">Entry <span className="text-white">{fmt(s.entryLow)}–{fmt(s.entryHigh)}</span></span>
                    <span className="text-muted-foreground">TP <span className="text-green-400">{fmt(s.tp1)}</span></span>
                    <span className="text-muted-foreground">SL <span className="text-red-400">{fmt(s.sl)}</span></span>
                    <span className="text-muted-foreground hidden sm:inline">Lev <span className="text-white">{s.leverage}</span></span>
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(s.createdAt)}
                    </span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                    }`}>
                      {s.status}
                    </span>
                    {isActive && (
                      <button onClick={() => handleClose(s.id)} title="Close signal"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Community Posts ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-12 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Community Posts
            <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>
          </h2>
          <button
            onClick={() => { setShowPostForm((v) => !v); setPostError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold transition-colors"
          >
            {showPostForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showPostForm ? "Cancel" : "New Post"}
          </button>
        </div>

        {/* New post form */}
        <AnimatePresence>
          {showPostForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-panel p-6 rounded-2xl border border-primary/20">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share market analysis, a trading insight, or educational content…"
                  rows={4}
                  className="w-full rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                />

                <div className="mt-4 max-w-xs">
                  <Field label="Post Type">
                    <select value={postType} onChange={(e) => setPostType(e.target.value)} className={inputCls}>
                      {POST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Image — upload a file OR paste a URL */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Image (optional)</label>
                    <div className="flex p-0.5 rounded-lg border border-white/10 bg-black/30 text-xs">
                      {(["upload", "url"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setPostImageMode(m)}
                          className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                            postImageMode === m ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                          }`}>
                          {m === "upload" ? "Upload" : "URL"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {postImageMode === "upload" ? (
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg py-2.5 px-3 text-sm text-muted-foreground border border-dashed border-white/15 bg-black/30 hover:border-primary/50 transition-colors">
                      <ImageIcon className="w-4 h-4" />
                      Choose an image (max 3MB)
                      <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input value={postImage.startsWith("data:") ? "" : postImage} onChange={(e) => setPostImage(e.target.value)}
                        placeholder="https://example.com/image.jpg" className={inputCls + " pl-9"} />
                    </div>
                  )}

                  {postImage && (
                    <div className="relative mt-3 inline-block">
                      <img src={postImage} alt="" className="max-h-40 rounded-xl border border-white/10 object-cover" />
                      <button type="button" onClick={() => setPostImage("")}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {postError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />{postError}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => { setShowPostForm(false); setPostError(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-white border border-white/10 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handlePublishPost} disabled={postSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-60">
                    {postSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Send className="w-4 h-4" /> Publish Post</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02]">
            <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground">Share your first post with your followers.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <div key={p.id} className="glass-panel p-5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/10 text-primary">
                    {POST_TYPES.find((t) => t.value === p.postType)?.label ?? p.postType}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(p.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                {p.image && (
                  <img src={p.image} alt="" className="mt-3 rounded-xl max-h-64 object-cover border border-white/10" />
                )}
                <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {p.likesCount}</span>
                  <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {p.commentsCount}</span>
                  <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> {p.sharesCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Small UI helpers ───────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg py-2.5 px-3 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon, iconCls, label, value, sub,
}: { icon: typeof Users; iconCls: string; label: string; value: string; sub: string }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
        <Icon className={`w-4 h-4 ${iconCls}`} /> {label}
      </div>
      <div className="text-2xl font-black font-mono text-white">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, valueCls = "text-white" }: { label: string; value: string; valueCls?: string }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${valueCls}`}>{value}</div>
    </div>
  );
}

function EarnTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl border border-white/10 text-xs" style={{ background: "rgba(8,8,16,0.95)", backdropFilter: "blur(16px)" }}>
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-green-400 font-mono">${payload[0].value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}
