// ─── axiosClient.ts — Backend client ──────────────────────────────────────────
// Handles: auth header injection using Clerk, 401 auto-logout

import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach fresh Clerk access token ──────────────────────
axiosClient.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && (window as any).Clerk?.session) {
    try {
      const token = await (window as any).Clerk.session.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Session may have expired — request will proceed without token
      // and the 401 response interceptor below will handle cleanup
    }
  }
  return config;
});

// ── Response interceptor — handle errors & expired sessions ───────────────────
axiosClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ error?: { message?: string; code?: string; field?: string } }>) => {
    const status = error.response?.status;

    // 401 Unauthorized — session expired or token invalid
    if (status === 401) {
      // Sign out of Clerk (which triggers AuthSync to clear store + redirect)
      if (typeof window !== "undefined" && (window as any).Clerk) {
        try {
          await (window as any).Clerk.signOut();
        } catch {
          // If Clerk signOut fails, force-clear our store manually
          const { useAuthStore } = await import("@/store/authStore");
          useAuthStore.getState().clearSession();
          window.location.href = "/login";
        }
      }
    }

    // Normalise error shape to match backend envelope
    const data = error.response?.data?.error;
    return Promise.reject({
      message: data?.message ?? error.message ?? "Something went wrong",
      code: data?.code,
      field: data?.field,
      status,
    });
  }
);
