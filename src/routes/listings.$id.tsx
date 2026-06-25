import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Wifi, Zap, Droplets, Shield, Car, UtensilsCrossed,
  Calendar, MessageSquare, CreditCard, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { listingsApi } from "@/api/listings.api";
import { messagesApi } from "@/api/messages.api";
import { MapView } from "@/components/MapView";
import { VerificationBadge } from "@/components/VerificationBadge";
import { PaymentModal } from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { formatDistance } from "@/utils/haversine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listings/$id")({
  component: ListingDetail,
});

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi:        Wifi,
  electricity: Zap,
  water:       Droplets,
  security:    Shield,
  parking:     Car,
  kitchen:     UtensilsCrossed,
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  studio:         "Studio",
  single_room:    "Single Room",
  self_contained: "Self-Contained",
  apartment:      "Apartment",
  hostel_block:   "Hostel Block",
};

function formatXAF(n: number) {
  return new Intl.NumberFormat("fr-CM", {
    style:    "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(n);
}

function ListingDetail() {
  const { id }      = Route.useParams();
  const user        = useAuthStore((s) => s.user);
  const navigate    = useNavigate();
  const [imgIndex, setImgIndex] = useState(0);
  const [showPay, setShowPay]  = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey:  ["listing", id],
    queryFn:   () => listingsApi.getById(id),
    staleTime: 60_000,
  });

  const startChat = useMutation({
    mutationFn: () => messagesApi.initiate(id),
    onSuccess:  (res) => {
      const role = user?.role;
      if (role === "student" || role === "tenant") {
        navigate({ to: "/student/inbox" });
      } else {
        navigate({ to: "/landlord/inbox" });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background" role="alert">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button variant="outline" asChild>
          <Link to="/listings">Back to browse</Link>
        </Button>
      </div>
    );
  }

  const listing = data.data;
  const allImages = [...listing.exteriorImages, ...listing.roomImages];
  const currentImg = allImages[imgIndex];

  const canInteract = !!user && user.status === "ACTIVE" && user.role !== "landlord";

  return (
    <>
      <div className="min-h-screen bg-background pb-32 lg:pb-12">
        {/* Back nav */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to listings"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All listings
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-muted" aria-label="Listing images">
              {currentImg ? (
                <img
                  src={currentImg}
                  alt={`${listing.title} — image ${imgIndex + 1} of ${allImages.length}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f0ede8'/%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No photos available
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                    disabled={imgIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={() => setImgIndex((i) => Math.min(allImages.length - 1, i + 1))}
                    disabled={imgIndex === allImages.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to image ${i + 1}`}
                        onClick={() => setImgIndex(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/50",
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Title + badges */}
            <div>
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium rounded-full bg-primary/10 text-primary px-3 py-0.5">
                  {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
                </span>
                <VerificationBadge size="md" />
              </div>
              <h1 className="text-xl font-bold text-foreground mt-2">{listing.title}</h1>
              {listing.location?.displayAddress && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {listing.location.displayAddress}
                  <span className="ml-1 text-xs">
                    ({formatDistance(listing.distanceFromUbKm)})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="font-semibold text-sm mb-2">About this room</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </section>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <section aria-labelledby="amenities-heading">
                <h2 id="amenities-heading" className="font-semibold text-sm mb-3">Amenities</h2>
                <ul className="grid grid-cols-2 gap-2" role="list">
                  {listing.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a];
                    return (
                      <li key={a} className="flex items-center gap-2 text-sm">
                        {Icon
                          ? <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          : <div className="h-4 w-4 rounded-full bg-primary/20 shrink-0" aria-hidden="true" />
                        }
                        {a.replace(/_/g, " ")}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Map */}
            {listing.location?.lat && listing.location?.lng && (
              <section aria-labelledby="map-heading">
                <h2 id="map-heading" className="font-semibold text-sm mb-3">Location</h2>
                <MapView lat={listing.location.lat} lng={listing.location.lng} />
              </section>
            )}
          </div>

          {/* Right column: sticky action panel */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-elevated space-y-4">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {formatXAF(listing.rentAmount)}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  /{listing.rentPeriod}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Available from</span>
                  <span className="font-medium text-foreground">{listing.availableFrom || "Now"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max occupants</span>
                  <span className="font-medium text-foreground">{listing.maxOccupants}</span>
                </div>
              </div>

              {canInteract ? (
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full rounded-xl gap-2"
                    onClick={() => startChat.mutate()}
                    disabled={startChat.isPending}
                    aria-label="Message the landlord"
                  >
                    {startChat.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    }
                    Message landlord
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl gap-2"
                    asChild
                  >
                    <Link to="/student/appointments" aria-label="Book a viewing appointment">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      Book a viewing
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl gap-2"
                    onClick={() => setShowPay(true)}
                    aria-label="Pay deposit or rent"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Pay via Nkwa
                  </Button>
                </div>
              ) : !user ? (
                <div className="space-y-2 pt-2">
                  <Button asChild className="w-full rounded-xl">
                    <Link to="/login">Sign in to contact landlord</Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    or{" "}
                    <Link to="/signup" className="text-primary hover:underline">
                      create a student account
                    </Link>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showPay && (
        <PaymentModal
          listingId={listing.id}
          listingTitle={listing.title}
          suggestedAmount={listing.rentAmount}
          onClose={() => setShowPay(false)}
        />
      )}
    </>
  );
}
