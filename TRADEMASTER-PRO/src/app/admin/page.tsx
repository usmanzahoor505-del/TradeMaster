"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, ShieldCheck, Wallet, Layers, Send, Loader2,
  AlertCircle, Search, Crown, Save, Activity, Star, Gavel, Check, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { homePathForRole } from "@/lib/auth";
import type { UserAccount, Signal, Subscription, Transaction, Plan, Dispute } from "@/lib/types";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const ROLES = ["Student", "Teacher", "Admin"];
const STATUSES = ["Active", "Suspended", "Banned"];

export default function AdminConsole() {
  const { user, ready } = useRequireAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [resolutionText, setResolutionText] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Admin-only guard
  useEffect(() => {
    if (ready && user && user.role !== "Admin") {
      router.replace(homePathForRole(user.role));
    }
  }, [ready, user, router]);

  const loadData = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    setLoading(true);
    setError(null);
    try {
      const [us, sg, sb, tx, pl, dp] = await Promise.all([
        api.get<UserAccount[]>("/api/users"),
        api.get<Signal[]>("/api/signals").catch(() => []),
        api.get<Subscription[]>("/api/subscriptions").catch(() => []),
        api.get<Transaction[]>("/api/transactions").catch(() => []),
        api.get<Plan[]>("/api/plans", { auth: false }).catch(() => []),
        api.get<Dispute[]>("/api/disputes").catch(() => []),
      ]);
      setUsers(us);
      setSignals(sg);
      setSubs(sb);
      setTxns(tx);
      setPlans(pl);
      setDisputes(dp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user?.role === "Admin") loadData();
  }, [ready, user, loadData]);

  // ── Analytics ──────────────────────────────────────────────────────────────
  const a = useMemo(() => {
    const teachers = users.filter((u) => u.role === "Teacher");
    return {
      total: users.length,
      students: users.filter((u) => u.role === "Student").length,
      teachers: teachers.length,
      proTeachers: teachers.filter((u) => u.tier === "Pro").length,
      suspended: users.filter((u) => u.status !== "Active").length,
      revenue: txns.filter((t) => t.type === "credit" && t.status === "Completed").reduce((s, t) => s + t.amount, 0),
      activeSubs: subs.filter((s) => s.status === "Active").length,
      signals: signals.length,
    };
  }, [users, txns, subs, signals]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      if (query && !u.name.toLowerCase().includes(query.toLowerCase()) && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [users, roleFilter, query]);

  const userById = useMemo(() => {
    const m = new Map<number, UserAccount>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  // ── User actions ─────────────────────────────────────────────────────────
  async function patchUser(id: number, body: Record<string, string | boolean>) {
    setSavingId(id);
    setError(null);
    try {
      await api.put(`/api/users/${id}`, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...body } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  }

  // ── Dispute actions ──────────────────────────────────────────────────────
  async function resolveDispute(id: number, status: "Resolved" | "Rejected") {
    setSavingId(-1000 - id); // distinct negative key
    setError(null);
    try {
      const updated = await api.put<Dispute>(`/api/disputes/${id}/resolve`, {
        status,
        resolution: resolutionText[id] ?? "",
      });
      setDisputes((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve dispute.");
    } finally {
      setSavingId(null);
    }
  }

  // ── Plan / commission actions ────────────────────────────────────────────
  function setPlanField(id: number, field: "priceUsd" | "commissionRate", value: number) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }
  async function savePlan(plan: Plan) {
    setSavingId(-plan.id); // negative key to distinguish from users
    setError(null);
    try {
      await api.put(`/api/plans/${plan.id}`, { priceUsd: plan.priceUsd, commissionRate: plan.commissionRate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan.");
    } finally {
      setSavingId(null);
    }
  }

  if (!ready || (user && user.role !== "Admin")) {
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
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Platform</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Admin Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, tiers, commissions and platform analytics.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Analytics */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <Stat icon={Users} iconCls="text-primary" label="Total Users" value={`${a.total}`} />
          <Stat icon={GraduationCap} iconCls="text-blue-400" label="Students" value={`${a.students}`} />
          <Stat icon={ShieldCheck} iconCls="text-amber-400" label="Teachers" value={`${a.teachers}`} sub={`${a.proTeachers} Pro`} />
          <Stat icon={Wallet} iconCls="text-green-400" label="Revenue" value={`$${fmt(a.revenue)}`} />
          <Stat icon={Layers} iconCls="text-purple-400" label="Active Subs" value={`${a.activeSubs}`} />
          <Stat icon={Send} iconCls="text-cyan-400" label="Signals" value={`${a.signals}`} />
        </div>

        {/* Commission / Plans */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Commission &amp; Plans
          </h2>
          {loading ? (
            <div className="h-24 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">{p.name}</h3>
                    <span className="text-xs text-muted-foreground">#{p.id}</span>
                  </div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Price (USD/mo)</label>
                  <input type="number" value={p.priceUsd}
                    onChange={(e) => setPlanField(p.id, "priceUsd", parseFloat(e.target.value) || 0)}
                    className={inputCls + " mb-3 mt-1"} />
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Commission Rate</label>
                  <input type="number" step="0.01" value={p.commissionRate}
                    onChange={(e) => setPlanField(p.id, "commissionRate", parseFloat(e.target.value) || 0)}
                    className={inputCls + " mt-1"} />
                  <button onClick={() => savePlan(p)} disabled={savingId === -p.id}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-primary hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-60">
                    {savingId === -p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Disputes */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" /> Disputes
            <span className="text-sm font-normal text-muted-foreground">
              ({disputes.filter((d) => d.status === "Open").length} open)
            </span>
          </h2>
          {loading ? (
            <div className="h-20 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
          ) : disputes.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Gavel className="w-9 h-9 text-white/15 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No disputes filed.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {disputes.map((d) => {
                const open = d.status === "Open";
                const raiser = userById.get(d.raisedById);
                const against = d.againstId ? userById.get(d.againstId) : null;
                return (
                  <div key={d.id} className="glass-panel p-5 rounded-2xl border border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                          {d.subject}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            open ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : d.status === "Resolved" ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>{d.status}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          By <span className="text-white/80">{raiser?.name ?? `User #${d.raisedById}`}</span>
                          {against && <> · against <span className="text-white/80">{against.name}</span></>}
                          {" · "}{new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {d.description && <p className="text-sm text-muted-foreground/80 mb-3">{d.description}</p>}
                    {d.resolution && (
                      <p className="text-xs text-green-300/80 mb-3 rounded-lg bg-green-500/5 border border-green-500/15 px-3 py-2">
                        Resolution: {d.resolution}
                      </p>
                    )}
                    {open && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={resolutionText[d.id] ?? ""}
                          onChange={(e) => setResolutionText((prev) => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Resolution note…"
                          className="flex-1 rounded-lg py-2 px-3 text-sm text-white placeholder:text-white/20 outline-none border border-white/10 bg-black/30 focus:border-primary/50"
                        />
                        <button onClick={() => resolveDispute(d.id, "Resolved")} disabled={savingId === -1000 - d.id}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 text-sm font-bold hover:bg-green-500/25 transition-colors disabled:opacity-50">
                          {savingId === -1000 - d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Resolve
                        </button>
                        <button onClick={() => resolveDispute(d.id, "Rejected")} disabled={savingId === -1000 - d.id}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-muted-foreground text-sm font-bold hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* User Management */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> User Management
              <span className="text-sm font-normal text-muted-foreground">({filteredUsers.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name/email…"
                  className="w-52 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-muted-foreground/30 outline-none border border-white/10 bg-white/[0.04] focus:border-primary/50" />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl py-2 px-3 text-xs text-white outline-none border border-white/10 bg-white/[0.04]">
                {["All", ...ROLES].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
                      {["User", "Role", "Tier", "Status", "Featured", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.025] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">{u.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="font-bold text-white text-sm">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground/50">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <select value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}
                            className="rounded-lg py-1.5 px-2 text-xs text-white outline-none border border-white/10 bg-black/30">
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        {/* Tier (override) */}
                        <td className="px-4 py-3">
                          <button onClick={() => patchUser(u.id, { tier: u.tier === "Pro" ? "Free" : "Pro" })}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              u.tier === "Pro" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-white/5 text-zinc-300 border-white/10 hover:border-white/20"
                            }`}>
                            {u.tier === "Pro" && <Crown className="w-3 h-3" />}{u.tier}
                          </button>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <select value={u.status} onChange={(e) => patchUser(u.id, { status: e.target.value })}
                            className={`rounded-lg py-1.5 px-2 text-xs font-semibold outline-none border bg-black/30 ${
                              u.status === "Active" ? "text-green-400 border-green-500/30" :
                              u.status === "Suspended" ? "text-yellow-400 border-yellow-500/30" : "text-red-400 border-red-500/30"
                            }`}>
                            {STATUSES.map((s) => <option key={s} value={s} className="text-white bg-zinc-900">{s}</option>)}
                          </select>
                        </td>
                        {/* Featured (teachers only) */}
                        <td className="px-4 py-3">
                          {u.role === "Teacher" ? (
                            <button onClick={() => patchUser(u.id, { isFeatured: !u.isFeatured })} title="Toggle featured"
                              className={`p-1.5 rounded-lg transition-colors ${u.isFeatured ? "text-amber-400" : "text-muted-foreground/40 hover:text-amber-400"}`}>
                              <Star className={`w-4 h-4 ${u.isFeatured ? "fill-amber-400" : ""}`} />
                            </button>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {savingId === u.id && <Loader2 className="w-4 h-4 animate-spin text-primary inline" />}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground/40">No users match.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg py-2 px-3 text-sm text-white outline-none border border-white/10 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20";

function Stat({ icon: Icon, iconCls, label, value, sub }: { icon: typeof Users; iconCls: string; label: string; value: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 text-muted-foreground mb-1.5 text-xs"><Icon className={`w-4 h-4 ${iconCls}`} /> {label}</div>
      <div className="text-2xl font-black font-mono text-white">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </motion.div>
  );
}
