// src/lib/supabase.ts
// Direct Supabase client — used when Flask backend is unavailable.
// Uses service role key temporarily until RLS policies are added for anon reads.
// TODO: Add Supabase RLS policy: allow anon SELECT on listings WHERE status = 'active'
//       Then switch VITE_SUPABASE_SERVICE_KEY back to VITE_SUPABASE_ANON_KEY below.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// Using service key temporarily — anon key blocked by missing RLS policy for public listing reads
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("[supabase] Missing VITE_SUPABASE_URL or key — direct DB access disabled.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DB column → frontend field normaliser ─────────────────────────────────────
// The DB uses snake_case; the frontend type uses camelCase.
export function normaliseListing(row: any) {
  return {
    id:                  row.id,
    landlordId:          row.landlord_id,
    title:               row.title,
    description:         row.description,
    propertyType:        row.property_type,
    rentAmount:          row.rent_amount,
    rentPeriod:          row.rent_period,
    availableFrom:       row.available_from,
    amenities:           row.amenities ?? [],
    rules:               row.rules,
    maxOccupants:        row.max_occupants,
    exteriorImages:      row.exterior_images ?? [],
    roomImages:          row.room_images ?? [],
    location: {
      lat:            row.lat,
      lng:            row.lng,
      displayAddress: row.display_address ?? "",
    },
    lat:                 row.lat,
    lng:                 row.lng,
    distanceFromUbKm:    row.distance_from_molyko_km ?? null,
    status:              row.status,
    viewsCount:          row.views_count ?? 0,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

// ── Public listings queries ───────────────────────────────────────────────────
export const supabaseListings = {
  /** Browse active listings with optional filters */
  browse: async (params: {
    limit?: number;
    propertyType?: string;
    minRent?: number;
    maxRent?: number;
  } = {}) => {
    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 100);

    if (params.propertyType) {
      query = query.eq("property_type", params.propertyType);
    }
    if (params.minRent) {
      query = query.gte("rent_amount", params.minRent);
    }
    if (params.maxRent) {
      query = query.lte("rent_amount", params.maxRent);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(normaliseListing);
  },

  /** Get a single listing by ID */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return normaliseListing(data);
  },
};
