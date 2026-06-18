"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Shield, Crown, Award, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { getUser, getToken, saveAuth, isAuthenticated, type AuthUser } from "@/lib/auth";
import type { Plan } from "@/lib/types";

const PLANS = [
  { name: "Basic", price: "0", period: "Free", icon: Zap, desc: "Suitable for beginners exploring the platform.",
    features: ["Access to Free Teachers only", "Follow up to 3 teachers", "Ads are displayed", "No auto-copy"],
    premium: false, color: "text-zinc-400", bgGlow: "bg-zinc-500/5" },
  { name: "Silver", price: "9.99", period: "/month", icon: Shield, desc: "Access Pro teachers and copy signals manually.",
    features: ["Access to Free Teachers + up to 3 Paid (Pro) Teachers", "Follow up to 10 teachers total", "No ads", "Manual one-click copy feature enabled"],
    premium: false, color: "text-blue-400", bgGlow: "bg-blue-500/5" },
  { name: "Gold", price: "24.99", period: "/month", icon: Award, desc: "Unlimited access with priority signal delivery.",
    features: ["Unlimited access to all Free and Paid Teachers", "Priority signal delivery (lower latency)", "Advanced portfolio analytics", "Early access to newly promoted Pro Teachers"],
    premium: true, color: "text-amber-400", bgGlow: "bg-amber-500/10" },
  { name: "Platinum", price: "49.99", period: "/month", icon: Crown, desc: "Full automation and power-user tools.",
    features: ["All Gold features plus Auto-Copy Bot access (Phase 2)", "VIP customer support", "Risk management tools", "Full API access for power users"],
    premium: false, color: "text-purple-400", bgGlow: "bg-purple-500/5" },
];

interface InitResponse { transactionId: number }

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [plansById, setPlansById] = useState<Record<string, number>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
    api.get<Plan[]>("/api/plans", { auth: false })
      .then((pl) => setPlansById(Object.fromEntries(pl.map((p) => [p.name.toLowerCase(), p.id]))))
      .catch(() => {});
  }, []);

  const refreshTier = useCallback(async () => {
    const u = getUser();
    const token = getToken();
    if (!u || !token) return;
    try {
      const fresh = await api.get<{ id: number; name: string; role: AuthUser["role"]; tier: string }>(`/api/users/${u.id}`);
      const updated: AuthUser = { id: fresh.id, name: fresh.name, role: fresh.role, tier: fresh.tier };
      saveAuth(token, updated);
      setUser(updated);
    } catch { /* ignore */ }
  }, []);

  async function handleSelect(planName: string) {
    setError(null);
    setSuccess(null);

    // Guests → register
    if (!isAuthenticated()) {
      router.push("/auth/register");
      return;
    }
    const current = getUser();
    if (current && current.role !== "Student") {
      setError("Only student accounts can subscribe to a plan.");
      return;
    }
    if (current?.tier?.toLowerCase() === planName.toLowerCase()) return; // already on it

    const planId = plansById[planName.toLowerCase()];
    if (!planId) { setError("Plan not available right now."); return; }

    setProcessing(planName);
    try {
      // 1. Initialize payment (mock gateway auto-succeeds)
      const init = await api.post<InitResponse>("/api/payments/initialize", { planId, gateway: "stripe" });
      // 2. Verify → backend upgrades the student's tier
      await api.get(`/api/payments/verify/${init.transactionId}`);
      // 3. Refresh local tier
      await refreshTier();
      setSuccess(`You are now on the ${planName} plan!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  const currentTier = user?.tier?.toLowerCase();
  const isStudent = user?.role === "Student";

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 rounded-full blur-[160px] -z-10 pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 pt-32">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider border rounded-full bg-white/5 border-white/10 text-primary">
            Subscription Tiers
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Choose Your <span className="text-gradient">Trading Edge</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Select a registration plan to access institutional-grade signals and copy-trading tools.
          </p>
        </div>

        {/* Status banners */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto mb-8 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto mb-8 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.name.toLowerCase();
            const isBusy = processing === plan.name;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 * index }}
                className={`relative flex flex-col h-full rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                  isCurrent ? "border-primary/60 bg-primary/[0.04] shadow-[0_0_40px_rgba(79,70,229,0.1)]"
                    : plan.premium ? "border-amber-500/40 bg-zinc-900/40" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <div className={`absolute inset-0 rounded-3xl -z-10 ${plan.bgGlow}`} />

                {isCurrent ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-white">
                    Current Plan
                  </span>
                ) : plan.premium && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                </div>
                <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed mb-6">{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  {plan.price !== "0" && <span className="text-2xl font-medium text-muted-foreground">$</span>}
                  <span className="text-4xl font-black text-white font-mono tracking-tight">{plan.price}</span>
                  <span className="text-xs text-muted-foreground font-medium">{plan.period}</span>
                </div>

                <ul className="flex flex-col gap-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.premium ? "text-amber-400" : "text-primary"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan.name)}
                  disabled={isCurrent || isBusy || (!!user && !isStudent)}
                  className={`w-full mt-auto py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent ? "bg-primary/15 text-primary border border-primary/30"
                      : plan.premium ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                  }`}
                >
                  {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : isCurrent ? "Current Plan"
                    : !isAuthenticated() ? "Get Started"
                    : plan.name === "Basic" ? "Switch to Basic"
                    : `Upgrade to ${plan.name}`}
                </button>
              </motion.div>
            );
          })}
        </div>

        {user && !isStudent && (
          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            You are signed in as a {user.role}. Plans are for student accounts.
          </p>
        )}
      </main>
    </div>
  );
}
