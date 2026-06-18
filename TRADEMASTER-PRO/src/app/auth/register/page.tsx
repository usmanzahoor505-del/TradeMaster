"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, User, ArrowRight, ShieldCheck, Zap, GraduationCap, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { saveAuth, homePathForRole, type AuthUser } from "@/lib/auth";

type Role = "Student" | "Teacher";

interface LoginResponse {
  token: string;
  id: number;
  name: string;
  role: AuthUser["role"];
  tier: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in your name, email, and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create the account
      await api.post(
        "/api/auth/register",
        { name: name.trim(), email: email.trim(), password, role },
        { auth: false }
      );
      // 2. Auto-login to get a token, then go to the dashboard
      const res = await api.post<LoginResponse>(
        "/api/auth/login",
        { email: email.trim(), password },
        { auth: false }
      );
      saveAuth(res.token, { id: res.id, name: res.name, role: res.role, tier: res.tier });
      router.push(homePathForRole(res.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabel = !password ? "Must be at least 8 characters long." : strength <= 1 ? "Weak password" : strength <= 2 ? "Getting stronger…" : "Strong password!";
  const strengthColor = strength <= 1 ? "bg-red-500" : strength <= 2 ? "bg-yellow-400" : "bg-green-400";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[280px] h-[280px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group absolute top-6 left-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/40 transition-all group-hover:border-indigo-400/60">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-white">
          TRADE<span className="text-indigo-400">MASTER</span>
        </span>
      </Link>

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "36px 32px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-[26px] font-extrabold text-white tracking-tight mb-1.5">
            Join TradeMaster
          </h1>
          <p className="text-sm text-white/35">Create your institutional-grade account</p>
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-2.5 mb-7">
          {[
            { icon: <ShieldCheck className="w-3 h-3 text-indigo-400" />, label: "256-bit SSL" },
            { icon: <Lock className="w-3 h-3 text-indigo-400" />, label: "2FA Ready" },
            { icon: <Zap className="w-3 h-3 text-indigo-400" />, label: "Instant KYC" },
          ].map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/6 bg-white/[0.03] text-[10px] font-semibold text-white/30 tracking-wide"
            >
              {b.icon}
              {b.label}
            </span>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Role Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              I am joining as
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "Student" as Role, label: "Student", sub: "Follow & copy signals", icon: GraduationCap },
                { value: "Teacher" as Role, label: "Teacher", sub: "Publish signals", icon: ShieldCheck },
              ]).map((opt) => {
                const active = role === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-indigo-500/60 bg-indigo-500/10"
                        : "border-white/8 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-white/40"}`} />
                    <span className={`text-sm font-bold ${active ? "text-white" : "text-white/70"}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-white/30">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none border border-white/8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none border border-white/8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none border border-white/8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </div>

            {/* Strength Bar */}
            <div className="flex gap-1 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${
                    i < strength ? strengthColor : "bg-white/8"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-white/25 mt-1">{strengthLabel}</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/5 my-5" />

        {/* Submit Button */}
        <motion.button
          onClick={handleRegister}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "#4f46e5",
            boxShadow: "0 0 24px rgba(79,70,229,0.35)",
          }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </motion.button>

        {/* Sign In Link */}
        <p className="mt-5 text-center text-xs text-white/25">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-white font-bold hover:text-indigo-400 transition-colors">
            Sign In
          </Link>
        </p>

        {/* Terms */}
        <p className="mt-3.5 text-center text-[11px] text-white/18 leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-indigo-400/70 hover:text-indigo-400 transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-indigo-400/70 hover:text-indigo-400 transition-colors">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}