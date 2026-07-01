import "server-only";

type SupabaseMethod = "DELETE" | "GET" | "PATCH" | "POST";

type SupabaseRequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: SupabaseMethod;
  searchParams?: URLSearchParams;
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

export async function requestSupabaseRest<T>(
  path: string,
  {
    body,
    headers,
    method = "GET",
    searchParams,
  }: SupabaseRequestOptions = {},
): Promise<T> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase environment variables are missing. 
       NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}
       SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? "✓" : "✗ MISSING"}`
    );
  }

  const requestUrl = new URL(`/rest/v1/${path}`, supabaseUrl);

  if (searchParams) {
    requestUrl.search = searchParams.toString();
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("apikey", supabaseKey);
  requestHeaders.set("Authorization", `Bearer ${supabaseKey}`);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(requestUrl.toString(), {
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      headers: requestHeaders,
      method,
    });
  } catch (error) {
    throw new Error(
      `Supabase fetch failed for path "${path}" at URL "${requestUrl.toString()}": ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorBody}`);
  }

  const responseBody = await response.text();

  if (!responseBody) {
    return null as T;
  }

  return JSON.parse(responseBody) as T;
}

export async function querySupabaseRest<T>(
  path: string,
  searchParams?: URLSearchParams,
): Promise<T> {
  return requestSupabaseRest<T>(path, { searchParams });
}

export async function countSupabaseRest(
  path: string,
  searchParams?: URLSearchParams,
): Promise<number> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase environment variables are missing. 
       NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "âœ“" : "âœ— MISSING"}
       SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? "âœ“" : "âœ— MISSING"}`,
    );
  }

  const requestUrl = new URL(`/rest/v1/${path}`, supabaseUrl);
  const requestSearchParams = new URLSearchParams(searchParams);
  requestSearchParams.set("select", requestSearchParams.get("select") ?? "id");
  requestUrl.search = requestSearchParams.toString();

  const response = await fetch(requestUrl.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    method: "HEAD",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase count request failed (${response.status}): ${errorBody}`);
  }

  const contentRange = response.headers.get("content-range");
  const total = contentRange?.split("/")[1];

  if (!total || total === "*") {
    return 0;
  }

  const count = Number(total);
  return Number.isFinite(count) ? count : 0;
}
