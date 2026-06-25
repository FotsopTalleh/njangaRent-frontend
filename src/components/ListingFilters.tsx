import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { BrowseListingsParams, ListingPropertyType } from "@/api/listings.api";

const PROPERTY_TYPES: { value: ListingPropertyType | "all"; label: string }[] = [
  { value: "all",             label: "All types" },
  { value: "studio",          label: "Studio" },
  { value: "single_room",     label: "Single Room" },
  { value: "self_contained",  label: "Self-Contained" },
  { value: "apartment",       label: "Apartment" },
  { value: "hostel_block",    label: "Hostel Block" },
];

const AMENITIES_OPTIONS = [
  { value: "water",         label: "Water" },
  { value: "electricity",   label: "Electricity" },
  { value: "wifi",          label: "WiFi" },
  { value: "security",      label: "Security" },
  { value: "furnished",     label: "Furnished" },
  { value: "parking",       label: "Parking" },
  { value: "kitchen",       label: "Kitchen" },
  { value: "generator",     label: "Generator" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "closest",    label: "Closest to Molyko" },
];

interface ListingFiltersProps {
  params: BrowseListingsParams;
  onChange: (params: BrowseListingsParams) => void;
  className?: string;
}

export function ListingFilters({ params, onChange, className }: ListingFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedAmenities = params.amenities ? params.amenities.split(",").filter(Boolean) : [];

  const toggleAmenity = (val: string) => {
    const next = selectedAmenities.includes(val)
      ? selectedAmenities.filter((a) => a !== val)
      : [...selectedAmenities, val];
    onChange({ ...params, amenities: next.join(",") });
  };

  const clearAll = () =>
    onChange({ sort: "newest" });

  const hasFilters =
    params.propertyType ||
    params.minRent ||
    params.maxRent ||
    params.amenities ||
    params.maxDistanceKm;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Top bar: sort + expand toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={params.sort ?? "newest"}
          onValueChange={(v) => onChange({ ...params, sort: v as BrowseListingsParams["sort"] })}
        >
          <SelectTrigger id="filter-sort" className="w-44 h-9 text-sm" aria-label="Sort listings">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          aria-controls="listing-filters-panel"
          className="gap-1.5 h-9"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
          {hasFilters && (
            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
              !
            </span>
          )}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 text-muted-foreground hover:text-foreground">
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          id="listing-filters-panel"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-4 rounded-xl border border-border bg-card"
        >
          {/* Property type */}
          <div className="space-y-2">
            <label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <Select
              value={params.propertyType ?? "all"}
              onValueChange={(v) =>
                onChange({ ...params, propertyType: v === "all" ? undefined : (v as ListingPropertyType) })
              }
            >
              <SelectTrigger id="filter-type" className="h-9 text-sm" aria-label="Filter by property type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rent range */}
          <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rent (XAF)
            </p>
            <div className="flex items-center gap-2">
              <input
                id="filter-min-rent"
                type="number"
                min={0}
                placeholder="Min"
                value={params.minRent ?? ""}
                onChange={(e) => onChange({ ...params, minRent: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Minimum rent in XAF"
              />
              <span className="text-muted-foreground text-sm shrink-0">–</span>
              <input
                id="filter-max-rent"
                type="number"
                min={0}
                placeholder="Max"
                value={params.maxRent ?? ""}
                onChange={(e) => onChange({ ...params, maxRent: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Maximum rent in XAF"
              />
            </div>
          </div>

          {/* Distance from Molyko */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Max distance from Molyko:{" "}
              <span className="text-foreground font-semibold">
                {params.maxDistanceKm ? `${params.maxDistanceKm} km` : "Any"}
              </span>
            </p>
            <Slider
              id="filter-distance"
              min={0.5}
              max={15}
              step={0.5}
              value={[params.maxDistanceKm ?? 15]}
              onValueChange={([v]) =>
                onChange({ ...params, maxDistanceKm: v >= 15 ? undefined : v })
              }
              aria-label="Maximum distance from Molyko centre in kilometres"
            />
          </div>

          {/* Amenities */}
          <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amenities</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by amenities">
              {AMENITIES_OPTIONS.map((a) => {
                const active = selectedAmenities.includes(a.value);
                return (
                  <button
                    key={a.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleAmenity(a.value)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary",
                    )}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
