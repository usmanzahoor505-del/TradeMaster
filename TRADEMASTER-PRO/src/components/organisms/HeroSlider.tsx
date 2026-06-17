"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    badge: "Institutional Grade Trading Engine Live",
    title: "Trade with Zero Latency.",
    desc: "Experience the ultimate ultra-premium SaaS platform. Advanced charting, deep liquidity, and military-grade security.",
    cta1: "Start Trading Now",
    link1: "/trade/BTC-USD",
    cta2: "View Markets",
    link2: "/markets",
    gradient: "from-blue-600/20 to-indigo-600/20",
    glow: "bg-primary/20"
  },
  {
    id: 2,
    badge: "Special Anniversary Offer",
    title: "0% Maker Fees on Spot.",
    desc: "Maximize your profits. Trade top cryptocurrencies with absolutely zero maker fees for the next 30 days.",
    cta1: "Claim Offer",
    link1: "/auth/register",
    cta2: "Learn More",
    link2: "/",
    gradient: "from-green-600/20 to-emerald-600/20",
    glow: "bg-green-500/20"
  },
  {
    id: 3,
    badge: "New Feature",
    title: "100x Leverage Futures.",
    desc: "Take your trading to the next level. Deep liquidity and minimal slippage on our new perpetual contracts.",
    cta1: "Trade Futures",
    link1: "/trade/ETH-USD",
    cta2: "Read Guide",
    link2: "/",
    gradient: "from-purple-600/20 to-pink-600/20",
    glow: "bg-purple-500/20"
  }
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);

  // Auto-play slider every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

  return (
    <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pt-20">
      
      {/* Navigation Arrows */}
      <div className="absolute z-50 flex justify-between w-full px-6 md:px-12 pointer-events-none">
        <button onClick={prevSlide} className="p-3 rounded-full glass hover:bg-white/10 pointer-events-auto transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button onClick={nextSlide} className="p-3 rounded-full glass hover:bg-white/10 pointer-events-auto transition-colors">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center justify-center px-6 text-center w-full max-w-5xl"
        >
          {/* Dynamic Background Glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] -z-10 mix-blend-screen transition-colors duration-1000 ${SLIDES[current].glow}`} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-semibold tracking-wide uppercase border rounded-full glass text-white border-white/20"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-white"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-white"></span>
            </span>
            {SLIDES[current].badge}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-4xl text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl"
          >
            {SLIDES[current].title.split('.')[0]}<span className="text-primary">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mt-6 text-lg text-muted-foreground md:text-xl leading-relaxed"
          >
            {SLIDES[current].desc}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col items-center gap-4 mt-12 sm:flex-row"
          >
            <Link href={SLIDES[current].link1}>
              <button className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white transition-all rounded-xl bg-primary hover:bg-blue-600 neon-glow group">
                {SLIDES[current].cta1}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href={SLIDES[current].link2}>
              <button className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white transition-all border rounded-xl glass hover:bg-white/5">
                {SLIDES[current].cta2}
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Indicators (Dots) */}
      <div className="absolute bottom-10 flex gap-3 z-50">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${
              current === idx ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}