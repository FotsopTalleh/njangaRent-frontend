// src/utils/haversine.ts — Client-side distance calculation
// Reference point: Molyko centre / Buea town centre
const MOLYKO_LAT = 4.1537;
const MOLYKO_LNG = 9.2443;

export function haversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/** Distance in km from given coords to Molyko centre. */
export function distanceFromMolyko(lat: number, lng: number): number {
  return haversine(MOLYKO_LAT, MOLYKO_LNG, lat, lng);
}

/** @deprecated use distanceFromMolyko */
export const distanceFromUB = distanceFromMolyko;

/** Format a distance number for display. e.g. "1.2 km from Molyko" */
export function formatDistance(km: number | null | undefined): string {
  if (km == null) return "Location unknown";
  if (km < 0.3)  return "Central Molyko";
  if (km < 1)    return `${Math.round(km * 1000)} m from Molyko`;
  return `${km.toFixed(1)} km from Molyko`;
}
