// src/api/admin.api.ts — NjangaRent admin endpoints
import { axiosClient } from "./axiosClient";

export interface AdminStats {
  activeListings: number;
  pendingVerifications: number;
  pendingLandlords: number;
  pendingStudents: number;
  activeUsers: number;
  paymentsThisMonthXaf: number;
  paymentsThisMonth: number;
  flaggedListings: number;
}

export interface PaginatedAdmin<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; hasNext: boolean };
}

export const adminApi = {
  /** Dashboard aggregate stats. */
  getDashboard: async (): Promise<AdminStats> => {
    const res = await axiosClient.get("/admin/dashboard");
    return res.data.data ? res.data.data : res.data;
  },

  // ── Verification queues ────────────────────────────────────────────────────
  getLandlordVerifications: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedAdmin<Record<string, unknown>>> => {
    const res = await axiosClient.get("/admin/verifications/landlords", {
      params: { page, limit },
    });
    return res.data;
  },

  getStudentVerifications: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedAdmin<Record<string, unknown>>> => {
    const res = await axiosClient.get("/admin/verifications/students", {
      params: { page, limit },
    });
    return res.data;
  },

  approveUser: async (userId: string, note?: string): Promise<void> => {
    await axiosClient.put(`/admin/verifications/${userId}/approve`, { note });
  },

  rejectUser: async (userId: string, reason: string): Promise<void> => {
    await axiosClient.put(`/admin/verifications/${userId}/reject`, { reason });
  },

  // ── Listing moderation ─────────────────────────────────────────────────────
  getListings: async (
    params?: { status?: string; page?: number; limit?: number },
  ): Promise<PaginatedAdmin<Record<string, unknown>>> => {
    const res = await axiosClient.get("/admin/listings", { params });
    return res.data;
  },

  approveListing: async (listingId: string): Promise<void> => {
    await axiosClient.put(`/admin/listings/${listingId}/approve`);
  },

  flagListing: async (listingId: string, reason: string): Promise<void> => {
    await axiosClient.put(`/admin/listings/${listingId}/flag`, { reason });
  },

  removeListing: async (listingId: string, reason: string): Promise<void> => {
    await axiosClient.put(`/admin/listings/${listingId}/remove`, { reason });
  },

  // ── User management ────────────────────────────────────────────────────────
  getUsers: async (
    params?: { q?: string; page?: number; limit?: number },
  ): Promise<{ data: Record<string, unknown>[] }> => {
    const res = await axiosClient.get("/admin/users", { params });
    return res.data;
  },

  banUser: async (userId: string, reason: string): Promise<void> => {
    await axiosClient.put(`/admin/users/${userId}/ban`, { reason });
  },

  unbanUser: async (userId: string): Promise<void> => {
    await axiosClient.put(`/admin/users/${userId}/unban`);
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  getPayments: async (
    params?: { status?: string; page?: number; limit?: number },
  ): Promise<PaginatedAdmin<Record<string, unknown>>> => {
    const res = await axiosClient.get("/admin/payments", { params });
    return res.data;
  },

  // ── Messages audit ─────────────────────────────────────────────────────────
  getMessages: async (
    params?: { page?: number; limit?: number },
  ): Promise<{ data: Record<string, unknown>[] }> => {
    const res = await axiosClient.get("/admin/messages", { params });
    return res.data;
  },
};
