export type GeoLookupSource = "gps" | "ip" | "none";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ResolvedGeoContext extends Coordinates {
  city: string | null;
  country: string | null;
  region: string | null;
  source: Exclude<GeoLookupSource, "none">;
}

const EARTH_RADIUS_KM = 6371;

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^::1$/i,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function hoursSince(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(0, (Date.now() - date.getTime()) / 3_600_000);
}

export function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function coordinatesFromValues(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export function isPrivateOrLocalIp(ip: string | null) {
  if (!ip) {
    return true;
  }

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

export function haversineDistanceKm(origin: Coordinates, target: Coordinates) {
  const deltaLatitude = toRadians(target.latitude - origin.latitude);
  const deltaLongitude = toRadians(target.longitude - origin.longitude);
  const latitudeA = toRadians(origin.latitude);
  const latitudeB = toRadians(target.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function formatApproximateDistance(
  distanceKm: number,
  precision: "coarse" | "fine" = "coarse",
) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 1) {
    return "Nearby";
  }

  if (precision === "fine") {
    return `~${Math.max(1, Math.round(distanceKm))}km away`;
  }

  if (distanceKm < 8) {
    return "Close by";
  }

  if (distanceKm < 30) {
    const roundedToFive = Math.max(5, Math.round(distanceKm / 5) * 5);
    return `~${roundedToFive}km away`;
  }

  if (distanceKm < 120) {
    return "In your area";
  }

  return "Regional";
}

export function formatRelativeActivity(dateValue: string | null | undefined) {
  if (!dateValue) {
    return "Recently active";
  }

  const elapsedHours = hoursSince(dateValue);

  if (elapsedHours === null) {
    return "Recently active";
  }

  if (elapsedHours < 0.1) {
    return "Online";
  }

  if (elapsedHours < 1) {
    return `Active ${Math.max(1, Math.round(elapsedHours * 60))}m ago`;
  }

  if (elapsedHours < 24) {
    return `Active ${Math.round(elapsedHours)}h ago`;
  }

  if (elapsedHours < 24 * 7) {
    return `Active ${Math.round(elapsedHours / 24)}d ago`;
  }

  return "Recently active";
}

export function formatElapsedCompact(dateValue: string | null | undefined) {
  if (!dateValue) {
    return undefined;
  }

  const elapsedHours = hoursSince(dateValue);

  if (elapsedHours === null) {
    return undefined;
  }

  if (elapsedHours < 1) {
    return `${Math.max(1, Math.round(elapsedHours * 60))}m`;
  }

  if (elapsedHours < 24) {
    return `${Math.round(elapsedHours)}h`;
  }

  return `${Math.round(elapsedHours / 24)}d`;
}
