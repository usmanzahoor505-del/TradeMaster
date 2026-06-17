"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { TickerTape } from "@/components/organisms/TickerTape";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Asset {
  coin: string;
  name: string;
  balance: string;
  value: string;
  change: string;
  colorClass: string;
  dotColor: string;
}

interface HistoryPoint {
  day: string;
  value: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const generateHistory = (): HistoryPoint[] => {
  let val = 125000;
  return Array.from({ length: 30 }).map((_, i) => {
    val = val + (Math.random() * 5000 - 2000);
    return { day: `Day ${i + 1}`, value: Number(val.toFixed(2)) };
  });
};

const MY_ASSETS: Asset[] = [
  {
    coin: "BTC",
    name: "Bitcoin",
    balance: "1.2450",
    value: "80,000.45",
    change: "+2.4%",
    colorClass: "text-orange-400",
    dotColor: "#fb923c",
  },
  {
    coin: "ETH",
    name: "Ethereum",
    balance: "8.5000",
    value: "29,326.00",
    change: "-1.2%",
    colorClass: "text-blue-400",
    dotColor: "#60a5fa",
  },
  {
    coin: "USDT",
    name: "Tether",
    balance: "45,230.00",
    value: "45,230.00",
    change: "0.0%",
    colorClass: "text-green-400",
    dotColor: "#4ade80",
  },
  {
    coin: "SOL",
    name: "Solana",
    balance: "145.00",
    value: "21,054.00",
    change: "+5.6%",
    colorClass: "text-purple-400",
    dotColor: "#c084fc",
  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl border border-white/10 text-xs"
      style={{
        background: "rgba(8,8,16,0.95)",
        backdropFilter: "blur(16px)",
      }}
    >
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-white font-mono">
        ${payload[0].value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string; label: string }) {
  const up = value.startsWith("+");
  const down = value.startsWith("-");
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        {label}
      </span>
      <span
        className={`text-sm font-bold font-mono tabular-nums ${
          up ? "text-green-400" : down ? "text-red-400" : "text-white/80"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Glass Panel ─────────────────────────────────────────────────────────────

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState<"7D" | "30D" | "90D" | "ALL">("30D");

  useEffect(() => {
    setHistoryData(generateHistory());
    setMounted(true);
  }, []);

  const totalValue = "$175,610.45";
  const dayChange = "+$4,230.50";
  const dayChangePct = "+2.4%";
  const isUp = true;

  return (
    <div className="min-h-screen overflow-x-hidden pb-24">
      <Navbar />

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="pt-[72px]">
        <TickerTape />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">

        {/* ── Page Title ───────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
              Overview
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Portfolio
            </h1>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Balance + Chart (2 cols) ──────────────────────────────── */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0.05}
            className="lg:col-span-2"
          >
            <GlassPanel className="p-6 sm:p-8 flex flex-col h-full">

              {/* Header row */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                    <Wallet className="w-3.5 h-3.5" />
                    Estimated Balance
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums font-mono">
                    $175,610
                    <span className="text-muted-foreground/50 text-2xl sm:text-3xl">.45</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        isUp
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {dayChange} ({dayChangePct})
                    </span>
                    <span className="text-xs text-muted-foreground/50">Today</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl overflow-hidden relative"
                    style={{
                      background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                      boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
                    }}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Deposit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw
                  </motion.button>
                </div>
              </div>

              {/* Range Tabs */}
              <div className="flex items-center gap-1 mb-4">
                {(["7D", "30D", "90D", "ALL"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      range === r
                        ? "text-white"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    }`}
                  >
                    {range === r && (
                      <motion.div
                        layoutId="range-pill"
                        className="absolute inset-0 rounded-lg bg-white/8 border border-white/10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{r}</span>
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="flex-1 min-h-[220px]">
                {!mounted ? (
                  <div className="w-full h-full rounded-xl bg-white/5 animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#areaGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassPanel>
          </motion.div>

          {/* ── Right Column ─────────────────────────────────────────────── */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="flex flex-col gap-4"
          >
            {/* Quick Stats */}
            <GlassPanel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Snapshot
              </p>
              <div className="grid grid-cols-2 gap-4">
                <StatPill value="$175,610" label="Total Value" />
                <StatPill value="+2.4%" label="24h Return" />
                <StatPill value="$4,230" label="Day P&L" />
                <StatPill value="4" label="Assets" />
              </div>
            </GlassPanel>

            {/* Quick Actions */}
            <GlassPanel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
                Quick Actions
              </p>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 mb-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors flex items-center justify-center gap-2 text-sm text-white font-semibold"
              >
                <CreditCard className="w-4 h-4 text-primary" />
                Buy Crypto with Card
              </motion.button>
              <p className="text-[10px] text-center text-muted-foreground/40">
                Apple Pay · Visa · Mastercard
              </p>
            </GlassPanel>

            {/* Assets List */}
            <GlassPanel className="p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Your Assets
                </p>
                <button className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground flex items-center gap-1 transition-colors">
                  View all <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {MY_ASSETS.map((asset) => {
                  const up = asset.change.startsWith("+");
                  const down = asset.change.startsWith("-");
                  return (
                    <div
                      key={asset.coin}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/8"
                    >
                      <div className="flex items-center gap-3">
                        {/* Coin dot avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shrink-0"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${asset.dotColor}25, rgba(0,0,0,0.4))`,
                            color: asset.dotColor,
                          }}
                        >
                          {asset.coin[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{asset.coin}</p>
                          <p className="text-[11px] text-muted-foreground/50">{asset.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold font-mono text-white tabular-nums">
                          ${asset.value}
                        </span>
                        <span
                          className={`text-[11px] font-semibold tabular-nums ${
                            up ? "text-green-400" : down ? "text-red-400" : "text-muted-foreground/50"
                          }`}
                        >
                          {asset.change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </main>
    </div>
  );
}