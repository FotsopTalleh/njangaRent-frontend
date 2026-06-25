import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "landlord" | "student" | "tenant" | "admin";
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "BANNED";

export interface User {
  id: string;
  name: string;       // mapped from backend's fullName
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  // student-only
  university?: string;
  program?: string;
  matricNumber?: string;
}

/** Map each role to its dashboard route. */
export function dashboardForRole(role: UserRole): string {
  switch (role) {
    case "landlord": return "/landlord/dashboard";
    case "student":  return "/student/dashboard";
    case "tenant":   return "/student/dashboard"; // tenants map to student dashboard
    case "admin":    return "/admin/dashboard";
  }
}

interface AuthState {
  user: User | null;
  /** True only while Clerk confirms an active session. */
  sessionActive: boolean;
  // ── Actions ────────────────────────────────────────────────────────────────
  setUser: (user: User) => void;
  setSessionActive: (active: boolean) => void;
  clearSession: () => void;
  // ── Deprecated compat shims ────────────────────────────────────────────────
  /** @deprecated — Clerk manages tokens per-request now. */
  accessToken: string | null;
  /** @deprecated — use setUser */
  setAuth: (user: User, accessToken: string) => void;
  /** @deprecated — tokens are managed by Clerk */
  setAccessToken: (token: string) => void;
  /** @deprecated — use clearSession */
  logout: () => void;
  /** @deprecated */
  token: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:          null,
      sessionActive: false,
      accessToken:   null,
      get token()    { return null; }, // tokens are managed by Clerk, not stored

      setUser: (user) => set({ user }),
      setSessionActive: (active) => set({ sessionActive: active }),
      clearSession: () => set({ user: null, sessionActive: false, accessToken: null }),

      // ── Deprecated compat shims ──────────────────────────────────────────
      setAuth: (user, _accessToken) => set({ user, sessionActive: true, accessToken: null }),
      setAccessToken: (_token) => { /* no-op: Clerk handles tokens */ },
      logout: () => set({ user: null, sessionActive: false, accessToken: null }),
    }),
    {
      name: "njangrent-auth",
      // Only persist user data, not session state (Clerk is source of truth)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
