"use client";

import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { Zap, ShieldCheck, Coins, LucideIcon } from "lucide-react";

type Accent = "primary" | "green";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  accent: Accent;
  stat: string;
  statLabel: string;
}

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: "Zero Latency",
    accent: "primary",
    description: (
      <>
        Execute trades in microseconds. Our proprietary matching engine
        processes over{" "}
        <span className="font-mono text-white/90">1,000,000</span> orders per
        second.
      </>
    ),
    stat: "1M+",
    statLabel: "orders / sec",
  },
  {
    icon: ShieldCheck,
    title: "Military Security",
    accent: "green",
    description: (
      <>
        <span className="font-mono text-white/90">100%</span> cold storage
        for user funds, hardware security keys, multi-sig wallets, and
        advanced DDoS protection.
      </>
    ),
    stat: "100%",
    statLabel: "cold storage",
  },
  {
    icon: Coins,
    title: "Deep Liquidity",
    accent: "primary",
    description: (
      <>
        Access massive order books across{" "}
        <span className="font-mono text-white/90">150+</span> spot and
        derivative pairs with the lowest fee structure in the industry.
      </>
    ),
    stat: "150+",
    statLabel: "trading pairs",
  },
];

const ACCENT_STYLES: Record<
  Accent,
  {
    iconBg: string;
    iconText: string;
    iconGlow: string;
    border: string;
    spotlight: string;
  }
> = {
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    iconGlow: "group-hover:shadow-[0_0_28px_rgba(79,70,229,0.35)]",
    border: "hover:border-primary/30",
    spotlight: "rgba(99,102,241,0.14)",
  },
  green: {
    iconBg: "bg-green-500/10",
    iconText: "text-green-500",
    iconGlow: "group-hover:shadow-[0_0_28px_rgba(34,197,94,0.3)]",
    border: "hover:border-green-500/30",
    spotlight: "rgba(34,197,94,0.12)",
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const styles = ACCENT_STYLES[feature.accent];
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, ${styles.spotlight}, transparent 70%)`;

  const Icon = feature.icon;

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      whileHover={
        reduceMotion
          ? undefined
          : { y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
      }
      className={`group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 transition-colors duration-300 cursor-default ${styles.border}`}
    >
      {/* Mouse-tracking spotlight glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${styles.iconBg} ${styles.iconText} ${styles.iconGlow}`}
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>

      <h3 className="relative z-10 text-2xl font-bold text-white tracking-tight">
        {feature.title}
      </h3>

      <p className="relative z-10 text-sm leading-relaxed text-muted-foreground">
        {feature.description}
      </p>

      <div className="relative z-10 mt-auto flex items-baseline gap-2 border-t border-white/5 pt-5">
        <span className="font-mono text-2xl font-bold text-white">
          {feature.stat}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {feature.statLabel}
        </span>
      </div>
    </motion.div>
  );
}

export function BentoFeatures() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
      <div className="mb-16 text-center">
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Built for the <span className="text-gradient">Professionals</span>
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Everything you need to execute complex strategies with confidence,
          speed, and absolute security.
        </p>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </motion.div>
    </section>
  );
}