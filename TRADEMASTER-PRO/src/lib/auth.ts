"use client";

// ─── Auth storage helpers ───────────────────────────────────────────────────
// Lightweight client-side auth: JWT + basic user info kept in localStorage.
// (Phase 1 — good enough for the SPA dashboards. Can move to httpOnly cookies later.)

export interface AuthUser {
  id: number;
  name: string;
  role: "Student" | "Teacher" | "Admin";
  tier?: string;
}

const TOKEN_KEY = "tmp_token";
const USER_KEY = "tmp_user";

export function saveAuth(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Where to send a user right after auth, based on role.
export function homePathForRole(role: string): string {
  switch (role) {
    case "Teacher":
      return "/teacher";
    case "Admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}
