"use client";

import {
  createContext, useContext, useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { usePathname } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { getToken, isAuthenticated } from "./auth";
import type { Signal } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5284";

type SignalHandler = (signal: Signal) => void;

interface SignalRContextValue {
  connected: boolean;
  onSignal: (handler: SignalHandler) => () => void;
  joinTeachers: (ids: number[]) => Promise<void>;
}

const Ctx = createContext<SignalRContextValue | null>(null);

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const connRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef<Set<SignalHandler>>(new Set());
  const [connected, setConnected] = useState(false);
  const pathname = usePathname();

  // Stop the connection only when the provider unmounts.
  useEffect(() => {
    return () => {
      connRef.current?.stop();
      connRef.current = null;
    };
  }, []);

  // (Re)establish the connection whenever auth state may have changed.
  useEffect(() => {
    if (!isAuthenticated()) {
      if (connRef.current) {
        connRef.current.stop();
        connRef.current = null;
        setConnected(false);
      }
      return;
    }
    if (connRef.current) return; // already connected / connecting

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/signals`, { accessTokenFactory: () => getToken() ?? "" })
      .withAutomaticReconnect()
      .build();

    connRef.current = conn;

    conn.on("ReceiveSignal", (signal: Signal) => {
      handlersRef.current.forEach((h) => h(signal));
    });
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    conn.start()
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
  }, [pathname]);

  const onSignal = useCallback((handler: SignalHandler) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  const joinTeachers = useCallback(async (ids: number[]) => {
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    for (const id of ids) {
      try { await conn.invoke("JoinTeacherGroup", id.toString()); } catch { /* ignore */ }
    }
  }, []);

  const value = useMemo(
    () => ({ connected, onSignal, joinTeachers }),
    [connected, onSignal, joinTeachers]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSignalR() {
  return useContext(Ctx);
}
