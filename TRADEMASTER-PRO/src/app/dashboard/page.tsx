"use client";

import { useState } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2, TrendingUp, TrendingDown, Clock, Activity, Wallet, ShieldCheck } from "lucide-react";

// Mock Data: Live Signals
const MOCK_SIGNALS = [
  { id: 1, teacher: "Alex Mercer", tier: "Pro", pair: "BTC/USDT", type: "LONG", entry: "64,230.50", tp: "65,500.00", sl: "63,800.00", time: "2 mins ago", status: "Active" },
  { id: 2, teacher: "Sarah Chen", tier: "Pro", pair: "EUR/USD", type: "SHORT", entry: "1.0845", tp: "1.0790", sl: "1.0875", time: "15 mins ago", status: "Active" },
  { id: 3, teacher: "David Kim", tier: "Free", pair: "SOL/USDT", type: "LONG", entry: "142.10", tp: "150.00", sl: "138.00", time: "1 hour ago", status: "Filled" },
];

export default function StudentDashboard() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // The magical "One-Click Copy" logic for Binance/Forex
  const handleCopySignal = (signal: typeof MOCK_SIGNALS[0]) => {
    const copyText = `🔔 TRADE SIGNAL\nPair: ${signal.pair}\nType: ${signal.type}\nEntry: ${signal.entry}\nTake Profit: ${signal.tp}\nStop Loss: ${signal.sl}\nProvider: ${signal.teacher}`;
    
    navigator.clipboard.writeText(copyText);
    setCopiedId(signal.id);
    
    // Reset icon after 2 seconds
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Wallet className="w-5 h-5 text-primary" /> Estimated Portfolio
            </div>
            <div className="text-3xl font-black font-mono text-white">$12,450.00</div>
            <div className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +$450.50 Today</div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Activity className="w-5 h-5 text-green-500" /> Copied Win Rate
            </div>
            <div className="text-3xl font-black font-mono text-white">68.5%</div>
            <div className="text-xs text-muted-foreground mt-2">Based on last 30 copied trades</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl border border-white/10 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-primary font-bold">
                <ShieldCheck className="w-5 h-5" /> Active Plan
              </div>
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">Silver Tier</span>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Following: <span className="text-white font-bold">4/10 Teachers</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Signal Feed (Takes 2 columns) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" /> Live Signal Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs text-muted-foreground font-medium">Real-time active</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {MOCK_SIGNALS.map((signal, idx) => (
                  <motion.div 
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative p-6 rounded-2xl border transition-all ${
                      signal.status === "Active" ? "bg-white/[0.02] border-white/10 hover:border-white/20" : "bg-black/40 border-white/5 opacity-70"
                    }`}
                  >
                    {/* Signal Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm">
                          {signal.teacher.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            {signal.teacher}
                            {signal.tier === "Pro" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {signal.time}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded font-bold text-xs tracking-wider ${
                        signal.type === "LONG" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {signal.type} {signal.pair}
                      </div>
                    </div>

                    {/* Signal Data */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Entry Price</div>
                        <div className="font-mono font-bold text-white text-lg">{signal.entry}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Take Profit</div>
                        <div className="font-mono font-bold text-green-400 text-lg">{signal.tp}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</div>
                        <div className="font-mono font-bold text-red-400 text-lg">{signal.sl}</div>
                      </div>
                    </div>

                    {/* One-Click Copy Action */}
                    {signal.status === "Active" && (
                      <button 
                        onClick={() => handleCopySignal(signal)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                          copiedId === signal.id 
                            ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                            : "bg-primary hover:bg-blue-600 text-white"
                        }`}
                      >
                        {copiedId === signal.id ? (
                          <><CheckCircle2 className="w-4 h-4" /> Copied to Clipboard!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> One-Click Copy</>
                        )}
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Followed Teachers</h3>
              <div className="flex flex-col gap-4">
                {["Alex Mercer", "Sarah Chen", "Elena V.", "David Kim"].map((name, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white/70">
                        {name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm text-white/90">{name}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 border border-white/10 rounded-lg text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                Manage Portfolio
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}