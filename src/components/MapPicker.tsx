import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const UB_CENTER = { lat: 4.1537, lng: 9.2443 };
const MAPS_KEY  = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

interface MapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function MapPicker({ value, onChange, className }: MapPickerProps) {
  const center = value ?? UB_CENTER;

  if (!MAPS_KEY) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-border bg-muted h-64 text-sm text-muted-foreground ${className ?? ""}`}>
        Google Maps API key not configured.
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY}>
      <div
        className={`rounded-xl overflow-hidden border border-border h-64 ${className ?? ""}`}
        aria-label="Map — drag the marker to set listing location"
      >
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="njangrent-picker"
          disableDefaultUI
          gestureHandling="greedy"
          onClick={(e) => {
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
