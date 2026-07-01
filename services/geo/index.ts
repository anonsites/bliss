import "server-only";

import { isPrivateOrLocalIp, isValidCoordinate, type ResolvedGeoContext } from "@/lib/geo";
import { requestSupabaseRest } from "@/lib/supabase";

const DEFAULT_IPAPI_BASE_URL = "https://ipapi.co";

type IpApiLookupResponse = {
  bogon?: boolean;
  city?: string | null;
  country_name?: string | null;
  error?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  region?: string | null;
  reserved?: boolean;
};

function normalizeLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseCoordinate(value: number | string | null | undefined) {
  const coordinate = typeof value === "string" ? Number(value) : value;
  return isValidCoordinate(coordinate) ? coordinate : null;
}

export async function getGeoFromIP(ip: string | null): Promise<ResolvedGeoContext | null> {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return null;
  }

  const baseUrl = process.env.IPAPI_BASE_URL?.trim() || DEFAULT_IPAPI_BASE_URL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(ip)}/json/`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as IpApiLookupResponse;

    if (payload.error || payload.bogon || payload.reserved) {
      return null;
    }

    const latitude = parseCoordinate(payload.latitude);
    const longitude = parseCoordinate(payload.longitude);

    if (latitude === null || longitude === null) {
      return null;
    }

    return {
      city: normalizeLabel(payload.city),
      country: normalizeLabel(payload.country_name),
      latitude,
      longitude,
      region: normalizeLabel(payload.region),
      source: "ip",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function syncUserIpCityFromIP(userId: string, ip: string | null) {
  if (!userId) {
    return null;
  }

  try {
    const location = await getGeoFromIP(ip);

    if (!location?.city) {
      return null;
    }

    await requestSupabaseRest<unknown>("user_locations", {
      body: {
        ip_city: location.city,
      },
      headers: {
        Prefer: "return=minimal",
      },
      method: "PATCH",
      searchParams: new URLSearchParams({
        user_id: `eq.${userId}`,
      }),
    });

    return location.city;
  } catch {
    return null;
  }
}
