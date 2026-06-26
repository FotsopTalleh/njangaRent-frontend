import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, Home, BedDouble, Bath, Wifi, ImageIcon, MapPin, LayoutDashboard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { dashboardForRole } from "@/store/authStore";
import { paginateDummyListings } from "@/data/dummyListings";

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
  const user = useAuthStore((s) => s.user);
  const dashboardTo = user ? dashboardForRole(user.role) : "/login";

  const { data: listingsData, isLoading, isError } = useQuery({
    queryKey: ["listings", "explore", activeFilter],
    queryFn: async () => {
      const { supabaseListings } = await import("@/lib/supabase");
      const mapped = FILTER_MAP[activeFilter];
      return supabaseListings.browse({ limit: 100, propertyType: mapped });
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const rawListings: any[] = listingsData || [];
  const listings = rawListings.length === 0
    ? (() => {
        const dummyParams: any = { limit: 100 };
        const mapped = FILTER_MAP[activeFilter];
        if (mapped) dummyParams.propertyType = mapped;
        return paginateDummyListings(dummyParams).data;
      })()
    : rawListings;

  return (
    <div className="min-h-screen bg-background text-foreground pb-[calc(56px+env(safe-area-inset-bottom))]">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border shadow-sm pt-[max(12px,env(safe-area-inset-top))]">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div>
            <h1 className="text-xl font-extrabold text-primary leading-tight tracking-tight">NjangaRent</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Find your home in Buea</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={dashboardTo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              <LayoutDashboard size={13} />
              Dashboard
            </Link>
            <button
              onClick={() => navigate({ to: user ? "/tenant/notifications" : "/login" })}
              className="relative p-2 rounded-full bg-card border border-border"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-foreground" />
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400 border-2 border-background" />
            </button>
          </div>
        </div>

        {/* Filter Chip Bar */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "shrink-0 h-9 px-4 rounded-full text-xs font-semibold border transition-all",
                activeFilter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Listing Count */}
      {!isLoading && listings.length > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground">
          {listings.length} listing{listings.length !== 1 ? "s" : ""} in Buea
        </div>
      )}

      {/* Listing Feed */}
      <div className="pt-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mx-4 mb-4 rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="w-full aspect-video bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-2/5" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Home size={32} className="text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No listings found.</p>
            <p className="text-xs text-muted-foreground">Try a different filter</p>
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

  const typeLabels: Record<string, string> = {
    studio: "Studio", single_room: "Room", self_contained: "Self-Contained",
    apartment: "Apartment", furnished: "Furnished"
  };
  const typeLabel = typeLabels[listing.propertyType] || listing.propertyType || "Property";

  return (
    <div
      onClick={() => navigate({ to: "/listing/$id", params: { id: listing.id } })}
      className="mx-4 mb-4 rounded-2xl border border-border bg-card overflow-hidden cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
    >
      {/* Photo */}
      <div className="relative w-full aspect-video bg-primary/5">
        {coverUrl ? (
          <img src={coverUrl} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Home size={32} className="text-primary/30" />
            <span className="text-[11px] text-muted-foreground">No photo yet</span>
          </div>
        )}

        {isVerified && (
          <div className="absolute top-2.5 right-2.5 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            ✓ Verified
          </div>
        )}
        {photoCount > 1 && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/55 text-white text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <ImageIcon size={10} /> {photoCount} photos
          </div>
        )}
        <div className="absolute bottom-2.5 right-2.5 bg-black/45 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg">
          {typeLabel}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground truncate">{listing.title}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {listing.location?.displayAddress || "Buea"}
                {listing.distanceFromUbKm ? ` · ${listing.distanceFromUbKm}km from UB` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(listing.id); }}
            className="p-1 shrink-0"
            aria-label="Save listing"
          >
            <Heart
              size={18}
              color={isSaved ? "#D4A017" : undefined}
              fill={isSaved ? "#D4A017" : "none"}
              className={isSaved ? "" : "text-muted-foreground"}
            />
          </button>
        </div>

        {/* Price + availability */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-base font-bold text-primary">
              ₣{listing.rentAmount?.toLocaleString() ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/month</span>
          </div>
          {isAvailable && (
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              Available
            </span>
          )}
        </div>

        {/* Amenity Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
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
    <div className="flex items-center gap-1 bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-md border border-border">
      {icon}
      {label}
    </div>
  );
}
