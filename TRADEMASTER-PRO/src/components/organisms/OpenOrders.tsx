"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: number;
  date: string;
  pair: string;
  type: "Limit" | "Market" | "Stop";
  side: "Buy" | "Sell";
  price: string;
  amount: string;
  filled: string; // e.g. "25.00%"
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    date: "2026-06-16 10:45",
    pair: "BTC/USD",
    type: "Limit",
    side: "Buy",
    price: "62,000.00",
    amount: "0.500",
    filled: "0.00%",
  },
  {
    id: 2,
    date: "2026-06-16 09:30",
    pair: "ETH/USD",
    type: "Limit",
    side: "Sell",
    price: "3,600.00",
    amount: "10.00",
    filled: "25.00%",
  },
];

const MOCK_ORDER_HISTORY: Order[] = [
  {
    id: 3,
    date: "2026-06-15 18:12",
    pair: "BTC/USD",
    type: "Market",
    side: "Buy",
    price: "61,500.00",
    amount: "0.250",
    filled: "100.00%",
  },
  {
    id: 4,
    date: "2026-06-15 14:05",
    pair: "SOL/USD",
    type: "Limit",
    side: "Sell",
    price: "145.00",
    amount: "50.00",
    filled: "100.00%",
  },
];

const MOCK_TRADE_HISTORY: Order[] = [
  {
    id: 5,
    date: "2026-06-15 18:13",
    pair: "BTC/USD",
    type: "Market",
    side: "Buy",
    price: "61,498.50",
    amount: "0.250",
    filled: "100.00%",
  },
];

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  { label: "Open Orders", count: 2, data: MOCK_ORDERS },
  { label: "Order History", count: null, data: MOCK_ORDER_HISTORY },
  { label: "Trade History", count: null, data: MOCK_TRADE_HISTORY },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilledBar({ value }: { value: string }) {
  const pct = parseFloat(value);
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute left-0 top-0 h-full rounded-full ${
            pct === 100 ? "bg-green-500" : "bg-primary"
          }`}
        />
      </div>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Clock className="w-8 h-8 opacity-30" />
      <p className="text-sm">No orders found</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OpenOrders() {
  const [activeTab, setActiveTab] = useState(0);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const currentData = activeTab === 0 ? orders : TABS[activeTab].data;

  function handleCancel(id: number) {
    setCancellingId(id);
    // Simulate async cancel
    setTimeout(() => {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setCancellingId(null);
    }, 500);
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
      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5 overflow-x-auto no-scrollbar">
        {TABS.map((tab, i) => {
          const active = activeTab === i;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className="relative flex items-center gap-1.5 px-3 pb-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none"
            >
              <span className={active ? "text-white" : "text-muted-foreground hover:text-white/70"}>
                {tab.label}
              </span>
              {tab.count !== null && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                    active
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {activeTab === 0 ? orders.length : tab.count}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {currentData.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 z-10">
                  <tr
                    style={{
                      background: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {["Date", "Pair", "Type", "Side", "Price (USD)", "Amount", "Filled", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap"
                        >
                          {h === "Price (USD)" ? (
                            <span className="flex items-center gap-1">
                              Price (USD)
                              <ChevronDown className="w-3 h-3 opacity-50" />
                            </span>
                          ) : (
                            h
                          )}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {currentData.map((order, idx) => (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="group border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                          {order.date}
                        </td>

                        {/* Pair */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-white tracking-wide">{order.pair}</span>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-white/60 border border-white/10">
                            {order.type}
                          </span>
                        </td>

                        {/* Side */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
                              order.side === "Buy"
                                ? "text-green-400 bg-green-500/10 border-green-500/20"
                                : "text-red-400 bg-red-500/10 border-red-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                order.side === "Buy" ? "bg-green-400" : "bg-red-400"
                              }`}
                            />
                            {order.side}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 font-mono text-white/90 tabular-nums">
                          {order.price}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 font-mono text-white/80 tabular-nums">
                          {order.amount}
                        </td>

                        {/* Filled */}
                        <td className="px-4 py-3">
                          <FilledBar value={order.filled} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          {activeTab === 0 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancel(order.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-400/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <X className="w-3 h-3" />
                              {cancellingId === order.id ? "Cancelling…" : "Cancel"}
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      {activeTab === 0 && orders.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
          <span className="text-xs text-muted-foreground/60">
            {orders.length} open order{orders.length !== 1 ? "s" : ""}
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOrders([])}
            className="text-xs font-medium text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10"
          >
            Cancel All
          </motion.button>
        </div>
      )}
    </div>
  );
}