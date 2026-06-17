"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  matchPrefix: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/markets", label: "Markets", matchPrefix: "/markets" },
  { href: "/trade/BTC-USD", label: "Trade", matchPrefix: "/trade" },
  { href: "/portfolio", label: "Portfolio", matchPrefix: "/portfolio" },
];

const panelVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -16, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Defensive close on route change — covers browser back/forward too,
  // not just clicks on a Link (which already close it via onClick below).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Subtle elevation once the page scrolls past the hero
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = useCallback(
    (link: NavLink) => pathname === link.href || pathname.startsWith(link.matchPrefix),
    [pathname]
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div
          className={`max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between transition-shadow duration-300 ${
            isScrolled ? "shadow-2xl shadow-black/50" : ""
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 group-hover:neon-glow transition-all duration-300">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              TRADE<span className="text-primary">MASTER</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              return (
                <Link key={link.href} href={link.href} className="relative px-3 py-2 rounded-lg">
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors ${
                      active ? "text-white" : "hover:text-white"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:opacity-80 transition-opacity" />
                <span className="relative z-10">Get Started</span>
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden text-white p-1 -mr-1"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-panel"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Backdrop + Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="panel"
              id="mobile-nav-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-24 left-6 right-6 z-40 glass p-6 rounded-2xl flex flex-col gap-4 md:hidden border border-white/10 shadow-2xl"
            >
              {NAV_LINKS.map((link) => (
                <motion.div key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block text-lg font-bold transition-colors ${
                      isActive(link) ? "text-primary" : "text-white hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div variants={itemVariants}>
                <hr className="border-white/10 my-2" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block text-lg font-bold text-white hover:text-primary"
                >
                  Log In
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                  <button className="w-full py-3 mt-2 text-center text-sm font-bold text-white bg-primary rounded-xl">
                    Get Started
                  </button>
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}