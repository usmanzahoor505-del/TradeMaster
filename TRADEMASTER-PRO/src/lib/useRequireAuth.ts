"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./api";
import { getToken, getUser, saveAuth, isAuthenticated, logout, type AuthUser } from "./auth";

interface MeResponse {
  id: number;
  name: string;
  role: AuthUser["role"];
  tier: string;
}

// Client-side route guard.
//  - Redirects to /auth/login when no token is present.
//  - Refreshes role/tier from the server on every load so a stale or wrong
//    cached role (e.g. an account whose role changed) can never strand a user
//    on the wrong dashboard.
//  - `ready` flips true only once we've confirmed auth, so pages can show a
//    loading state until then.
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    const cached = getUser();
    setUser(cached); // optimistic render from cache

    if (!cached) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fresh = await api.get<MeResponse>(`/api/users/${cached.id}`);
        if (cancelled) return;
        const updated: AuthUser = {
          id: fresh.id,
          name: fresh.name,
          role: fresh.role,
          tier: fresh.tier,
        };
        const token = getToken();
        if (token) saveAuth(token, updated);
        setUser(updated);
      } catch (err) {
        // Token expired / invalid → force re-login.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          logout();
          router.replace("/auth/login");
          return;
        }
        // Network/other error → fall back to cached user.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

  return { user, ready };
}
