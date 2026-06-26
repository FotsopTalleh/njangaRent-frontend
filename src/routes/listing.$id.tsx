import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft, Heart, ShieldCheck, Star, MapPin,
  Wifi, Zap, Droplets, Shield, Car, Tv,
  CheckCircle, AlertCircle, XCircle, BedDouble, Bath, MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { toast } from "sonner";

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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // Theme-aware color helper
  const c = {
    bg:        isDark ? "#0f1f18" : "#FFFFFF",
    surface:   isDark ? "#162b20" : "#F9F7F2",
    border:    isDark ? "rgba(255,255,255,0.08)" : "#E8E4DC",
    text:      isDark ? "#e8f5ee" : "#1A1A18",
    textMuted: isDark ? "#8ab39a" : "#6B6B68",
    textFaint: isDark ? "#5a8a6a" : "#A8A8A5",
    green:     "#1B4332",
    greenLight: isDark ? "#2d6a4f" : "#EAF4EE",
    amber:     "#D4A017",
  };
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

  const { data: listing, isLoading, isError, error: listingError } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      // Intercept dummy listing IDs — no network request needed
      if (id.startsWith("dummy-")) {
        const { DUMMY_LISTINGS } = await import("@/data/dummyListings");
        const dummy = DUMMY_LISTINGS.find(l => l.id === id);
        if (dummy) return dummy;
        throw new Error("Listing not found");
      }
      
      const { supabaseListings } = await import("@/lib/supabase");
      return supabaseListings.getById(id);
    },
    retry: false,  // show error immediately; don't hammer the DB
  });

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

  // Group slots by date
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
      // landlordId is available in the normalised listing object
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

  // Map thumbnail
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: c.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E8E4DC", borderTopColor: c.green, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: c.textMuted, fontSize: 14 }}>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing || isError) {
    const msg = (listingError as Error)?.message ?? "Could not load listing";
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: c.bg }}>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: c.textMuted, fontSize: 15, marginBottom: 4 }}>{msg}</p>
          <p style={{ color: c.textFaint, fontSize: 12, marginBottom: 16 }}>ID: {id}</p>
          <button
            onClick={() => router.history.back()}
            style={{ padding: "10px 20px", backgroundColor: c.green, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
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
  const hasActiveLease = false;

  const typeLabels: Record<string, string> = {
    studio: "Studio", single_room: "Single Room", self_contained: "Self-Contained",
    apartment: "Apartment",
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: "100vh", paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}>
      
      {/* Photo Carousel */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#E8E4DC" }}>
        {/* Back & Save overlays */}
        <button
          onClick={() => router.history.back()}
          style={{
            position: "absolute", top: 16, left: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.45)", color: "#fff",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.45)", color: "#fff",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Heart size={18} fill={isSaved ? "#D4A017" : "none"} color={isSaved ? "#D4A017" : "#fff"} />
        </button>

        {/* Embla */}
        <div style={{ overflow: "hidden", height: "100%" }} ref={emblaRef}>
          <div style={{ display: "flex", height: "100%" }}>
            {images.map((img: any, i: number) => (
              <div key={i} style={{ flex: "0 0 100%", minWidth: 0, height: "100%", position: "relative" }}>
                <img src={typeof img === "string" ? img : img.url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Photo count */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.55)", color: "#fff",
          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
        }}>
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Header Section */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text, margin: 0, lineHeight: 1.3, flex: 1 }}>
            {listing.title}
            {(l.isVerified || l.verified) && <ShieldCheck size={16} color={c.amber} style={{ display: "inline", marginLeft: 6 }} />}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <MapPin size={13} color={c.textFaint} />
          <p style={{ fontSize: 13, color: c.textMuted, margin: 0 }}>
            {listing.location?.displayAddress || "Buea"}
            {listing.distanceFromUbKm ? ` · ${listing.distanceFromUbKm}km from UB` : ""}
          </p>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: c.green }}>
            ₣{listing.rentAmount?.toLocaleString() ?? "—"}
          </span>
          <span style={{ fontSize: 13, color: c.textMuted, marginLeft: 4 }}>/month</span>
        </div>
      </div>

      {/* Landlord Trust Bar */}
      <div style={{
        margin: "0 16px 16px",
        padding: "12px 14px",
        backgroundColor: c.surface,
        borderRadius: 12,
        border: `0.5px solid ${c.border}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          backgroundColor: c.green, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700, flexShrink: 0,
        }}>
          {landlordInitial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
            {landlordName}
            {l.landlord?.isVerified && <ShieldCheck size={14} color={c.amber} />}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: c.textMuted }}>Landlord</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", fontSize: 13, fontWeight: 600, color: c.text }}>
            <Star size={12} color={c.amber} fill={c.amber} /> 4.8
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: c.textFaint }}>Replies in ~1 hr</p>
        </div>
      </div>

      {/* Key Details Chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 16px", scrollbarWidth: "none" }}>
        {l.bedrooms > 0 && (
          <DetailChip icon={<BedDouble size={13} />} label={`${l.bedrooms} Bedroom${l.bedrooms > 1 ? "s" : ""}`} />
        )}
        <DetailChip icon={<Bath size={13} />} label="1 Bathroom" />
        {listing.propertyType && (
          <DetailChip icon={null} label={typeLabels[listing.propertyType] || listing.propertyType} />
        )}
      </div>

      {/* Description */}
      <div style={{ padding: "0 16px 16px", borderTop: `0.5px solid ${c.border}`, paddingTop: 16 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>About</h2>
        <div style={{
          fontSize: 14, color: c.textMuted, lineHeight: 1.6,
          overflow: "hidden",
          display: descExpanded ? "block" : "-webkit-box",
          WebkitLineClamp: descExpanded ? undefined : 3,
          WebkitBoxOrient: "vertical" as any,
        }}>
          {listing.description || "No description provided for this listing."}
        </div>
        {!descExpanded && listing.description?.length > 120 && (
          <button
            onClick={() => setDescExpanded(true)}
            style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: c.text, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Read more
          </button>
        )}
      </div>

      {/* Amenities */}
      {listing.amenities?.length > 0 && (
        <div style={{ padding: "0 16px 16px", borderTop: `0.5px solid ${c.border}`, paddingTop: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Amenities</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
            {listing.amenities.map((a: string) => {
              const key = a.toLowerCase();
              const item = AMENITY_MAP[key];
              const Icon = item?.icon || CheckCircle;
              return (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: c.text }}>
                  <Icon size={15} color={c.textMuted} />
                  {item?.label || a}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ padding: "0 16px 16px", borderTop: `0.5px solid ${c.border}`, paddingTop: 16 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Location</h2>
        <div ref={mapContainer} style={{ width: "100%", height: 180, borderRadius: 12, backgroundColor: c.surface, overflow: "hidden" }} />
        {(l.lat ?? l.location?.lat) && (l.lng ?? l.location?.lng) && (
          <a
            href={`https://www.google.com/maps?q=${l.lat ?? l.location?.lat},${l.lng ?? l.location?.lng}`}
            target="_blank" rel="noreferrer"
            style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 600, color: c.green, textDecoration: "none" }}
          >
            Open in Google Maps →
          </a>
        )}
      </div>

      {/* Reviews */}
      <div style={{ padding: "0 16px 16px", borderTop: `0.5px solid ${c.border}`, paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>Reviews</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: c.text }}>
            <Star size={13} fill={c.amber} color={c.amber} /> 4.8 (12 reviews)
          </div>
        </div>
        <div style={{ padding: "12px 0", borderBottom: `0.5px solid ${c.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: c.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: c.text }}>E</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1, color: c.text }}>Enow Emmanuel</p>
            <p style={{ margin: 0, fontSize: 11, color: c.textFaint }}>Oct 2024</p>
          </div>
          <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={c.amber} color={c.amber} />)}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: c.textMuted, lineHeight: 1.5 }}>
            "Great place, very clean and close to campus. The landlord is responsive and helpful."
          </p>
        </div>
        <button style={{
          width: "100%", marginTop: 12, height: 40,
          border: `0.5px solid ${c.border}`, borderRadius: 8,
          fontSize: 13, fontWeight: 600, color: c.text,
          backgroundColor: c.surface, cursor: "pointer"
        }}>
          See all 12 reviews
        </button>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: c.bg,
        borderTop: `0.5px solid ${c.border}`,
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              flex: 1, height: 48, borderRadius: 12,
              backgroundColor: "#D4A017", color: "#FFFFFF",
              fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
            }}
            onClick={() => router.navigate({ to: "/payments/pay", search: { listingId: listing.id, leaseId: "", amount: listing.rentAmount || 0, listingTitle: listing.title || "" } })}
          >
            Pay Rent
          </button>
          <button
            onClick={() => setShowSchedule(true)}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              backgroundColor: "#1B4332", color: "#FFFFFF",
              fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer",
            }}
          >
            Visit
          </button>
          <button
            onClick={() => {
              if (!user) { toast.error("Please log in to send a message"); return; }
              startChat.mutate();
            }}
            disabled={startChat.isPending}
            style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: "#EAF4EE", color: "#1B4332",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "0.5px solid #B7D9C4", cursor: "pointer", flexShrink: 0,
              opacity: startChat.isPending ? 0.5 : 1,
            }}
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
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50,
            }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
            backgroundColor: "#FFFFFF",
            borderRadius: "20px 20px 0 0",
            paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
            maxHeight: "80vh", overflowY: "auto",
          }}>
            {/* Drag Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, backgroundColor: "#D4D0C8", borderRadius: 999 }} />
            </div>

            <div style={{ padding: "16px 20px 0" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#1A1A18" }}>Schedule a visit</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B6B68" }}>{listing.title}</p>

              {availableDates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#6B6B68", fontSize: 14 }}>
                  No available slots right now.<br />
                  <strong style={{ color: "#1A1A18" }}>Message the landlord</strong> to arrange a time.
                </div>
              ) : (
                <>
                  {/* Date Picker */}
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none", margin: "0 -20px", padding: "0 20px 16px" }}>
                    {availableDates.map(dateStr => {
                      const d = new Date(dateStr);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                          style={{
                            flexShrink: 0,
                            width: 56, height: 68,
                            borderRadius: 12,
                            border: isSelected ? "none" : "0.5px solid #E8E4DC",
                            backgroundColor: isSelected ? "#1B4332" : "#F9F7F2",
                            color: isSelected ? "#FFFFFF" : "#1A1A18",
                            cursor: "pointer", fontSize: 13,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>
                            {d.toLocaleDateString("en-GB", { weekday: "short" })}
                          </span>
                          <span style={{ fontSize: 18, fontWeight: 700 }}>{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#6B6B68", margin: "0 0 10px" }}>Available times</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, maxHeight: "30vh", overflowY: "auto" }}>
                        {groupedSlots[selectedDate].map((slot: any) => {
                          const d = new Date(slot.slot_datetime);
                          const isSelected = selectedSlot === slot.id;
                          const isBooked = slot.is_booked;
                          return (
                            <button
                              key={slot.id}
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(slot.id)}
                              style={{
                                height: 42, borderRadius: 10, fontSize: 13, fontWeight: 600,
                                border: isSelected ? "none" : "0.5px solid #E8E4DC",
                                backgroundColor: isBooked ? "#F9F7F2" : isSelected ? "#1B4332" : "#F9F7F2",
                                color: isBooked ? "#A8A8A5" : isSelected ? "#FFFFFF" : "#1A1A18",
                                opacity: isBooked ? 0.4 : 1,
                                cursor: isBooked ? "not-allowed" : "pointer",
                              }}
                            >
                              {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <button
                    style={{
                      width: "100%", height: 48, borderRadius: 12,
                      backgroundColor: selectedDate && selectedSlot ? "#1B4332" : "#E8E4DC",
                      color: selectedDate && selectedSlot ? "#FFFFFF" : "#A8A8A5",
                      fontSize: 15, fontWeight: 600, border: "none",
                      cursor: selectedDate && selectedSlot ? "pointer" : "not-allowed",
                    }}
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
    <div style={{
      flexShrink: 0,
      display: "flex", alignItems: "center", gap: 6,
      backgroundColor: "#F9F7F2",
      border: "0.5px solid #E8E4DC",
      borderRadius: 8, padding: "6px 12px",
      fontSize: 12, color: "#1A1A18",
    }}>
      {icon}
      {label}
    </div>
  );
}
