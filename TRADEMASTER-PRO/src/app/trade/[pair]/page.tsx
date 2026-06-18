"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { TradeHeader } from "@/components/organisms/TradeHeader";
import { OrderBook } from "@/components/organisms/OrderBook";
import { AdvancedChart } from "@/components/organisms/AdvancedChart";
import { OpenOrders } from "@/components/organisms/OpenOrders";
import { TickerTape } from "@/components/organisms/TickerTape";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TradingDashboard({
  params,
}: {
  params: { pair: string };
}) {
  const currentPair = params.pair || "BTC-USD";

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      {/*
        72px shrink-0 shell reserves space so the fixed Navbar doesn't
        overlap the content below — same pattern as before.
      */}
      <div className="h-[72px] shrink-0 relative z-50">
        <Navbar />
      </div>

      {/* ── Ticker Tape ──────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <TickerTape />
      </div>

      {/* ── Trade Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <TradeHeader pair={currentPair} />
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      {/*
        gap-1 + p-1 keep the thin dark seams between panels that give the
        dashboard a multi-pane terminal feel without heavy borders.
      */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-1 p-1 overflow-hidden min-h-0">

        {/* Left — Order Book (3 cols) */}
        <div className="hidden lg:flex flex-col lg:col-span-3 min-h-0 overflow-hidden">
          <OrderBook />
        </div>

        {/* Center/Right — Chart + Open Orders (9 cols, buy/sell form removed) */}
        <div className="flex flex-col gap-1 lg:col-span-9 min-h-0 overflow-hidden">
          {/* Chart takes remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AdvancedChart />
          </div>
          {/* Open Orders — fixed height */}
          <div className="h-64 shrink-0 overflow-hidden">
            <OpenOrders />
          </div>
        </div>

      </div>

      {/* ── Mobile Bottom Bar ─────────────────────────────────────────────
          On small screens the sidebar panels are hidden. Show quick-access
          tabs so mobile users can still switch between Chart / Book / Form.
      ──────────────────────────────────────────────────────────────────── */}
      <nav
        className="lg:hidden shrink-0 flex items-center justify-around border-t border-white/5 py-3 px-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        aria-label="Mobile navigation"
      >
        {["Chart", "Order Book"].map((label) => (
          <button
            key={label}
            className="flex flex-col items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-white transition-colors px-4 py-1"
          >
            <span
              className={`w-1 h-1 rounded-full ${
                label === "Chart" ? "bg-primary" : "bg-transparent"
              }`}
            />
            {label}
          </button>
        ))}
      </nav>

    </div>
  );
}