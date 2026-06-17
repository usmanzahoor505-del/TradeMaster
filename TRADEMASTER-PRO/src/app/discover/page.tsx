"use client";

import { useState } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, TrendingUp, Users, Star, Activity, ShieldCheck } from "lucide-react";

// Mock Data based on your PRD rules (Pro > 60% win rate)
const MOCK_TEACHERS = [
  { id: 1, name: "Alex Mercer", tier: "Pro", asset: "Crypto", winRate: 78.5, followers: "12.4k", pnl: "+145.2%", isTrending: true },
  { id: 2, name: "Sarah Chen", tier: "Pro", asset: "Forex", winRate: 82.1, followers: "8.9k", pnl: "+210.4%", isTrending: false },
  { id: 3, name: "Marcus Doe", tier: "Free", asset: "Crypto", winRate: 54.2, followers: "850", pnl: "+12.8%", isTrending: false },
  { id: 4, name: "Elena V.", tier: "Pro", asset: "Forex", winRate: 68.9, followers: "4.2k", pnl: "+85.5%", isTrending: false },
  { id: 5, name: "David Kim", tier: "Free", asset: "Crypto", winRate: 59.5, followers: "1.2k", pnl: "+22.1%", isTrending: true },
  { id: 6, name: "James Wright", tier: "Pro", asset: "Crypto", winRate: 91.2, followers: "24.5k", pnl: "+450.0%", isTrending: true },
];

const TABS = ["All", "Crypto", "Forex", "Pro Only", "Free Only"];

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Logic
  const filteredTeachers = MOCK_TEACHERS.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === "Crypto") return t.asset === "Crypto";
    if (activeTab === "Forex") return t.asset === "Forex";
    if (activeTab === "Pro Only") return t.tier === "Pro";
    if (activeTab === "Free Only") return t.tier === "Free";
    return true; // "All"
  });

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Discover <span className="text-primary">Master Traders</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Find and follow top-performing signal providers. Filter by asset class, win rate, and premium tiers to build your ultimate copy-trading portfolio.
            </p>
          </div>
          
          {/* Search Bar */}
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
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 mr-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter</span>
          </div>
          {TABS.map((tab) => (
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
            </button>
          ))}
        </div>

        {/* Teachers Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTeachers.map((teacher) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={teacher.id}
                className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
              >
                {/* Top Row: Avatar & Badges */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {teacher.name}
                        {teacher.tier === "Pro" && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                      </h3>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {teacher.asset} Trader
                      </span>
                    </div>
                  </div>
                  
                  {/* Tier Badge */}
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    teacher.tier === "Pro" 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                      : "bg-white/5 text-zinc-400 border-white/10"
                  }`}>
                    {teacher.tier}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Activity className="w-3.5 h-3.5" /> Win Rate
                    </div>
                    <div className={`text-lg font-mono font-bold ${teacher.winRate >= 75 ? 'text-green-400' : 'text-white'}`}>
                      {teacher.winRate}%
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Total P&L
                    </div>
                    <div className="text-lg font-mono font-bold text-green-400">
                      {teacher.pnl}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Followers & CTA */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-mono text-white">{teacher.followers}</span>
                  </div>
                  
                  <button className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    teacher.tier === "Pro"
                      ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}>
                    Copy Signals
                  </button>
                </div>

                {/* Trending Glow */}
                {teacher.isTrending && (
                  <div className="absolute top-0 right-0 p-4 -z-10 opacity-30">
                    <div className="w-24 h-24 bg-primary rounded-full blur-[50px]" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State Handler */}
        {filteredTeachers.length === 0 && (
          <div className="text-center py-20">
            <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No traders found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}