import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, Home, BedDouble, Bath, Wifi, ImageIcon, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { axiosClient } from "@/api/axiosClient";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [{ title: "Explore — NjangaRent" }],
  }),
  component: ExplorePage,
});

const FILTERS = ["All", "Studio", "Room", "Self-Contained", "Apartment", "Furnished"];

const FILTER_MAP: Record<string, string> = {
  Studio: "studio",
  Room: "single_room",
  "Self-Contained": "self_contained",
  Apartment: "apartment",
};

function ExplorePage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings", "explore", activeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "50" };
      const mapped = FILTER_MAP[activeFilter];
      if (mapped) params.propertyType = mapped;
      const res = await axiosClient.get("/listings", { params });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const listings = listingsData?.data ?? [];

  return (
    <div style={{ backgroundColor: "#F9F7F2", minHeight: "100vh", paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
      
      {/* Unified Sticky Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        backgroundColor: "#F9F7F2",
        borderBottom: "1px solid #E8E4DC",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        paddingTop: "max(12px, env(safe-area-inset-top))"
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1B4332", lineHeight: 1.2, letterSpacing: "-0.5px" }}>NjangaRent</h1>
            <p style={{ fontSize: 13, color: "#6B6B68", marginTop: 2, fontWeight: 500 }}>Find your home in Buea</p>
          </div>
          <button
            onClick={() => navigate({ to: "/tenant/notifications" })}
            style={{ position: "relative", padding: 8, borderRadius: "50%", backgroundColor: "#FFFFFF", border: "0.5px solid #E8E4DC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Notifications"
          >
            <Bell size={20} color="#1A1A18" />
            <span style={{
              position: "absolute", top: 6, right: 8,
              width: 8, height: 8, borderRadius: 999,
              backgroundColor: "#D4A017",
              border: "2px solid #FFFFFF"
            }} />
          </button>
        </div>

        {/* Filter Chip Bar */}
        <div style={{
          display: "flex", gap: 8, overflowX: "auto",
          padding: "16px 16px 12px", scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0,
                height: 36,
                padding: "0 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: activeFilter === f ? "none" : "1px solid #E8E4DC",
                backgroundColor: activeFilter === f ? "#1B4332" : "#FFFFFF",
                color: activeFilter === f ? "#FFFFFF" : "#1A1A18",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: activeFilter === f ? "0 2px 8px rgba(27, 67, 50, 0.25)" : "none",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Listing Count */}
      {!isLoading && listings.length > 0 && (
        <div style={{ padding: "0 16px 8px", fontSize: 12, color: "#6B6B68" }}>
          {listings.length} listing{listings.length !== 1 ? "s" : ""} in Buea
        </div>
      )}

      {/* Listing Feed */}
      <div style={{ paddingTop: 4 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              border: "0.5px solid #E8E4DC",
              margin: "0 16px 16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}>
              <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#E8E4DC", animation: "pulse 1.5s infinite" }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 18, backgroundColor: "#E8E4DC", borderRadius: 6, width: "65%", marginBottom: 8 }} />
                <div style={{ height: 14, backgroundColor: "#E8E4DC", borderRadius: 6, width: "40%", marginBottom: 12 }} />
                <div style={{ height: 22, backgroundColor: "#E8E4DC", borderRadius: 6, width: "45%" }} />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 88, height: 88, borderRadius: 999,
              backgroundColor: "#EAF4EE",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Home size={36} color="#B7D9C4" />
            </div>
            <p style={{ fontSize: 15, color: "#6B6B68", fontWeight: 500 }}>No listings found.</p>
            <p style={{ fontSize: 13, color: "#A8A8A5" }}>Try a different filter</p>
          </div>
        ) : (
          listings.map((listing: any) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSaved={savedIds.has(listing.id)}
              onToggleSave={(id) => {
                setSavedIds(prev => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  isSaved,
  onToggleSave,
}: {
  listing: any;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const navigate = useNavigate();
  const images = listing.exteriorImages?.length ? listing.exteriorImages : listing.roomImages || [];
  const photoCount = images.length;
  const coverUrl = photoCount > 0 ? (typeof images[0] === "string" ? images[0] : images[0]?.url) : null;
  const isAvailable = listing.status === "active" || !listing.status;
  const isVerified = listing.isVerified || listing.verified;

  // Property type label
  const typeLabels: Record<string, string> = {
    studio: "Studio", single_room: "Room", self_contained: "Self-Contained",
    apartment: "Apartment", furnished: "Furnished"
  };
  const typeLabel = typeLabels[listing.propertyType] || listing.propertyType || "Property";

  return (
    <div
      onClick={() => navigate({ to: "/listing/$id", params: { id: listing.id } })}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        border: "0.5px solid #E8E4DC",
        margin: "0 16px 16px",
        cursor: "pointer",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
      onTouchStart={e => (e.currentTarget.style.transform = "scale(0.98)")}
      onTouchEnd={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Photo */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#EAF4EE" }}>
        {coverUrl ? (
          <img src={coverUrl} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <Home size={32} color="#B7D9C4" />
            <span style={{ fontSize: 11, color: "#B7D9C4" }}>No photo yet</span>
          </div>
        )}

        {/* Verified Badge */}
        {isVerified && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            backgroundColor: "#D4A017", color: "#FFFFFF",
            fontSize: 10, fontWeight: 700,
            padding: "3px 8px", borderRadius: 8
          }}>
            ✓ Verified
          </div>
        )}

        {/* Photo Count Pill */}
        {photoCount > 1 && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            backgroundColor: "rgba(0,0,0,0.55)", color: "#FFFFFF",
            fontSize: 10, padding: "2px 8px", borderRadius: 8,
            display: "flex", alignItems: "center", gap: 4
          }}>
            <ImageIcon size={10} /> {photoCount} photos
          </div>
        )}

        {/* Type label */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          backgroundColor: "rgba(0,0,0,0.45)", color: "#FFFFFF",
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8
        }}>
          {typeLabel}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A18", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listing.title}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <MapPin size={11} color="#A8A8A5" />
              <p style={{ fontSize: 12, color: "#6B6B68", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {listing.location?.displayAddress || "Buea"}
                {listing.distanceFromUbKm ? ` · ${listing.distanceFromUbKm}km from UB` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(listing.id); }}
            style={{ padding: 4, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}
            aria-label="Save listing"
          >
            <Heart
              size={18}
              color={isSaved ? "#D4A017" : "#A8A8A5"}
              fill={isSaved ? "#D4A017" : "none"}
            />
          </button>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1B4332" }}>
              ₣{listing.rentAmount?.toLocaleString() ?? "—"}
            </span>
            <span style={{ fontSize: 12, color: "#6B6B68", marginLeft: 4 }}>/month</span>
          </div>
          {isAvailable && (
            <span style={{
              backgroundColor: "#EAF4EE", color: "#1B4332",
              fontSize: 10, fontWeight: 600,
              padding: "2px 8px", borderRadius: 6
            }}>
              Available
            </span>
          )}
        </div>

        {/* Amenity Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {listing.bedrooms > 0 && (
            <Chip icon={<BedDouble size={10} />} label={`${listing.bedrooms} Bed`} />
          )}
          <Chip icon={<Bath size={10} />} label="Bath" />
          {(listing.amenities?.includes("wifi") || listing.amenities?.includes("Wifi")) && (
            <Chip icon={<Wifi size={10} />} label="WiFi" />
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      backgroundColor: "#F9F7F2",
      border: "0.5px solid #E8E4DC",
      color: "#6B6B68",
      fontSize: 10, fontWeight: 500,
      padding: "3px 7px", borderRadius: 6,
    }}>
      {icon}
      {label}
    </div>
  );
}
