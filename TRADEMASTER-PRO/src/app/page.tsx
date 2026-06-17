"use client";

import { Navbar } from "@/components/organisms/Navbar";
import { HeroSlider } from "@/components/organisms/HeroSlider";
import { TickerTape } from "@/components/organisms/TickerTape";
import { BentoFeatures } from "@/components/organisms/BentoFeatures";
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
        <TickerTape />
        <BentoFeatures />
      </motion.div>
    </div>
  );
}