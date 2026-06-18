"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { HeroSlider } from "@/components/organisms/HeroSlider";
import { TickerTape } from "@/components/organisms/TickerTape";
import { BentoFeatures } from "@/components/organisms/BentoFeatures";
import { TradeHeader } from "@/components/organisms/TradeHeader";
import { OrderBook } from "@/components/organisms/OrderBook";
import { AdvancedChart } from "@/components/organisms/AdvancedChart";
import { RecentPosts } from "@/components/organisms/RecentPosts";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden selection:bg-primary/30">
      {/* Floating Navbar */}
      <Navbar />

      {/* Main Auto-Slider Hero */}
      <HeroSlider />

      {/* Ticker & Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        {/* Built for the Professionals — features first */}
        <BentoFeatures />

        {/* News / Ticker bar */}
        <TickerTape />

        {/* ── Live Trading Dashboard (below the news/ticker section) ───────── */}
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              Live <span className="text-gradient">Trading</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Real-time order book and advanced charting, straight from the
              home screen.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            {/* Trade Header */}
            <TradeHeader pair="BTC-USD" />

            {/* Grid: Order Book + Chart/Open Orders (no buy/sell form) */}
            <div className="grid grid-cols-1 gap-1 p-1 lg:grid-cols-12 h-[560px]">
              {/* Left — Order Book */}
              <div className="hidden lg:flex flex-col lg:col-span-3 min-h-0 overflow-hidden">
                <OrderBook />
              </div>

              {/* Center/Right — Chart (Open Orders moved to student/teacher portal) */}
              <div className="flex flex-col gap-1 lg:col-span-9 min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AdvancedChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent community posts (latest 3) + Explore More */}
        <RecentPosts />
      </motion.div>
    </div>
  );
}
