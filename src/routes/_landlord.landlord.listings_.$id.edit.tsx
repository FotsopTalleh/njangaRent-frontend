// Edit listing page — full form pre-filled with existing data.
// Shares the same form shape as the create page; loads data by listing ID.
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { listingsApi } from "@/api/listings.api";
import { ImageUpload } from "@/components/ImageUpload";
import { MapPicker } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import type { Listing } from "@/api/listings.api";

export const Route = createFileRoute("/_landlord/landlord/listings_/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Listing — NjangaRent" }] }),
  component: EditListing,
});

const PROPERTY_TYPES = [
  { value: "studio",         label: "Studio" },
  { value: "single_room",    label: "Single Room" },
  { value: "self_contained", label: "Self-Contained" },
  { value: "apartment",      label: "Apartment" },
  { value: "hostel_block",   label: "Hostel Block" },
];

const RENT_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "termly",  label: "Per Academic Term" },
  { value: "yearly",  label: "Yearly" },
];

const AMENITY_OPTIONS = [
  "water", "electricity", "wifi", "security", "furnished", "parking", "kitchen", "generator",
];

function EditListing() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn:  () => listingsApi.getById(id),
  });

  const listing = data?.data as Listing | undefined;

  // Form state — pre-filled from listing
  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [propertyType,  setPropertyType]  = useState("");
  const [rentAmount,    setRentAmount]     = useState("");
  const [rentPeriod,    setRentPeriod]     = useState("monthly");
  const [availableFrom, setAvailableFrom] = useState("");
  const [maxOccupants,  setMaxOccupants]  = useState("1");
  const [rules,         setRules]         = useState("");
  const [amenities,     setAmenities]     = useState<string[]>([]);
  const [location,      setLocation]      = useState<{ lat: number; lng: number } | null>(null);
  const [newExterior,   setNewExterior]   = useState<File[]>([]);
  const [newRoom,       setNewRoom]       = useState<File[]>([]);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [error,         setError]         = useState<string | null>(null);
  const [saved,         setSaved]         = useState(false);

  // Pre-fill once listing loads
  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title ?? "");
    setDescription(listing.description ?? "");
    setPropertyType(listing.propertyType ?? "");
    setRentAmount(String(listing.rentAmount ?? ""));
    setRentPeriod(listing.rentPeriod ?? "monthly");
    setMaxOccupants(String(listing.maxOccupants ?? 1));
    setRules(listing.rules ?? "");
    setAmenities(listing.amenities ?? []);
    if (listing.location?.lat && listing.location?.lng) {
      setLocation({ lat: listing.location.lat, lng: listing.location.lng });
    }
  }, [listing]);

  const toggleAmenity = (val: string) =>
    setAmenities((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val],
    );

  const saveMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("title",         title.trim());
      fd.append("description",   description.trim());
      fd.append("propertyType",  propertyType);
      fd.append("rentAmount",    rentAmount);
      fd.append("rentPeriod",    rentPeriod);
      fd.append("availableFrom", availableFrom);
      fd.append("maxOccupants",  maxOccupants);
      fd.append("rules",         rules.trim());
      fd.append("amenities",     amenities.join(","));
      if (location) {
        fd.append("lat", String(location.lat));
        fd.append("lng", String(location.lng));
      }
      newExterior.forEach((f) => fd.append("exteriorImages", f));
      newRoom.forEach((f) => fd.append("roomImages", f));
      return listingsApi.update(id, fd, setUploadPct);
    },
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: (err: { message?: string }) => setError(err?.message ?? "Failed to save changes."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
        <p>Listing not found.</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link to="/landlord/listings">Back to listings</Link>
        </Button>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold">Changes saved</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Your listing has been updated. If the status was active it may be re-queued for review.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/landlord/listings">Back to my listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl gap-1.5">
          <Link to="/landlord/listings" aria-label="Back to my listings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit listing</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{listing.title}</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-5" aria-labelledby="edit-basic">
          <h2 id="edit-basic" className="font-semibold">Basic information</h2>
          <FieldWrap label="Listing title" required>
            <Input id="edit-title" className="rounded-xl h-11" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Property type" required>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="edit-type" className="rounded-xl h-11" aria-label="Property type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>
            <FieldWrap label="Max occupants">
              <Input id="edit-occupants" type="number" min={1} max={20} className="rounded-xl h-11" value={maxOccupants} onChange={(e) => setMaxOccupants(e.target.value)} />
            </FieldWrap>
          </div>
          <FieldWrap label="Description">
            <textarea
              id="edit-desc"
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FieldWrap>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-5" aria-labelledby="edit-pricing">
          <h2 id="edit-pricing" className="font-semibold">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Rent amount (XAF)" required>
              <Input id="edit-rent" type="number" className="rounded-xl h-11" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
            </FieldWrap>
            <FieldWrap label="Per">
              <Select value={rentPeriod} onValueChange={setRentPeriod}>
                <SelectTrigger id="edit-period" className="rounded-xl h-11" aria-label="Rent period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENT_PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4" aria-labelledby="edit-amenities">
          <h2 id="edit-amenities" className="font-semibold">Amenities</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select amenities">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={amenities.includes(a)}
                onClick={() => toggleAmenity(a)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors capitalize ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary"}`}
              >
                {a.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4" aria-labelledby="edit-location">
          <h2 id="edit-location" className="font-semibold">Location</h2>
          <MapPicker value={location} onChange={(lat, lng) => setLocation({ lat, lng })} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-5" aria-labelledby="edit-photos">
          <h2 id="edit-photos" className="font-semibold">Add new photos</h2>
          <p className="text-xs text-muted-foreground -mt-3">
            Existing photos are kept. Upload additional images here.
          </p>
          <ImageUpload id="edit-exterior" label="Exterior photos" maxFiles={8} onChange={setNewExterior} />
          <ImageUpload id="edit-room"     label="Room photos"     maxFiles={8} onChange={setNewRoom} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4" aria-labelledby="edit-rules">
          <h2 id="edit-rules" className="font-semibold">House rules</h2>
          <textarea
            id="edit-rules-area"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
        </section>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3" role="alert" aria-live="polite">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {saveMut.isPending && uploadPct > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Uploading... {uploadPct}%</p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadPct}%` }}
                role="progressbar"
                aria-valuenow={uploadPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        <Button
          onClick={() => saveMut.mutate()}
          disabled={!title.trim() || !propertyType || !rentAmount || saveMut.isPending}
          className="w-full h-12 rounded-xl text-sm font-semibold"
        >
          {saveMut.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />Saving...</>
            : "Save changes"
          }
        </Button>
      </div>
    </div>
  );
}

function FieldWrap({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
      </Label>
      {children}
    </div>
  );
}
