"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Users, Star, ShieldCheck, Loader2, AlertCircle,
  Check, UserPlus, Crown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import type { Teacher, Subscription, Plan } from "@/lib/types";

const TABS = ["All", "Free Teachers", "Pro Teachers", "Following"] as const;
type Tab = typeof TABS[number];

export default function DiscoverPage() {
  const { user, ready } = useRequireAuth();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [tea, sub, pl] = await Promise.all([
        api.get<Teacher[]>("/api/users/teachers", { auth: false }),
        api.get<Subscription[]>(`/api/subscriptions/student/${user.id}`).catch(() => []),
        api.get<Plan[]>("/api/plans", { auth: false }).catch(() => []),
      ]);
      setTeachers(tea.filter((t) => t.status === "Active"));
      setSubs(sub);
      setPlans(pl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) loadData();
  }, [ready, user, loadData]);

  // Map teacherId -> active subscription (for unfollow)
  const subByTeacher = useMemo(() => {
    const m = new Map<number, Subscription>();
    subs.filter((s) => s.status === "Active").forEach((s) => m.set(s.teacherId, s));
    return m;
  }, [subs]);

  // Pick a planId for a new subscription (matches the student's tier, else Basic/cheapest)
  const defaultPlanId = useMemo(() => {
    if (plans.length === 0) return null;
    const byTier = plans.find((p) => p.name.toLowerCase() === (user?.tier ?? "").toLowerCase());
    if (byTier) return byTier.id;
    const basic = [...plans].sort((a, b) => a.priceUsd - b.priceUsd)[0];
    return basic?.id ?? null;
  }, [plans, user]);

  const isStudent = user?.role === "Student";
  const tier = (user?.tier ?? "").toLowerCase();
  // Basic/Free students may only access Free teachers (PRD 3.1)
  const isBasic = isStudent && (tier === "" || tier === "free" || tier === "basic");

  // Pro filter tab is meaningless for Basic students
  const visibleTabs = isBasic ? TABS.filter((t) => t !== "Pro Teachers") : TABS;

  async function handleFollow(teacher: Teacher) {
    setActionError(null);
    if (!isStudent) { setActionError("Only students can follow teachers."); return; }
    if (defaultPlanId == null) { setActionError("No subscription plan available."); return; }
    setBusyId(teacher.id);
    try {
      const created = await api.post<Subscription>("/api/subscriptions", {
        teacherId: teacher.id,
        planId: defaultPlanId,
      });
      setSubs((prev) => [...prev, created]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to follow teacher.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnfollow(teacher: Teacher) {
    setActionError(null);
    const sub = subByTeacher.get(teacher.id);
    if (!sub) return;
    setBusyId(teacher.id);
    try {
      await api.put<Subscription>(`/api/subscriptions/${sub.id}/cancel`);
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: "Cancelled" } : s)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to unfollow teacher.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    return teachers
      .filter((t) => {
        // Basic/Free students only ever see Free teachers
        if (isBasic && t.tier === "Pro") return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (activeTab === "Free Teachers") return t.tier !== "Pro";
        if (activeTab === "Pro Teachers") return t.tier === "Pro";
        if (activeTab === "Following") return subByTeacher.has(t.id);
        return true;
      })
      // Featured teachers first
      .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  }, [teachers, searchQuery, activeTab, subByTeacher, isBasic]);

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Discover <span className="text-primary">Master Traders</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Follow top signal providers. Free teachers are open to everyone; Pro teachers require a subscription.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search traders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 mr-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter</span>
          </div>
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
              }`}
            >
              {tab}
              {tab === "Following" && subByTeacher.size > 0 && (
                <span className="ml-1.5 text-xs">({subByTeacher.size})</span>
              )}
            </button>
          ))}
        </div>

        {/* Basic plan upgrade prompt */}
        {isBasic && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-200/80 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              You are on the <span className="font-bold text-amber-300">Basic</span> plan — only Free teachers are shown (up to 3 follows).
            </p>
            <Link href="/pricing" className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors">
              Upgrade to access Pro teachers
            </Link>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Teachers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-52 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No traders found</h3>
            <p className="text-muted-foreground">
              {activeTab === "Following" ? "You are not following anyone yet." : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((teacher) => {
                const isPro = teacher.tier === "Pro";
                const following = subByTeacher.has(teacher.id);
                const memberSince = new Date(teacher.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    key={teacher.id}
                    className={`glass-panel p-6 rounded-3xl border transition-all relative overflow-hidden ${
                      teacher.isFeatured ? "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.08)]" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {teacher.isFeatured && (
                      <div className="absolute top-0 right-0 flex items-center gap-1 px-3 py-1 rounded-bl-xl bg-amber-500/15 border-l border-b border-amber-500/25 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> Featured
                      </div>
                    )}
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-6">
                      <Link href={`/teachers/${teacher.id}`} className="flex items-center gap-4 group/profile">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2 group-hover/profile:text-primary transition-colors">
                            {teacher.name}
                            {isPro && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                          </h3>
                          <span className="text-xs font-medium text-muted-foreground">Member since {memberSince}</span>
                        </div>
                      </Link>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                        isPro ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-zinc-400 border-white/10"
                      }`}>
                        {isPro && <Crown className="w-3 h-3" />}
                        {isPro ? "Pro" : "Free"}
                      </div>
                    </div>

                    {/* Access note */}
                    <div className="mb-6 rounded-xl bg-black/20 border border-white/5 p-3">
                      <p className="text-xs text-muted-foreground">
                        {isPro
                          ? "Premium signals — subscription required to receive."
                          : "Free signals — visible to all followers at no cost."}
                      </p>
                    </div>

                    {/* Follow button */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">{isPro ? "Pro Teacher" : "Free Teacher"}</span>
                      </div>

                      {following ? (
                        <button
                          onClick={() => handleUnfollow(teacher)}
                          disabled={busyId === teacher.id}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
                        >
                          {busyId === teacher.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Following
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow(teacher)}
                          disabled={busyId === teacher.id || !isStudent}
                          title={!isStudent ? "Only students can follow" : undefined}
                          className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isPro ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-primary hover:bg-blue-600 text-white"
                          }`}
                        >
                          {busyId === teacher.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                          Follow
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
