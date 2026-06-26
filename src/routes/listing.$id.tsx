import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft, Heart, ShieldCheck, Star, MapPin,
  Wifi, Zap, Droplets, Shield, Car, Tv,
  CheckCircle, BedDouble, Bath, MessageSquare,
  Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({ meta: [{ title: "Listing Details — NjangaRent" }] }),
  component: ListingDetail,
});

const AMENITY_MAP: Record<string, { icon: React.ElementType; label: string }> = {
  wifi: { icon: Wifi, label: "WiFi" },
  electricity: { icon: Zap, label: "Electricity" },
  water: { icon: Droplets, label: "Running Water" },
  security: { icon: Shield, label: "Security" },
  parking: { icon: Car, label: "Parking" },
  tv: { icon: Tv, label: "TV" },
};

let maplibregl: any = null;

function ListingDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();

  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  const { data: listingRaw, isLoading, isError, error: listingError } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (id.startsWith("dummy-")) {
        const { DUMMY_LISTINGS } = await import("@/data/dummyListings");
        const dummy = DUMMY_LISTINGS.find(l => l.id === id);
        if (dummy) return dummy;
        throw new Error("Listing not found");
      }
      const { supabaseListings } = await import("@/lib/supabase");
      return supabaseListings.getById(id);
    },
    retry: false,
  });

  const listing = listingRaw as any;

  const { data: rawSlots = [] } = useQuery({
    queryKey: ["visit-slots", id],
    queryFn: async () => {
      if (id.startsWith("dummy-")) return [];
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/visits/slots/${id}`, { headers });
      if (!res.ok) return [];
      const j = await res.json();
      return j.data ?? [];
    },
    enabled: showSchedule,
  });

  const groupedSlots = (rawSlots as any[]).reduce((acc: Record<string, any[]>, slot: any) => {
    const d = new Date(slot.slot_datetime);
    const dateKey = d.toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});
  const availableDates = Object.keys(groupedSlots).sort();

  const bookSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await fetch(`/api/visits/book/${slotId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast.success("Booking sent — waiting for landlord confirmation");
      setShowSchedule(false);
      router.navigate({ to: "/visits" });
    },
    onError: (err: any) => toast.error(err.message || "Failed to book slot"),
  });

  const startChat = useMutation({
    mutationFn: async () => {
      const l = listing as any;
      const landlordId = l?.landlordId ?? l?.landlord_id;
      if (!landlordId) throw new Error("No landlord info available");
      const res = await fetch(`/api/messages/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          landlordId,
          listingId: listing?.id,
          body: `Hi, I'm interested in "${listing?.title}". Is it still available?`,
        }),
      });
      if (!res.ok) throw new Error("Could not start chat");
      return res.json();
    },
    onSuccess: (data) => {
      const threadId = data?.data?.threadId ?? data?.threadId;
      if (threadId) router.navigate({ to: `/messages/${threadId}` });
    },
    onError: () => toast.error("Could not start chat — messaging requires the backend."),
  });

  useEffect(() => {
    if (!mapContainer.current || !listing || mapRef.current) return;
    import("maplibre-gl").then((ml) => {
      import("maplibre-gl/dist/maplibre-gl.css");
      maplibregl = ml.default;
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [(listing as any).lng || (listing as any).location?.lng || 9.2403, (listing as any).lat || (listing as any).location?.lat || 4.1527],
        zoom: 14,
        attributionControl: false,
      });
      mapRef.current.scrollZoom.disable();
      mapRef.current.dragPan.disable();
      mapRef.current.on("load", () => {
        const lng = (listing as any).lng ?? (listing as any).location?.lng;
        const lat = (listing as any).lat ?? (listing as any).location?.lat;
        if (lng && lat) {
          const el = document.createElement("div");
          el.style.cssText = "width:24px;height:24px;background:#1B4332;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)";
          new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current);
        }
      });
    });
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, [listing]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing || isError) {
    const msg = (listingError as Error)?.message ?? "Could not load listing";
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-6">
        <div className="text-center">
          <p className="text-base text-foreground mb-1">{msg}</p>
          <p className="text-xs text-muted-foreground mb-4">ID: {id}</p>
          <button
            onClick={() => router.history.back()}
            className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const imagesArray = listing.exteriorImages?.length ? listing.exteriorImages : listing.roomImages || [];
  const images = imagesArray.length > 0
    ? imagesArray
    : ["https://images.unsplash.com/photo-1522771731478-44eb10e5c8f4?auto=format&fit=crop&w=800"];

  const l = listing as any;
  const landlordName = l.landlord?.full_name || "Landlord";
  const landlordInitial = landlordName.charAt(0).toUpperCase();

  const typeLabels: Record<string, string> = {
    studio: "Studio", single_room: "Single Room", self_contained: "Self-Contained",
    apartment: "Apartment",
  };

  return (
    <div className="bg-background text-foreground min-h-screen pb-[calc(72px+env(safe-area-inset-bottom))]">
      {/* Photo Carousel */}
      <div className="relative w-full aspect-video bg-muted">
        <button
          onClick={() => router.history.back()}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <Heart size={18} fill={isSaved ? "#D4A017" : "none"} className={isSaved ? "text-amber-500" : "text-white"} />
        </button>

        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((img: any, i: number) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
                <img src={typeof img === "string" ? img : img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/55 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-foreground leading-tight flex-1">
            {listing.title}
            {(l.isVerified || l.verified) && <ShieldCheck size={16} className="inline ml-1.5 text-amber-500" />}
          </h1>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <MapPin size={13} className="text-muted-foreground shrink-0" />
          <p className="text-[13px] text-muted-foreground">
            {listing.location?.displayAddress || "Buea"}
            {listing.distanceFromUbKm ? ` · ${listing.distanceFromUbKm}km from UB` : ""}
          </p>
        </div>
        <div className="mt-2.5">
          <span className="text-2xl font-bold text-primary">
            ₣{listing.rentAmount?.toLocaleString() ?? "—"}
          </span>
          <span className="text-[13px] text-muted-foreground ml-1">/month</span>
        </div>
      </div>

      {/* Landlord Trust Bar */}
      <div className="mx-4 mb-4 p-3 bg-card rounded-xl border border-border flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
          {landlordInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            {landlordName}
            {l.landlord?.isVerified && <ShieldCheck size={14} className="text-amber-500" />}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Landlord</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[13px] font-semibold text-foreground">
            <Star size={12} className="text-amber-500 fill-amber-500" /> 4.8
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Replies in ~1 hr</p>
        </div>
      </div>

      {/* Key Details Chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-none">
        {l.bedrooms > 0 && (
          <DetailChip icon={<BedDouble size={13} />} label={`${l.bedrooms} Bedroom${l.bedrooms > 1 ? "s" : ""}`} />
        )}
        <DetailChip icon={<Bath size={13} />} label="1 Bathroom" />
        {listing.propertyType && (
          <DetailChip icon={null} label={typeLabels[listing.propertyType] || listing.propertyType} />
        )}
      </div>

      {/* Description */}
      <div className="px-4 pb-4 border-t border-border pt-4">
        <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">About</h2>
        <div className={cn("text-sm text-muted-foreground leading-relaxed", !descExpanded && "line-clamp-3")}>
          {listing.description || "No description provided for this listing."}
        </div>
        {!descExpanded && listing.description?.length > 120 && (
          <button
            onClick={() => setDescExpanded(true)}
            className="mt-1.5 text-[13px] font-semibold text-foreground hover:underline"
          >
            Read more
          </button>
        )}
      </div>

      {/* Amenities */}
      {listing.amenities?.length > 0 && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <h2 className="mb-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Amenities</h2>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {listing.amenities.map((a: string) => {
              const key = a.toLowerCase();
              const item = AMENITY_MAP[key];
              const Icon = item?.icon || CheckCircle;
              return (
                <div key={a} className="flex items-center gap-2 text-[13px] text-foreground">
                  <Icon size={15} className="text-muted-foreground shrink-0" />
                  {item?.label || a}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="px-4 pb-4 border-t border-border pt-4">
        <h2 className="mb-2.5 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Location</h2>
        <div ref={mapContainer} className="w-full h-[180px] rounded-xl bg-card overflow-hidden border border-border" />
        {(l.lat ?? l.location?.lat) && (l.lng ?? l.location?.lng) && (
          <a
            href={`https://www.google.com/maps?q=${l.lat ?? l.location?.lat},${l.lng ?? l.location?.lng}`}
            target="_blank" rel="noreferrer"
            className="inline-block mt-2.5 text-[13px] font-semibold text-primary hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </div>

      {/* Reviews */}
      <div className="px-4 pb-4 border-t border-border pt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Reviews</h2>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
            <Star size={13} className="text-amber-500 fill-amber-500" /> 4.8 (12 reviews)
          </div>
        </div>
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">E</div>
            <p className="text-[13px] font-semibold text-foreground flex-1">Enow Emmanuel</p>
            <p className="text-[11px] text-muted-foreground">Oct 2024</p>
          </div>
          <div className="flex gap-0.5 mb-1.5">
            {[1,2,3,4,5].map(i => <Star key={i} size={11} className="text-amber-500 fill-amber-500" />)}
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            "Great place, very clean and close to campus. The landlord is responsive and helpful."
          </p>
        </div>
        <button className="w-full mt-3 h-10 border border-border rounded-lg text-[13px] font-semibold text-foreground bg-card hover:bg-muted/50 transition-colors">
          See all 12 reviews
        </button>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <button
            className="flex-1 h-12 rounded-xl bg-amber-500 text-white text-[15px] font-semibold hover:bg-amber-600 transition-colors"
            onClick={() => router.navigate({ to: "/payments/pay", search: { listingId: listing.id, leaseId: "", amount: listing.rentAmount || 0, listingTitle: listing.title || "" } })}
          >
            Pay Rent
          </button>
          <button
            onClick={() => setShowSchedule(true)}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold hover:bg-primary/90 transition-colors"
          >
            Visit
          </button>
          <button
            onClick={() => {
              if (!user) { toast.error("Please log in to send a message"); return; }
              startChat.mutate();
            }}
            disabled={startChat.isPending}
            className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* Schedule Visit Bottom Sheet */}
      {showSchedule && (
        <>
          <div
            onClick={() => setShowSchedule(false)}
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background rounded-t-[20px] pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-9 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="p-4 px-5">
              <h3 className="text-lg font-bold text-foreground mb-1">Schedule a visit</h3>
              <p className="text-[13px] text-muted-foreground mb-5">{listing.title}</p>

              {availableDates.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No available slots right now.<br />
                  <strong className="text-foreground font-semibold">Message the landlord</strong> to arrange a time.
                </div>
              ) : (
                <>
                  {/* Date Picker */}
                  <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-5 px-5">
                    {availableDates.map(dateStr => {
                      const d = new Date(dateStr);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                          className={cn(
                            "shrink-0 w-14 h-16 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-card border-border text-foreground hover:border-primary/50"
                          )}
                        >
                          <span className="text-[10px] font-semibold uppercase opacity-80">
                            {d.toLocaleDateString("en-GB", { weekday: "short" })}
                          </span>
                          <span className="text-lg font-bold">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <>
                      <p className="text-[13px] font-medium text-muted-foreground mb-2.5">Available times</p>
                      <div className="grid grid-cols-2 gap-2.5 mb-5 max-h-[30vh] overflow-y-auto pr-1">
                        {groupedSlots[selectedDate].map((slot: any) => {
                          const d = new Date(slot.slot_datetime);
                          const isSelected = selectedSlot === slot.id;
                          const isBooked = slot.is_booked;
                          return (
                            <button
                              key={slot.id}
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={cn(
                                "h-10 rounded-lg text-[13px] font-semibold border transition-colors",
                                isBooked
                                  ? "bg-muted border-transparent text-muted-foreground opacity-50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-card border-border text-foreground hover:border-primary/50"
                              )}
                            >
                              {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <button
                    className="w-full h-12 rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!selectedDate || !selectedSlot || bookSlot.isPending}
                    onClick={() => { if (selectedSlot) bookSlot.mutate(selectedSlot); }}
                  >
                    {bookSlot.isPending ? "Confirming..." : "Confirm booking"}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="shrink-0 flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-medium">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </div>
  );
}
