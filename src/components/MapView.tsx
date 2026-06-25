import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { ExternalLink } from "lucide-react";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

interface MapViewProps {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
}

export function MapView({ lat, lng, label = "Listing location", className }: MapViewProps) {
  const position  = { lat, lng };
  const mapsUrl   = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (!MAPS_KEY) {
    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        aria-label="Open directions in Google Maps"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Get directions
      </a>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <APIProvider apiKey={MAPS_KEY}>
        <div
          className="rounded-xl overflow-hidden border border-border h-52"
          aria-label={label}
        >
          <Map
            defaultCenter={position}
            defaultZoom={15}
            mapId="njangrent-view"
            disableDefaultUI
            gestureHandling="none"
          >
            <AdvancedMarker position={position} title={label} />
          </Map>
        </div>
      </APIProvider>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        aria-label="Open directions in Google Maps"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Get directions
      </a>
    </div>
  );
}
