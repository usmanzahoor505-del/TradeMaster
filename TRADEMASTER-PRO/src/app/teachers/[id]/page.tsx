"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion } from "framer-motion";
import {
  ShieldCheck, Crown, Users, Activity, TrendingUp, TrendingDown, Clock,
  Loader2, AlertCircle, Check, UserPlus, ArrowLeft, Trophy, Star, FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";
import { PostCard } from "@/components/organisms/PostCard";
import type { TeacherCard, Signal, Subscription, Plan, Post, PagedResult } from "@/lib/types";

interface PublicProfile {
  profile: TeacherCard;
  signals: Signal[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function TeacherProfilePage({ params }: { params: { id: string } }) {
  const teacherId = Number(params.id);
  const router = useRouter();

  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow state (for logged-in students)
  const [user] = useState(() => getUser());
  const [following, setFollowing] = useState(false);
  const [subId, setSubId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Posts tab
  const [tab, setTab] = useState<"posts" | "track">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  const isStudent = user?.role === "Student";

  const loadPosts = useCallback(async (pageToLoad: number, replace: boolean) => {
    setPostsLoading(true);
    try {
      const res = await api.get<PagedResult<Post>>(`/api/posts/teacher/${teacherId}?page=${pageToLoad}&pageSize=6`);
      setPosts((prev) => (replace ? res.items : [...prev, ...res.items]));
      setPostsHasMore(res.hasMore);
      setPostsPage(res.page);
    } catch { /* ignore */ } finally {
      setPostsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { loadPosts(1, true); }, [loadPosts]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await api.get<PublicProfile>(`/api/users/teacher/${teacherId}/public`, { auth: false });
      setData(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Teacher not found.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  // For students: figure out follow state + a plan id
  useEffect(() => {
    if (!isStudent || !user) return;
    (async () => {
      try {
        const [subs, plans] = await Promise.all([
          api.get<Subscription[]>(`/api/subscriptions/student/${user.id}`).catch(() => []),
          api.get<Plan[]>("/api/plans", { auth: false }).catch(() => []),
        ]);
        const active = subs.find((s) => s.teacherId === teacherId && s.status === "Active");
        if (active) { setFollowing(true); setSubId(active.id); }
        const byTier = plans.find((p) => p.name.toLowerCase() === (user.tier ?? "").toLowerCase());
        setPlanId(byTier?.id ?? [...plans].sort((a, b) => a.priceUsd - b.priceUsd)[0]?.id ?? null);
      } catch { /* ignore */ }
    })();
  }, [isStudent, user, teacherId]);

  async function handleFollow() {
    setActionError(null);
    if (!isAuthenticated()) { router.push("/auth/login"); return; }
    if (!isStudent) { setActionError("Only students can follow teachers."); return; }
    if (planId == null) { setActionError("No subscription plan available."); return; }
    setBusy(true);
    try {
      const sub = await api.post<Subscription>("/api/subscriptions", { teacherId, planId });
      setFollowing(true);
      setSubId(sub.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to follow.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnfollow() {
    if (subId == null) return;
    setBusy(true);
    try {
      await api.put(`/api/subscriptions/${subId}/cancel`);
      setFollowing(false);
      setSubId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to unfollow.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-40 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-muted-foreground">{error ?? "Teacher not found."}</p>
          <Link href="/discover" className="inline-block mt-4 text-primary font-bold hover:underline">← Back to Discover</Link>
        </div>
      </div>
    );
  }

  const p = data.profile;
  const losses = Math.max(0, p.closed - p.wins);

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 text-white">
      <Navbar />
      <div className="pt-[72px]"><TickerTape /></div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`glass-panel rounded-2xl border p-6 sm:p-8 mb-6 ${p.isFeatured ? "border-amber-500/40" : "border-white/10"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-indigo-600/20 border border-primary/40 flex items-center justify-center text-3xl font-bold shrink-0">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{p.name}</h1>
                {p.tier === "Pro" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <ShieldCheck className="w-3 h-3" /> Pro
                  </span>
                )}
                {p.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" /> Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Follow button */}
            <div className="shrink-0">
              {following ? (
                <button onClick={handleUnfollow} disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Following
                </button>
              ) : (
                <button onClick={handleFollow} disabled={busy}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    p.tier === "Pro" ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-primary hover:bg-blue-600 text-white"
                  }`}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {isAuthenticated() ? "Follow" : "Log in to follow"}
                </button>
              )}
            </div>
          </div>

          {actionError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />{actionError}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ProfStat icon={Trophy} iconCls="text-amber-400" label="Win Rate" value={`${p.winRate.toFixed(1)}%`} />
          <ProfStat icon={Users} iconCls="text-primary" label="Subscribers" value={`${p.subscribers}`} />
          <ProfStat icon={Activity} iconCls="text-blue-400" label="Total Signals" value={`${p.totalSignals}`} />
          <ProfStat icon={TrendingUp} iconCls="text-green-400" label="Wins / Losses" value={`${p.wins} / ${losses}`} />
        </div>

        {/* Tabs: Posts | Track Record */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/5">
          {([
            { key: "posts" as const, label: "Posts", icon: FileText, count: posts.length },
            { key: "track" as const, label: "Track Record", icon: Activity, count: data.signals.length },
          ]).map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="relative flex items-center gap-1.5 px-4 pb-3 text-sm font-medium transition-colors">
                <t.icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                <span className={active ? "text-white" : "text-muted-foreground hover:text-white/70"}>{t.label}</span>
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${active ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground/40"}`}>{t.count}</span>
                {active && <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* Posts tab */}
        {tab === "posts" && (
          postsLoading && posts.length === 0 ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02]">
              <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No posts published yet.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5">
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
              {postsHasMore && (
                <div className="text-center mt-6">
                  <button onClick={() => loadPosts(postsPage + 1, false)} disabled={postsLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                    {postsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Load More
                  </button>
                </div>
              )}
            </>
          )
        )}

        {/* Track record tab */}
        {tab === "track" && (
          data.signals.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm text-muted-foreground">No signals published yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.signals.map((s) => {
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
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(s.createdAt)}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10"
                    }`}>{s.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </main>
    </div>
  );
}

function ProfStat({ icon: Icon, iconCls, label, value }: { icon: typeof Users; iconCls: string; label: string; value: string }) {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5 text-xs"><Icon className={`w-4 h-4 ${iconCls}`} /> {label}</div>
      <div className="text-2xl font-black font-mono text-white">{value}</div>
    </div>
  );
}
