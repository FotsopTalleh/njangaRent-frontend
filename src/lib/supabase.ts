// src/lib/supabase.ts
// Direct Supabase client — bypasses Flask backend, reads/writes Supabase directly.
// Uses service-role key until RLS policies are added for anon reads on listings.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
// Prefer service key (bypasses RLS) but fall back to anon key so the client is always functional
const SUPABASE_KEY  = (
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "[supabase] ⚠ VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY is missing.\n" +
    "Add them to your .env file and restart the dev server.",
  );
}

// Always create a real client — surfaces actual Supabase errors instead of a generic stub message
export const supabase = createClient(
  SUPABASE_URL  ?? "https://placeholder.supabase.co",
  SUPABASE_KEY  ?? "placeholder-key",
);

// ── DB column → frontend field normaliser ─────────────────────────────────────
// The DB uses snake_case; the frontend uses camelCase.
export function normaliseListing(row: any) {
  return {
    id:               row.id,
    landlordId:       row.landlord_id,   // camelCase used in forms/state
    landlord_id:      row.landlord_id,   // kept raw for startChat compat
    title:            row.title,
    description:      row.description,
    propertyType:     row.property_type,
    rentAmount:       row.rent_amount,
    rentPeriod:       row.rent_period,
    availableFrom:    row.available_from,
    amenities:        Array.isArray(row.amenities) ? row.amenities : [],
    rules:            row.rules ?? "",
    maxOccupants:     row.max_occupants ?? 1,
    exteriorImages:   Array.isArray(row.exterior_images) ? row.exterior_images : [],
    roomImages:       Array.isArray(row.room_images) ? row.room_images : [],
    // location object for map / address display
    location: {
      lat:            row.lat ?? null,
      lng:            row.lng ?? null,
      displayAddress: row.display_address ?? "",
    },
    // Flat copies for convenience in map/detail rendering
    lat:              row.lat ?? null,
    lng:              row.lng ?? null,
    distanceFromUbKm: row.distance_from_molyko_km ?? null,
    status:           row.status,
    viewsCount:       row.views_count ?? 0,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

// ── Listings queries ───────────────────────────────────────────────────────────
export const supabaseListings = {

  /** Browse active listings (supports property type + rent range filters). */
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
    if (params.minRent != null) {
      query = query.gte("rent_amount", params.minRent);
    }
    if (params.maxRent != null) {
      query = query.lte("rent_amount", params.maxRent);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(normaliseListing);
  },

  /** Get a single listing by UUID. Throws if not found. */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();            // returns null instead of error when 0 rows

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Listing not found");
    return normaliseListing(data);
  },

  /** Create a new listing — uploads images then inserts the row. */
  create: async (
    payload: {
      landlordId:    string;
      title:         string;
      description:   string;
      propertyType:  string;
      rentAmount:    number;
      rentPeriod:    string;
      availableFrom: string;
      amenities:     string[];
      rules:         string;
      maxOccupants:  number;
      lat?:          number;
      lng?:          number;
      exteriorFiles: File[];
      roomFiles:     File[];
    },
    onProgress?: (pct: number) => void,
  ) => {
    const uploadFile = async (file: File, folder: string): Promise<string> => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw new Error(error.message);

      const { data: pub } = supabase.storage
        .from("listing-images")
        .getPublicUrl(path);

      return pub.publicUrl;
    };

    const total = payload.exteriorFiles.length + payload.roomFiles.length;
    let done = 0;
    const tick = () => {
      done++;
      onProgress?.(Math.round((done / Math.max(total, 1)) * 70));
    };

    const [exteriorImages, roomImages] = await Promise.all([
      Promise.all(payload.exteriorFiles.map(async (f) => { const u = await uploadFile(f, "exterior"); tick(); return u; })),
      Promise.all(payload.roomFiles.map(async (f) => { const u = await uploadFile(f, "rooms"); tick(); return u; })),
    ]);

    onProgress?.(80);

    const { data, error } = await supabase
      .from("listings")
      .insert({
        landlord_id:    payload.landlordId,
        title:          payload.title,
        description:    payload.description,
        property_type:  payload.propertyType,
        rent_amount:    payload.rentAmount,
        rent_period:    payload.rentPeriod,
        available_from: payload.availableFrom,
        amenities:      payload.amenities,
        rules:          payload.rules,
        max_occupants:  payload.maxOccupants,
        lat:            payload.lat ?? null,
        lng:            payload.lng ?? null,
        exterior_images: exteriorImages,
        room_images:    roomImages,
        status:         "pending_admin_review",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    onProgress?.(100);
    return normaliseListing(data);
  },
};
