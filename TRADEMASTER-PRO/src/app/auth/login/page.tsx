"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[280px] h-[280px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

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
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-[26px] font-extrabold text-white tracking-tight mb-1.5">
            Welcome Back
          </h1>
          <p className="text-sm text-white/35">Sign in to access your trading dashboard</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

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
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none border border-white/8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                Password
              </label>
              <Link href="#" className="text-[11px] text-indigo-400/70 hover:text-indigo-400 transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/20 outline-none border border-white/8 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                style={{ background: "rgba(0,0,0,0.35)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-2.5 cursor-pointer group mt-1">
            <div className="relative">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-4 h-4 rounded-md border border-white/15 bg-black/30 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all" />
              <svg className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 16 16">
                <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">
              Remember me for 30 days
            </span>
          </label>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 my-5" />

        {/* Submit Button */}
        <Link href="/trade/BTC-USD">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all group"
            style={{
              background: "#4f46e5",
              boxShadow: "0 0 24px rgba(79,70,229,0.35)",
            }}
          >
            Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>

        {/* OR Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Google SSO stub */}
        <button
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white/50 border border-white/8 hover:border-white/15 hover:text-white/70 transition-all"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Register Link */}
        <p className="mt-5 text-center text-xs text-white/25">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-white font-bold hover:text-indigo-400 transition-colors">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}