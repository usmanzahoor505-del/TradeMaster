"use client";

import { useState, useId } from "react";
import { Wallet, CheckCircle2, TrendingUp, TrendingDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderSide = "Buy" | "Sell";
type OrderType = "Limit" | "Market" | "Stop";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_TYPES: OrderType[] = ["Limit", "Market", "Stop"];
const PERCENTAGES = [25, 50, 75, 100];
const AVAILABLE = { Buy: { amount: "45,230.00", unit: "USDT" }, Sell: { amount: "2.45000", unit: "BTC" } };

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  unit,
  value,
  onChange,
  readOnly = false,
  placeholder = "0.00",
}: {
  label: string;
  unit: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-all duration-200 ${
        readOnly
          ? "bg-black/20 border-white/5 opacity-60"
          : "bg-black/30 border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
      }`}
    >
      <span className="text-[11px] font-medium text-muted-foreground/70 w-12 shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <input
        type={readOnly ? "text" : "number"}
        readOnly={readOnly}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 bg-transparent text-right text-sm text-white font-mono outline-none placeholder:text-white/20 cursor-default"
        style={{ cursor: readOnly ? "not-allowed" : "text" }}
      />
      <span className="text-[11px] font-semibold text-muted-foreground/50 ml-1 w-10 text-right shrink-0">
        {unit}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderForm() {
  const [side, setSide] = useState<OrderSide>("Buy");
  const [type, setType] = useState<OrderType>("Limit");
  const [price, setPrice] = useState("64230.50");
  const [amount, setAmount] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastSide, setToastSide] = useState<OrderSide>("Buy");
  const [activePercent, setActivePercent] = useState<number | null>(null);

  const total = amount ? (Number(amount) * Number(price)).toFixed(2) : "";
  const isBuy = side === "Buy";

  function handlePercent(p: number) {
    setActivePercent(p);
    const base = isBuy ? 0.5 : 2.45;
    setAmount(((p / 100) * base).toFixed(4));
  }

  function handleTrade() {
    if (!amount) return;
    setToastSide(side);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setAmount("");
    setActivePercent(null);
  }

  return (
    <div
      className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/10 relative"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-24 left-4 right-4 z-50 p-4 rounded-xl flex items-center gap-3 border"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(16px)",
              borderColor: toastSide === "Buy" ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
              boxShadow: toastSide === "Buy"
                ? "0 0 32px rgba(34,197,94,0.15)"
                : "0 0 32px rgba(239,68,68,0.15)",
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
              style={{
                background: toastSide === "Buy" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              }}
            >
              <CheckCircle2
                className={`w-5 h-5 ${toastSide === "Buy" ? "text-green-400" : "text-red-400"}`}
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Order Placed</p>
              <p className="text-white/40 text-xs mt-0.5">
                {toastSide} order for BTC submitted successfully.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Order Type Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5">
        {ORDER_TYPES.map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="relative pb-3 px-1 mr-3 text-sm font-medium transition-colors focus-visible:outline-none"
            >
              <span className={active ? "text-white" : "text-muted-foreground hover:text-white/70"}>
                {t}
              </span>
              {active && (
                <motion.div
                  layoutId="ordertype-underline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">

        {/* ── Buy / Sell Toggle ──────────────────────────────────────────── */}
        <div
          className="flex p-1 rounded-xl border border-white/5"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          {(["Buy", "Sell"] as OrderSide[]).map((s) => {
            const active = side === s;
            const isBuyBtn = s === "Buy";
            return (
              <button
                key={s}
                onClick={() => { setSide(s); setActivePercent(null); setAmount(""); }}
                className="relative flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 overflow-hidden"
              >
                {active && (
                  <motion.div
                    layoutId="side-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isBuyBtn
                        ? "linear-gradient(135deg, #16a34a, #22c55e)"
                        : "linear-gradient(135deg, #dc2626, #ef4444)",
                      boxShadow: isBuyBtn
                        ? "0 4px 20px rgba(34,197,94,0.25)"
                        : "0 4px 20px rgba(239,68,68,0.25)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center justify-center gap-1.5 ${
                    active ? "text-white" : "text-muted-foreground hover:text-white/70"
                  }`}
                >
                  {active && (isBuyBtn ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />)}
                  {s} BTC
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Available Balance ──────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Wallet className="w-3 h-3" />
            Available
          </span>
          <span className="font-mono text-xs font-semibold text-white/80">
            {AVAILABLE[side].amount}{" "}
            <span className="text-muted-foreground/50">{AVAILABLE[side].unit}</span>
          </span>
        </div>

        {/* ── Inputs ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {type !== "Market" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <InputField
                  label="Price"
                  unit="USDT"
                  value={price}
                  onChange={setPrice}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            label="Amount"
            unit="BTC"
            value={amount}
            onChange={(v) => { setAmount(v); setActivePercent(null); }}
            placeholder="0.0000"
          />
        </div>

        {/* ── Percentage Buttons ─────────────────────────────────────────── */}
        <div className="flex gap-1.5">
          {PERCENTAGES.map((p) => {
            const active = activePercent === p;
            return (
              <button
                key={p}
                onClick={() => handlePercent(p)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  active
                    ? isBuy
                      ? "bg-green-500/15 border-green-500/40 text-green-400"
                      : "bg-red-500/15 border-red-500/40 text-red-400"
                    : "bg-white/[0.03] border-white/8 text-muted-foreground hover:text-white hover:bg-white/8 hover:border-white/15"
                }`}
              >
                {p}%
              </button>
            );
          })}
        </div>

        {/* ── Total ─────────────────────────────────────────────────────── */}
        <InputField
          label="Total"
          unit="USDT"
          value={total || "0.00"}
          readOnly
        />

        {/* ── Fee Estimate ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Est. Fee (0.1%)
          </span>
          <span className="font-mono">
            {total ? `≈ ${(Number(total) * 0.001).toFixed(4)} USDT` : "—"}
          </span>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <motion.button
          whileHover={{ scale: amount ? 1.01 : 1 }}
          whileTap={{ scale: amount ? 0.98 : 1 }}
          onClick={handleTrade}
          disabled={!amount}
          className="w-full py-3.5 rounded-xl font-bold text-base mt-auto relative overflow-hidden transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isBuy
              ? "linear-gradient(135deg, #16a34a, #22c55e)"
              : "linear-gradient(135deg, #dc2626, #ef4444)",
            boxShadow: amount
              ? isBuy
                ? "0 8px 32px rgba(34,197,94,0.3)"
                : "0 8px 32px rgba(239,68,68,0.3)"
              : "none",
          }}
        >
          <span className="relative z-10 text-white tracking-wide">
            {side} BTC
          </span>
        </motion.button>
      </div>
    </div>
  );
}