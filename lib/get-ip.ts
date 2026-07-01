import "server-only";

import { headers } from "next/headers";

function sanitizeIp(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  let value = rawValue.trim().replace(/^for=/i, "").replace(/^"|"$/g, "");

  if (!value) {
    return null;
  }

  if (value.startsWith("::ffff:")) {
    value = value.slice(7);
  }

  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  }

  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(value)) {
    value = value.split(":")[0];
  }

  return value || null;
}

export function extractClientIp(headersList: Headers) {
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  if (forwarded) {
    const firstForwardedIp = forwarded.split(",")[0];
    return sanitizeIp(firstForwardedIp);
  }

  return sanitizeIp(realIp);
}

export async function getUserIP(providedHeaders?: Headers | null) {
  if (providedHeaders) {
    return extractClientIp(providedHeaders);
  }

  const headerStore = await headers();
  return extractClientIp(headerStore);
}
