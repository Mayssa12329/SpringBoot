import { Coordinates } from './models';

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance a vol d'oiseau (Haversine), meme formule que GeoUtils cote backend. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

const relativeTime = new Intl.RelativeTimeFormat('fr', { numeric: 'always' });

export function timeAgo(isoDate: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(isoDate).getTime()) / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return relativeTime.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeTime.format(-hours, 'hour');
  return relativeTime.format(-Math.floor(hours / 24), 'day');
}

/** Lit "36.80, 10.18" ou "36,80 ; 10,18". Renvoie null si la position est invalide. */
export function parseCoordinates(text: string): Coordinates | null {
  const match = text.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1].replace(',', '.'));
  const lng = Number(match[2].replace(',', '.'));
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function formatCoordinates({ lat, lng }: Coordinates, decimals = 6): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}
