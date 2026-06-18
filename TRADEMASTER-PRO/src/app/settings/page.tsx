"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { motion } from "framer-motion";
import {
  User as UserIcon, Mail, ShieldCheck, Loader2, AlertCircle, CheckCircle2,
  Save, Bell, Link2, Lock, Crown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { getToken, saveAuth, getUser } from "@/lib/auth";
import type { UserAccount } from "@/lib/types";

export default function SettingsPage() {
  const { user, ready } = useRequireAuth();

  const [account, setAccount] = useState<UserAccount | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Local notification preferences (cosmetic, stored in localStorage)
  const [notifySignals, setNotifySignals] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const acc = await api.get<UserAccount>(`/api/users/${user.id}`);
      setAccount(acc);
      setName(acc.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotifySignals(localStorage.getItem("pref_notify_signals") !== "false");
    setNotifyEmail(localStorage.getItem("pref_notify_email") === "true");
  }, []);

  function togglePref(key: "signals" | "email", value: boolean) {
    if (key === "signals") { setNotifySignals(value); localStorage.setItem("pref_notify_signals", String(value)); }
    else { setNotifyEmail(value); localStorage.setItem("pref_notify_email", String(value)); }
  }

  async function saveProfile() {
    if (!user || !name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put(`/api/users/${user.id}`, { name: name.trim() });
      // Keep the cached auth user's name in sync (navbar etc.)
      const token = getToken();
      const cached = getUser();
      if (token && cached) saveAuth(token, { ...cached, name: name.trim() });
      setAccount((a) => (a ? { ...a, name: name.trim() } : a));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const isStudent = account?.role === "Student";

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-32">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Account</p>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1].map((i) => <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Profile */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="font-bold mb-5 flex items-center gap-2"><UserIcon className="w-4 h-4 text-primary" /> Profile</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-indigo-600/20 border border-primary/40 flex items-center justify-center text-2xl font-bold">
                  {(account?.name ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> {account?.role}
                  </span>
                  {account?.tier && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <Crown className="w-3.5 h-3.5" /> {account.tier}
                    </span>
                  )}
                </div>
              </div>

              <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full mt-1.5 mb-4 rounded-lg py-2.5 px-3 text-sm text-white outline-none border border-white/10 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20" />

              <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Email</label>
              <div className="relative mt-1.5 mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input value={account?.email ?? ""} readOnly
                  className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm text-white/50 outline-none border border-white/8 bg-black/20 cursor-not-allowed" />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={saveProfile} disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-sm font-bold transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
                {saved && <span className="flex items-center gap-1.5 text-sm text-green-400"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
              </div>
            </motion.section>

            {/* Notifications */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="font-bold mb-5 flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notifications</h2>
              <ToggleRow label="Real-time signal alerts" desc="Get notified instantly when teachers post new signals." checked={notifySignals} onChange={(v) => togglePref("signals", v)} />
              <ToggleRow label="Email notifications" desc="Receive a summary by email (coming soon)." checked={notifyEmail} onChange={(v) => togglePref("email", v)} />
            </motion.section>

            {/* Connected Exchanges — Phase 2 */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-panel p-6 rounded-2xl border border-white/10 opacity-80">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Connected Exchanges</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-muted-foreground">
                  <Lock className="w-3 h-3" /> Phase 2
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? "Connect your Binance / Bybit account (trade-only API keys, AES-256 encrypted) to enable the Auto-Copy Bot. Available on the Platinum plan in Phase 2."
                  : "Exchange connections are available for student accounts in Phase 2."}
              </p>
              <button disabled className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-muted-foreground/60 cursor-not-allowed">
                <Lock className="w-4 h-4" /> Connect Exchange (Coming Soon)
              </button>
            </motion.section>
          </div>
        )}
      </main>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-primary" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
