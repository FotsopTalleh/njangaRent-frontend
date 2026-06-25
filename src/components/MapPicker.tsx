import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Well-known Buea neighbourhoods with approximate coordinates
const BUEA_NEIGHBOURHOODS = [
  { name: "Molyko",           lat: 4.1537,  lng: 9.2443,  desc: "Near UB campus" },
  { name: "Bonduma",          lat: 4.1580,  lng: 9.2350,  desc: "Residential area" },
  { name: "Great Soppo",      lat: 4.1610,  lng: 9.2270,  desc: "Quiet neighbourhood" },
  { name: "Small Soppo",      lat: 4.1620,  lng: 9.2310,  desc: "Near Great Soppo" },
  { name: "Santa Barbara",    lat: 4.1490,  lng: 9.2390,  desc: "Central Buea" },
  { name: "Buea Town",        lat: 4.1570,  lng: 9.2320,  desc: "Town centre" },
  { name: "Mile 16",          lat: 4.1370,  lng: 9.2640,  desc: "Commercial hub" },
  { name: "Mile 17",          lat: 4.1290,  lng: 9.2790,  desc: "Along Douala road" },
  { name: "Clerks Quarters",  lat: 4.1550,  lng: 9.2410,  desc: "Close to town" },
  { name: "Bokwango",         lat: 4.1450,  lng: 9.2180,  desc: "Hillside area" },
  { name: "Bomaka",           lat: 4.1420,  lng: 9.2560,  desc: "Near checkpoint" },
  { name: "Bwitingi",         lat: 4.1500,  lng: 9.2200,  desc: "Quiet residential" },
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const hasGoogleMaps = MAPS_KEY && MAPS_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

interface MapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function MapPicker({ value, onChange, className }: MapPickerProps) {
  const [selected, setSelected] = useState<string>("");
  const [customAddress, setCustomAddress] = useState("");

  // If Google Maps key is properly configured, use the original Google Maps picker
  if (hasGoogleMaps) {
    return <GoogleMapPicker value={value} onChange={onChange} className={className} />;
  }

  // Fallback: neighbourhood-based selector
  const handleSelect = (name: string) => {
    const hood = BUEA_NEIGHBOURHOODS.find((n) => n.name === name);
    if (hood) {
      setSelected(name);
      onChange(hood.lat, hood.lng);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-foreground">Select neighbourhood</p>

      {/* Neighbourhood grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Select a neighbourhood">
        {BUEA_NEIGHBOURHOODS.map((hood) => {
          const isActive = selected === hood.name;
          return (
            <button
              key={hood.name}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleSelect(hood.name)}
              className={cn(
                "flex items-start gap-2 p-3 rounded-xl border text-left transition-all duration-150",
                isActive
                  ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <MapPin
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className={cn(
                  "text-sm font-medium leading-tight",
                  isActive ? "text-primary" : "text-foreground",
                )}>
                  {hood.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  {hood.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom address (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="custom-address" className="text-sm font-medium text-foreground">
          Specific address <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="custom-address"
          type="text"
          placeholder="e.g. Behind UB Junction, opposite Total station"
          value={customAddress}
          onChange={(e) => setCustomAddress(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-11"
        />
      </div>

      {/* Selected feedback */}
      {selected && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
          <span>
            <strong>{selected}</strong>, Buea
            {value && ` — ${value.lat.toFixed(4)}°N, ${value.lng.toFixed(4)}°E`}
          </span>
        </p>
      )}
    </div>
  );
}

/* Original Google Maps implementation — used if API key is set */
function GoogleMapPicker({ value, onChange, className }: MapPickerProps) {
  // Dynamically import to avoid loading Google Maps SDK when not needed
  const { APIProvider, Map, AdvancedMarker } = require("@vis.gl/react-google-maps");

  const UB_CENTER = { lat: 4.1537, lng: 9.2443 };
  const center = value ?? UB_CENTER;

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <div
        className={cn("rounded-xl overflow-hidden border border-border h-64", className)}
        aria-label="Map — click to set listing location"
      >
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="njangrent-picker"
          disableDefaultUI
          gestureHandling="greedy"
          onClick={(e: any) => {
            if (e.detail.latLng) {
              onChange(e.detail.latLng.lat, e.detail.latLng.lng);
            }
          }}
        >
          {value && (
            <AdvancedMarker
              position={value}
              title="Listing location"
            />
          )}
        </Map>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        Click on the map to set the location of your property.
      </p>
    </APIProvider>
  );
}
