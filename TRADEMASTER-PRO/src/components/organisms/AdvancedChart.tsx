"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Maximize2, Settings2 } from "lucide-react";

const generateChartData = () => {
  let basePrice = 64000;
  return Array.from({ length: 100 }).map((_, i) => {
    basePrice = basePrice + (Math.random() * 400 - 180);
    return { time: `1${i}:00`, price: Number(basePrice.toFixed(2)) };
  });
};

const TIMEFRAMES = ["15m", "1H", "4H", "1D", "1W", "1M"];

const COLOR_UP = "#22c55e";
const COLOR_DOWN = "#ef4444";

const formatPrice = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl px-3 py-2 shadow-2xl shadow-black/60">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
        {label}
      </p>
      <p className="text-sm font-mono font-semibold text-white">
        ${formatPrice(payload[0].value)}
      </p>
    </div>
  );
}

export function AdvancedChart() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState("1D");

  useEffect(() => {
    setData(generateChartData());
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const open = data[0].price;
    const close = data[data.length - 1].price;
    const high = Math.max(...data.map((d) => d.price));
    const low = Math.min(...data.map((d) => d.price));
    const change = close - open;
    const changePercent = (change / open) * 100;
    return { open, close, high, low, change, changePercent, isUp: change >= 0 };
  }, [data]);

  if (!mounted || !stats) {
    return (
      <div className="flex flex-col h-full w-full bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="h-7 w-56 rounded-md bg-white/5 animate-pulse" />
          <div className="h-7 w-72 rounded-md bg-white/5 animate-pulse" />
        </div>
        <div className="flex-1 p-4">
          <div className="h-full w-full rounded-lg bg-white/[0.02] animate-pulse" />
        </div>
      </div>
    );
  }

  const lineColor = stats.isUp ? COLOR_UP : COLOR_DOWN;

  return (
    <div className="flex flex-col h-full w-full bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        {/* Timeframe selector */}
        <div className="relative flex items-center gap-1 p-1 rounded-lg bg-black/20">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`relative px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-colors duration-200 ${
                activeTimeframe === tf
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTimeframe === tf && (
                <motion.div
                  layoutId="timeframe-pill"
                  className="absolute inset-0 -z-10 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_14px_rgba(79,70,229,0.45)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tf}</span>
            </button>
          ))}
        </div>

        {/* Stats cluster */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-green-500"
                animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.9, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            Live
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-zinc-500">
              O <span className="text-zinc-300">{formatPrice(stats.open)}</span>
            </span>
            <span className="text-zinc-500">
              H <span className="text-zinc-300">{formatPrice(stats.high)}</span>
            </span>
            <span className="text-zinc-500">
              L <span className="text-zinc-300">{formatPrice(stats.low)}</span>
            </span>
            <span className="text-zinc-500">
              C{" "}
              <span className={stats.isUp ? "text-green-500" : "text-red-500"}>
                {formatPrice(stats.close)}
              </span>
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[11px] font-semibold ${
              stats.isUp
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {stats.isUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {stats.isUp ? "+" : ""}
            {stats.changePercent.toFixed(2)}%
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full h-full p-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTimeframe}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 58, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.04} />
                <XAxis dataKey="time" hide />
                <YAxis domain={["dataMin - 100", "dataMax + 100"]} hide />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#52525b", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <ReferenceLine
                  y={stats.close}
                  stroke={lineColor}
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                  label={{
                    value: formatPrice(stats.close),
                    position: "right",
                    fill: lineColor,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}