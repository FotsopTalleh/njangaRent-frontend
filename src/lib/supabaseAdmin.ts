// src/lib/supabaseAdmin.ts
// Admin-level queries using the Supabase service role key.
// This bypasses the Flask backend entirely — all reads come directly from Supabase.

import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  flaggedListings: number;
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  pendingLandlords: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [listingsRes, usersRes] = await Promise.all([
    supabase.from("listings").select("id, status"),
    supabase.from("users").select("id, role, status"),
  ]);

  if (listingsRes.error) throw new Error(listingsRes.error.message);
  if (usersRes.error) throw new Error(usersRes.error.message);

  const listings = listingsRes.data ?? [];
  const users = usersRes.data ?? [];

  return {
    totalListings:   listings.length,
    activeListings:  listings.filter(l => l.status === "active").length,
    pendingListings: listings.filter(l => l.status === "pending_admin_review").length,
    flaggedListings: listings.filter(l => l.status === "flagged").length,
    totalUsers:      users.length,
    totalLandlords:  users.filter(u => u.role === "landlord").length,
    totalTenants:    users.filter(u => u.role === "tenant" || u.role === "student").length,
    pendingLandlords: users.filter(u => u.role === "landlord" && u.status === "PENDING").length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Listings management
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminListings(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { status, page = 1, limit = 50 } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      hasNext: (count ?? 0) > page * limit,
    },
  };
}

export async function adminApproveListing(id: string) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminFlagListing(id: string, _reason?: string) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "flagged" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminRemoveListing(id: string, _reason?: string) {
  const { error } = await supabase
    .from("listings")
    .update({ status: "deactivated" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// User management
// ─────────────────────────────────────────────────────────────────────────────
export async function getAdminUsers(params: {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { role, status, q, page = 1, limit = 50 } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (role)   query = query.eq("role", role);
  if (status) query = query.eq("status", status);
  if (q)      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, hasNext: (count ?? 0) > page * limit },
  };
}

export async function adminApproveUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "ACTIVE" })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function adminRejectUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "REJECTED" })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function adminBanUser(userId: string) {
  const { error } = await supabase
    .from("users")
    .update({ status: "BANNED" })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// Landlord verifications (PENDING landlords)
// ─────────────────────────────────────────────────────────────────────────────
export async function getLandlordVerifications(page = 1, limit = 20) {
  return getAdminUsers({ role: "landlord", status: "PENDING", page, limit });
}
