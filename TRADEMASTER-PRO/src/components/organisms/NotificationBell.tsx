"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useSignalR } from "@/lib/signalr";
import type { AppNotification } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [user, setUser] = useState(() => getUser());
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const sr = useSignalR();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(getUser()); }, []);

  const load = useCallback(async () => {
    const u = getUser();
    if (!u) return;
    try {
      const data = await api.get<AppNotification[]>(`/api/notifications/user/${u.id}`);
      setItems(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: toast + refresh when a new signal arrives
  useEffect(() => {
    if (!sr) return;
    return sr.onSignal((signal) => {
      toast.success(`New Signal: ${signal.pair}`, {
        description: `${signal.action.toUpperCase()} · Entry ${signal.entryLow}–${signal.entryHigh} · TP1 ${signal.tp1}`,
      });
      load();
    });
  }, [sr, load]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const unread = items.filter((n) => !n.readAt).length;

  async function markRead(n: AppNotification) {
    if (n.readAt) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    try { await api.put(`/api/notifications/${n.id}/read`); } catch { /* ignore */ }
  }

  async function markAll() {
    const unreadItems = items.filter((n) => !n.readAt);
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    await Promise.all(unreadItems.map((n) => api.put(`/api/notifications/${n.id}/read`).catch(() => {})));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col"
            style={{ background: "rgba(10,10,16,0.97)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto custom-scrollbar">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <Inbox className="w-8 h-8 text-white/15 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet.</p>
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.03] ${
                      n.readAt ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.readAt && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <div className={n.readAt ? "pl-3.5" : ""}>
                        <p className="text-sm font-semibold text-white leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.sentAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
