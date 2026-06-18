"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion } from "framer-motion";
import {
  Trophy, Crown, ShieldCheck, Users, Activity, Loader2, AlertCircle, Medal, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { TeacherCard } from "@/lib/types";

const RANK_STYLES = [
  { ring: "border-amber-500/50 bg-amber-500/5", badge: "bg-amber-500 text-black", icon: Trophy, label: "text-amber-400" },
  { ring: "border-zinc-300/40 bg-zinc-300/5", badge: "bg-zinc-300 text-black", icon: Medal, label: "text-zinc-300" },
  { ring: "border-orange-600/40 bg-orange-600/5", badge: "bg-orange-600 text-white", icon: Medal, label: "text-orange-400" },
];

export default function LeaderboardPage() {
  const [teachers, setTeachers] = useState<TeacherCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<TeacherCard[]>("/api/users/leaderboard", { auth: false });
        setTeachers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const top3 = teachers.slice(0, 3);
  const rest = teachers.slice(3);

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />
      <div className="pt-[72px]"><TickerTape /></div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider border rounded-full bg-amber-500/10 border-amber-500/20 text-amber-400">
            <Trophy className="w-3.5 h-3.5" /> Top Traders
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Teacher <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Ranked by win rate and subscriber following. Top performers earn a featured spot.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />)}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No teachers ranked yet.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {top3.map((t, i) => {
                const s = RANK_STYLES[i];
                const Icon = s.icon;
                return (
                  <Link key={t.id} href={`/teachers/${t.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className={`relative glass-panel p-6 rounded-2xl border ${s.ring} hover:scale-[1.02] transition-transform cursor-pointer ${i === 0 ? "sm:-mt-2" : ""}`}
                    >
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${s.badge}`}>
                        {i + 1}
                      </div>
                      <div className="flex flex-col items-center text-center pt-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-xl font-bold mb-3">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {t.name}
                          {t.tier === "Pro" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <Icon className={`w-5 h-5 my-2 ${s.label}`} />
                        <div className={`text-2xl font-black font-mono ${s.label}`}>{t.winRate.toFixed(1)}%</div>
                        <div className="text-[11px] text-muted-foreground">win rate</div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.subscribers}</span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {t.totalSignals}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Rest of the ranking */}
            {rest.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.02)" }}>
                {rest.map((t, i) => (
                  <Link key={t.id} href={`/teachers/${t.id}`}>
                    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <span className="w-6 text-center font-mono font-bold text-muted-foreground/60">{i + 4}</span>
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white flex items-center gap-1.5 truncate">
                          {t.name}
                          {t.tier === "Pro" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {t.isFeatured && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{t.totalSignals} signals · {t.subscribers} subscribers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">{t.winRate.toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground">win rate</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
