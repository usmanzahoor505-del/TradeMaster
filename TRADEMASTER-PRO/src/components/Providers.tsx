"use client";

import { SignalRProvider } from "@/lib/signalr";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SignalRProvider>
      {children}
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </SignalRProvider>
  );
}
