// ─────────────────────────────────────────────────────────────────────────────
// TRADEMASTER PRO — Framer Motion Variants Library
// ─────────────────────────────────────────────────────────────────────────────

import { Transition, Variants } from "framer-motion";

// ─── Transitions ──────────────────────────────────────────────────────────────

export const TRANSITION_SNAPPY: Transition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1],
};

export const TRANSITION_SMOOTH: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

export const TRANSITION_SPRING: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

export const TRANSITION_SPRING_SLOW: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 1,
};

export const TRANSITION_BOUNCE: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 20,
  mass: 0.6,
};

// ─── Fade Variants ────────────────────────────────────────────────────────────

/** Simple opacity fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION_SMOOTH },
  exit:   { opacity: 0, transition: TRANSITION_SNAPPY },
};

/** Fade + rise up — cards, sections, panels */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_SMOOTH },
  exit:   { opacity: 0, y: 12, transition: TRANSITION_SNAPPY },
};

/** Fade + drop down — dropdowns, tooltips */
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: TRANSITION_SMOOTH },
  exit:   { opacity: 0, y: -8, transition: TRANSITION_SNAPPY },
};

/** Fade + subtle left shift */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_SMOOTH },
  exit:   { opacity: 0, x: 8,  transition: TRANSITION_SNAPPY },
};

/** Fade + subtle right shift */
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_SMOOTH },
  exit:   { opacity: 0, x: -8, transition: TRANSITION_SNAPPY },
};

// ─── Slide Variants ───────────────────────────────────────────────────────────

/** Slide in from right — order form, trade panel */
export const slideInRight: Variants = {
  hidden: { x: 60,  opacity: 0 },
  visible: { x: 0,  opacity: 1, transition: TRANSITION_SPRING },
  exit:   { x: 40,  opacity: 0, transition: TRANSITION_SNAPPY },
};

/** Slide in from left — sidebar, history panel */
export const slideInLeft: Variants = {
  hidden: { x: -60, opacity: 0 },
  visible: { x: 0,  opacity: 1, transition: TRANSITION_SPRING },
  exit:   { x: -40, opacity: 0, transition: TRANSITION_SNAPPY },
};

/** Slide up from bottom — mobile sheets, toasts */
export const slideUp: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0,     opacity: 1, transition: TRANSITION_SPRING },
  exit:   { y: "100%", opacity: 0, transition: TRANSITION_SNAPPY },
};

/** Slide down from top — banners, alerts */
export const slideDown: Variants = {
  hidden: { y: "-100%", opacity: 0 },
  visible: { y: 0,      opacity: 1, transition: TRANSITION_SPRING },
  exit:   { y: "-100%", opacity: 0, transition: TRANSITION_SNAPPY },
};

// ─── Scale Variants ───────────────────────────────────────────────────────────

/** Scale in — modals, popups, context menus */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1,    transition: TRANSITION_SPRING },
  exit:   { opacity: 0, scale: 0.95,  transition: TRANSITION_SNAPPY },
};

/** Scale in with bounce — success states, badges, notifications */
export const scaleBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1,   transition: TRANSITION_BOUNCE },
  exit:   { opacity: 0, scale: 0.8,  transition: TRANSITION_SNAPPY },
};

/** Scale + fade — price tickers, live values */
export const scalePulse: Variants = {
  hidden:  { opacity: 0.6, scale: 0.97 },
  visible: { opacity: 1,   scale: 1,    transition: TRANSITION_SNAPPY },
};

// ─── Stagger Containers ───────────────────────────────────────────────────────

/** Standard stagger — grids, lists, stat cards */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/** Fast stagger — table rows, order book entries */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0,
    },
  },
};

/** Slow stagger — hero sections, onboarding */
export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// ─── Page Transitions ─────────────────────────────────────────────────────────

/** Full page enter/exit */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...TRANSITION_SMOOTH, duration: 0.5 },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { ...TRANSITION_SNAPPY, duration: 0.2 },
  },
};

/** Tab content swap */
export const tabContent: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: TRANSITION_SNAPPY },
  exit:   { opacity: 0, x:  8, transition: { duration: 0.15 } },
};

// ─── Trading-Specific Variants ────────────────────────────────────────────────

/** Price tick — green flash on price update */
export const priceTick: Variants = {
  idle:    { color: "inherit",   scale: 1    },
  up:      { color: "#22c55e",   scale: 1.04, transition: TRANSITION_SNAPPY },
  down:    { color: "#ef4444",   scale: 0.97, transition: TRANSITION_SNAPPY },
  settled: { color: "inherit",   scale: 1,    transition: { duration: 0.8 } },
};

/** Order book row — new order flash */
export const orderRow: Variants = {
  hidden: { opacity: 0, x: -4, backgroundColor: "rgba(99,102,241,0)" },
  visible: {
    opacity: 1,
    x: 0,
    backgroundColor: ["rgba(99,102,241,0.15)", "rgba(99,102,241,0)"],
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: { opacity: 0, x: 4, transition: { duration: 0.2 } },
};

/** Trade success checkmark */
export const successPop: Variants = {
  hidden:  { scale: 0,   opacity: 0, rotate: -45 },
  visible: {
    scale: 1,   opacity: 1, rotate: 0,
    transition: TRANSITION_BOUNCE,
  },
  exit:    { scale: 0.8, opacity: 0, transition: TRANSITION_SNAPPY },
};

/** Toast / notification slide in */
export const toastVariant: Variants = {
  hidden:  { opacity: 0, x: 80,  scale: 0.95 },
  visible: { opacity: 1, x: 0,   scale: 1,   transition: TRANSITION_SPRING },
  exit:    { opacity: 0, x: 80,  scale: 0.95, transition: TRANSITION_SNAPPY },
};

/** Chart / widget reveal */
export const chartReveal: Variants = {
  hidden:  { opacity: 0, scaleX: 0, originX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { ...TRANSITION_SMOOTH, duration: 0.8 },
  },
};

/** Skeleton shimmer wrapper */
export const shimmer: Variants = {
  hidden:  { opacity: 0.4 },
  visible: {
    opacity: [0.4, 0.8, 0.4],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─── Hover / Tap Gestures (use directly on motion elements) ──────────────────

export const hoverLift = {
  whileHover: { y: -2, scale: 1.01, transition: TRANSITION_SNAPPY },
  whileTap:   { y:  0, scale: 0.97, transition: TRANSITION_SNAPPY },
};

export const hoverGlow = {
  whileHover: { scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.4)", transition: TRANSITION_SNAPPY },
  whileTap:   { scale: 0.97, transition: TRANSITION_SNAPPY },
};

export const hoverScale = {
  whileHover: { scale: 1.05, transition: TRANSITION_SNAPPY },
  whileTap:   { scale: 0.95, transition: TRANSITION_SNAPPY },
};

export const hoverBounce = {
  whileHover: { scale: 1.08, transition: TRANSITION_BOUNCE },
  whileTap:   { scale: 0.92, transition: TRANSITION_SNAPPY },
};

// ─── Utility: Custom Delay Wrapper ────────────────────────────────────────────

export const withDelay = (variant: Variants, delay: number): Variants => ({
  ...variant,
  visible: {
    ...(variant.visible as object),
    transition: {
      ...((variant.visible as { transition?: object })?.transition ?? {}),
      delay,
    },
  },
});

export const withDuration = (variant: Variants, duration: number): Variants => ({
  ...variant,
  visible: {
    ...(variant.visible as object),
    transition: {
      ...((variant.visible as { transition?: object })?.transition ?? {}),
      duration,
    },
  },
});