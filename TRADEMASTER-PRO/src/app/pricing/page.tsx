"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { motion } from "framer-motion";
import { Check, Zap, Shield, Crown, Award } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Basic",
    price: "0",
    period: "Free",
    icon: Zap,
    desc: "Suitable for beginners exploring the platform.",
    features: [
      "Access to Free Teachers only",
      "Follow up to 3 teachers",
      "Standard signal latency",
      "Ads displayed",
      "No auto-copy feature"
    ],
    cta: "Get Started",
    premium: false,
    color: "text-zinc-400",
    bgGlow: "bg-zinc-500/5"
  },
  {
    name: "Silver",
    price: "9.99",
    period: "/month",
    icon: Shield,
    desc: "Great for rising traders tracking reliable metrics.",
    features: [
      "Access to Free + 3 Paid (Pro) Teachers",
      "Follow up to 10 teachers total",
      "No ads interface",
      "Manual one-click copy enabled",
      "Standard charts access"
    ],
    cta: "Upgrade to Silver",
    premium: false,
    color: "text-blue-400",
    bgGlow: "bg-blue-500/5"
  },
  {
    name: "Gold",
    price: "24.99",
    period: "/month",
    icon: Award,
    desc: "Perfect for active traders seeking zero limits.",
    features: [
      "Unlimited access to all Free & Paid Teachers",
      "Priority signal delivery (lower latency)",
      "Advanced portfolio analytics",
      "Early access to newly promoted Pro Teachers",
      "No ads interface"
    ],
    cta: "Go Gold Pro",
    premium: true,
    color: "text-amber-400",
    bgGlow: "bg-amber-500/10"
  },
  {
    name: "Platinum",
    price: "49.99",
    period: "/month",
    icon: Crown,
    desc: "The ultimate tier for professional automation.",
    features: [
      "All Gold Tier features included",
      "Auto-Copy Bot access (Phase 2)",
      "VIP customer support 24/7",
      "Advanced risk management tools",
      "Full API access for power users"
    ],
    cta: "Unlock Platinum Access",
    premium: false,
    color: "text-purple-400",
    bgGlow: "bg-purple-500/5"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-white pb-20">
      {/* Universal Floating Navbar */}
      <Navbar />

      {/* Ambient background lighting effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 rounded-full blur-[160px] -z-10 pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 pt-32">
        {/* Page Main Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider border rounded-full bg-white/5 border-white/10 text-primary"
          >
            Subscription Tiers
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
          >
            Choose Your <span className="text-gradient">Trading Edge</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto"
          >
            Select a registration plan to access institutional-grade signals, transparent profit tracking, and automated copy-trading tools.
          </motion.p>
        </div>

        {/* Pricing Cards Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`relative flex flex-col h-full rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 group ${
                  plan.premium 
                    ? "border-amber-500/40 bg-zinc-900/40 shadow-[0_0_40px_rgba(245,158,11,0.05)]" 
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {/* Visual Accent Glow Layer */}
                <div className={`absolute inset-0 rounded-3xl -z-10 transition-opacity duration-500 ${plan.bgGlow}`} />

                {/* Popular Badge for Gold Plan */}
                {plan.premium && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-lg shadow-amber-500/20">
                    Most Popular
                  </span>
                )}

                {/* Card Title & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <IconComponent className={`w-5 h-5 ${plan.color}`} />
                </div>

                {/* Subtitle / Description */}
                <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed mb-6">
                  {plan.desc}
                </p>

                {/* Exact Numeric Price Metric */}
                <div className="flex items-baseline gap-1 mb-8">
                  {plan.price !== "0" && <span className="text-2xl font-medium text-muted-foreground">$</span>}
                  <span className="text-4xl font-black text-white font-mono tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {plan.period}
                  </span>
                </div>

                {/* Features Checklist List */}
                <ul className="flex flex-col gap-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.premium ? 'text-amber-400' : 'text-primary'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA Trigger Link */}
                <Link href="/auth/register" className="w-full mt-auto">
                  <button
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] ${
                      plan.premium
                        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                        : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}