import { Link } from "@tanstack/react-router";
import { MapPin, Bed, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "./VerificationBadge";
import { formatDistance } from "@/utils/haversine";
import type { Listing } from "@/api/listings.api";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  studio:          "Studio",
  single_room:     "Single Room",
  self_contained:  "Self-Contained",
  apartment:       "Apartment",
  hostel_block:    "Hostel Block",
};

const PERIOD_LABELS: Record<string, string> = {
  monthly: "/mo",
  termly:  "/term",
  yearly:  "/yr",
};

function formatXAF(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style:    "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const primaryImage = listing.exteriorImages?.[0] ?? listing.roomImages?.[0] ?? null;
  const hasWifi = listing.amenities?.includes("wifi");

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      className={cn(
        "group block rounded-2xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5",
        className,
      )}
      aria-label={`${listing.title} — ${formatXAF(listing.rentAmount)} ${PERIOD_LABELS[listing.rentPeriod] ?? ""}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0ede8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%235C5C5C'%3ENo image%3C/text%3E%3C/svg%3E";
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Property type chip */}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 backdrop-blur-sm">
          {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
        </span>

        {hasWifi && (
          <span
            aria-label="WiFi available"
            className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center"
          >
            <Wifi className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <VerificationBadge />
        </div>

        {/* Location */}
        {listing.location?.displayAddress && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.location.displayAddress}</span>
          </div>
        )}

        {/* Price + distance */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <span className="text-base font-bold text-foreground">
              {formatXAF(listing.rentAmount)}
            </span>
            <span className="text-xs text-muted-foreground ml-0.5">
              {PERIOD_LABELS[listing.rentPeriod] ?? ""}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {formatDistance(listing.distanceFromUbKm)}
          </div>
        </div>
      </div>
    </Link>
  );
}
