// src/api/listings.api.ts — NjangaRent listing endpoints
import { axiosClient } from "./axiosClient";

export interface ListingLocation {
  lat: number;
  lng: number;
  displayAddress: string;
}

export type ListingPropertyType =
  | "studio" | "single_room" | "self_contained" | "apartment" | "hostel_block";

export type ListingRentPeriod = "monthly" | "termly" | "yearly";

export type ListingStatus =
  | "draft" | "pending_admin_review" | "active" | "rejected" | "deactivated" | "flagged";

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: ListingPropertyType;
  rentAmount: number;
  rentPeriod: ListingRentPeriod;
  availableFrom: string;
  amenities: string[];
  rules?: string;
  maxOccupants: number;
  exteriorImages: string[];
  roomImages: string[];
  location: ListingLocation;
  distanceFromUbKm: number | null;
  status: ListingStatus;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrowseListingsParams {
  page?: number;
  limit?: number;
  propertyType?: ListingPropertyType;
  minRent?: number;
  maxRent?: number;
  amenities?: string;
  maxDistanceKm?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "closest";
}

export interface PaginatedListings {
  data: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export const listingsApi = {
  /** Public: browse all active listings with optional filters. */
  browse: async (params: BrowseListingsParams = {}): Promise<PaginatedListings> => {
    const res = await axiosClient.get("/listings", { params });
    return res.data;
  },

  /** Public: get single listing detail. */
  getById: async (listingId: string): Promise<{ data: Listing }> => {
    const res = await axiosClient.get(`/listings/${listingId}`);
    return res.data;
  },

  /** Landlord: create a new listing with multipart form data. */
  create: async (
    formData: FormData,
    onProgress?: (pct: number) => void,
  ): Promise<{ data: Listing }> => {
    const res = await axiosClient.post("/listings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return res.data;
  },

  /** Landlord: update listing fields (can include new images). */
  update: async (
    listingId: string,
    formData: FormData,
    onProgress?: (pct: number) => void,
  ): Promise<{ data: Listing }> => {
    const res = await axiosClient.put(`/listings/${listingId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return res.data;
  },

  /** Landlord: deactivate own listing. */
  deactivate: async (listingId: string): Promise<void> => {
    await axiosClient.delete(`/listings/${listingId}`);
  },

  /** Landlord: own listings (all statuses). */
  getMyListings: async (status?: ListingStatus): Promise<{ data: Listing[] }> => {
    const res = await axiosClient.get("/listings/my", { params: status ? { status } : {} });
    return res.data;
  },
};
