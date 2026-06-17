"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, Settings2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderRow {
  price: string;
  amount: string;
  total: string;
  depth: number;
}

type Precision = "0.01" | "0.1" | "1.0";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOrders = (type: "ask" | "bid", basePrice: number): OrderRow[] => {
  return Array.from({ length: 16 }).map((_, i) => {
    const price = type === "ask" ? basePrice + i * 2.5 : basePrice - i * 2.5;
    const amount = (Math.random() * 2 + 0.01).toFixed(3);
    const total = (price * Number(amount)).toFixed(2);
    const depth = Math.floor(Math.random() * 75) + 10;
    return { price: price.toFixed(2), amount, total, depth };
  }).sort((a, b) =>
    type === "ask"
      ? parseFloat(b.price) - parseFloat(a.price)
      : parseFloat(b.price) - parseFloat(a.price)
  );
};

// ─── Row Component ────────────────────────────────────────────────────────────

function OrderRow({
  row,
  side,
  flash,
}: {
  row: OrderRow;
  side: "ask" | "bid";
  flash: boolean;
}) {
  const isAsk = side === "ask";
  const depthColor = isAsk ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
  const flashColor = isAsk ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)";
  const priceClass = isAsk ? "text-red-400" : "text-green-400";

  return (
    <div className="relative grid grid-cols-3 px-4 py-[3px] text-[11.5px] font-mono hover:bg-white/[0.04] cursor-pointer group transition-colors select-none">
      {/* Depth bar */}
      <div
        className="absolute right-0 top-0 bottom-0 transition-all duration-500"
        style={{
          width: `${row.depth}%`,
          background: flash ? flashColor : depthColor,
        }}
      />
      <span className={`relative z-10 tabular-nums font-semibold ${priceClass}`}>
        {row.price}
      </span>
      <span className="relative z-10 text-right text-white/75 tabular-nums">
        {row.amount}
      </span>
      <span className="relative z-10 text-right text-muted-foreground/60 tabular-nums group-hover:text-white/50 transition-colors">
        {row.total}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PRECISIONS: Precision[] = ["0.01", "0.1", "1.0"];

export function OrderBook() {
  const [mounted, setMounted] = useState(false);
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const [precision, setPrecision] = useState<Precision>("0.1");
  const [showPrecision, setShowPrecision] = useState(false);
  const [flashSet, setFlashSet] = useState<Set<string>>(new Set());
  const [spreadDir, setSpreadDir] = useState<"up" | "down">("down");
  const prevAsks = useRef<OrderRow[]>([]);

  const SPREAD_PRICE = 64230.5;
  const MARK_PRICE = 64235.0;

  useEffect(() => {
    const fresh = generateOrders("ask", 64235.5);
    const freshBids = generateOrders("bid", 64230.0);
    setAsks(fresh);
    setBids(freshBids);
    prevAsks.current = fresh;
    setMounted(true);

    const interval = setInterval(() => {
      const newAsks = generateOrders("ask", 64235.5);
      const newBids = generateOrders("bid", 64230.0);

      // Detect changed prices for flash effect
      const changed = new Set<string>();
      newAsks.forEach((row, i) => {
        if (prevAsks.current[i]?.amount !== row.amount) changed.add(`ask-${i}`);
      });
      setFlashSet(changed);
      setTimeout(() => setFlashSet(new Set()), 400);

      setSpreadDir((d) => (d === "up" ? "down" : "up"));
      setAsks(newAsks);
      setBids(newBids);
      prevAsks.current = newAsks;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-full h-full rounded-2xl border border-white/10 animate-pulse"
        style={{ background: "rgba(255,255,255,0.03)" }}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/10"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-white tracking-wide">Order Book</h3>

        {/* Precision Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPrecision((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg"
          >
            <Settings2 className="w-3 h-3" />
            {precision}
          </button>
          <AnimatePresence>
            {showPrecision && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-1 z-20 flex flex-col rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(16px)" }}
              >
                {PRECISIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPrecision(p); setShowPrecision(false); }}
                    className={`px-4 py-2 text-xs font-mono text-left transition-colors hover:bg-white/5 ${
                      p === precision ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Column Headers ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        <span>Price (USD)</span>
        <span className="text-right">Amount (BTC)</span>
        <span className="text-right">Total</span>
      </div>

      {/* ── Asks (Sells) ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden justify-end">
        {asks.map((ask, i) => (
          <OrderRow
            key={`ask-${i}`}
            row={ask}
            side="ask"
            flash={flashSet.has(`ask-${i}`)}
          />
        ))}
      </div>

      {/* ── Spread Bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-y border-white/5"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            key={spreadDir}
            initial={{ opacity: 0, y: spreadDir === "down" ? -6 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-xl font-bold tabular-nums ${
              spreadDir === "down" ? "text-green-400" : "text-red-400"
            }`}
          >
            {SPREAD_PRICE.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </motion.span>
          <motion.span
            key={`icon-${spreadDir}`}
            initial={{ rotate: spreadDir === "down" ? -90 : 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {spreadDir === "down" ? (
              <ArrowDown className="w-4 h-4 text-green-400" />
            ) : (
              <ArrowUp className="w-4 h-4 text-red-400" />
            )}
          </motion.span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Mark</span>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {MARK_PRICE.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ── Bids (Buys) ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {bids.map((bid, i) => (
          <OrderRow
            key={`bid-${i}`}
            row={bid}
            side="bid"
            flash={false}
          />
        ))}
      </div>
    </div>
  );
}