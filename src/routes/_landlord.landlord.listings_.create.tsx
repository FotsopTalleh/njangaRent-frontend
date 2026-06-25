import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { listingsApi } from "@/api/listings.api";
import { ImageUpload } from "@/components/ImageUpload";
import { MapPicker } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_landlord/landlord/listings_/create")({
  head: () => ({ meta: [{ title: "New Listing — NjangaRent" }] }),
  component: CreateListing,
});

const PROPERTY_TYPES = [
  { value: "studio",          label: "Studio" },
  { value: "single_room",     label: "Single Room" },
  { value: "self_contained",  label: "Self-Contained" },
  { value: "apartment",       label: "Apartment" },
  { value: "hostel_block",    label: "Hostel Block" },
];

const RENT_PERIODS = [
  { value: "monthly",  label: "Monthly" },
  { value: "termly",   label: "Per Academic Term" },
  { value: "yearly",   label: "Yearly" },
];

const AMENITY_OPTIONS = [
  "water", "electricity", "wifi", "security", "furnished", "parking", "kitchen", "generator",
];

function CreateListing() {
  const navigate = useNavigate();

  // Core fields
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
  const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
  const [roomFiles,     setRoomFiles]     = useState<File[]>([]);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [error,         setError]         = useState<string | null>(null);
  const [created,       setCreated]       = useState(false);

  const toggleAmenity = (val: string) =>
    setAmenities((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val],
    );

  const create = useMutation({
    mutationFn: () => {
      if (exteriorFiles.length === 0) {
        throw new Error("At least one exterior image is required.");
      }

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
      exteriorFiles.forEach((f) => fd.append("exteriorImages", f));
      roomFiles.forEach((f) => fd.append("roomImages", f));

      return listingsApi.create(fd, setUploadPct);
    },
    onSuccess: () => setCreated(true),
    onError: (err: { message?: string }) => setError(err?.message ?? "Failed to create listing."),
  });

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center max-w-md mx-auto">
        <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold">Listing submitted</h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Your listing is now under admin review. It will go live once approved (usually within 24 hours).
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link to="/landlord/listings">Back to my listings</Link>
        </Button>
      </div>
    );
  }

  const canSubmit = title.trim() && propertyType && rentAmount && exteriorFiles.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-1 sm:px-0">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl gap-1.5">
          <Link to="/landlord/listings" aria-label="Back to my listings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New listing</h1>
          <p className="text-sm text-muted-foreground">Fill in your room details to get started.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5" aria-labelledby="section-basic">
          <h2 id="section-basic" className="font-semibold">Basic information</h2>

          <Field label="Listing title" required>
            <Input id="listing-title" className="rounded-xl h-11" placeholder="e.g. Clean self-contained near UB gate" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Property type" required>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="listing-type" className="rounded-xl h-11" aria-label="Property type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Max occupants">
              <Input id="listing-occupants" type="number" min={1} max={20} className="rounded-xl h-11" value={maxOccupants} onChange={(e) => setMaxOccupants(e.target.value)} />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              id="listing-desc"
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe the room, neighbourhood, what makes it great for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </section>

        {/* Pricing */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5" aria-labelledby="section-pricing">
          <h2 id="section-pricing" className="font-semibold">Pricing & availability</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Rent amount (XAF)" required>
              <Input id="listing-rent" type="number" min={1000} className="rounded-xl h-11" placeholder="e.g. 30000" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} />
            </Field>
            <Field label="Per">
              <Select value={rentPeriod} onValueChange={setRentPeriod}>
                <SelectTrigger id="listing-period" className="rounded-xl h-11" aria-label="Rent period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENT_PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Available from">
            <Input id="listing-avail" type="date" className="rounded-xl h-11" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
          </Field>
        </section>

        {/* Amenities */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4" aria-labelledby="section-amenities">
          <h2 id="section-amenities" className="font-semibold">Amenities</h2>
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

        {/* Location */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4" aria-labelledby="section-location">
          <h2 id="section-location" className="font-semibold">Location</h2>
          <MapPicker value={location} onChange={(lat, lng) => setLocation({ lat, lng })} />
        </section>

        {/* Images */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5" aria-labelledby="section-images">
          <h2 id="section-images" className="font-semibold">Photos</h2>
          <ImageUpload
            id="listing-exterior"
            label="Exterior / building photos (required — at least 1)"
            maxFiles={8}
            onChange={setExteriorFiles}
          />
          <ImageUpload
            id="listing-room"
            label="Room / interior photos (optional)"
            maxFiles={8}
            onChange={setRoomFiles}
          />
        </section>

        {/* Rules */}
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4" aria-labelledby="section-rules">
          <h2 id="section-rules" className="font-semibold">House rules</h2>
          <textarea
            id="listing-rules"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. No loud music after 10pm, no open flames..."
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

        {create.isPending && uploadPct > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Uploading photos... {uploadPct}%</p>
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
          onClick={() => create.mutate()}
          disabled={!canSubmit || create.isPending}
          className="w-full h-12 rounded-xl text-sm font-semibold"
        >
          {create.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              {uploadPct > 0 ? `Uploading ${uploadPct}%` : "Creating..."}
            </>
          ) : (
            "Submit listing for review"
          )}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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
