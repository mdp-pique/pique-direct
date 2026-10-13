import "server-only";
import type {
  HospitableCalendarDay,
  HospitableImage,
  HospitableProperty,
  HospitableQuote,
  HospitableReview,
} from "./types";

const BASE = "https://public.api.hospitable.com/v2";

// Every cached Hospitable read carries this tag, so POST /api/revalidate can
// refresh the whole site at once (e.g. from a Hospitable webhook).
export const HOSPITABLE_TAG = "hospitable";

// Listing content changes rarely; an hour keeps pages fresh without hammering the API.
const CONTENT_REVALIDATE = 3600;

export function hasHospitableToken() {
  return Boolean(process.env.HOSPITABLE_API_TOKEN);
}

async function call<T>(
  path: string,
  init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {},
): Promise<T> {
  const token = process.env.HOSPITABLE_API_TOKEN;
  if (!token) throw new Error("HOSPITABLE_API_TOKEN is not set");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HospitableError(res.status, `${init.method ?? "GET"} ${path} -> ${res.status} ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export class HospitableError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const cached = { next: { revalidate: CONTENT_REVALIDATE, tags: [HOSPITABLE_TAG] } };

export async function listProperties(): Promise<HospitableProperty[]> {
  const out: HospitableProperty[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await call<{ data: HospitableProperty[]; meta?: { last_page?: number } }>(
      `/properties?per_page=100&page=${page}`,
      cached,
    );
    out.push(...res.data);
    if (!res.meta?.last_page || page >= res.meta.last_page) break;
  }
  return out;
}

export async function getPropertyImages(uuid: string): Promise<HospitableImage[]> {
  const res = await call<{ data: HospitableImage[] }>(`/properties/${uuid}/images`, cached);
  return res.data;
}

export async function getPropertyReviews(
  uuid: string,
): Promise<{ reviews: HospitableReview[]; total: number }> {
  const res = await call<{ data: HospitableReview[]; meta?: { total?: number } }>(
    `/properties/${uuid}/reviews?per_page=100`,
    cached,
  );
  return { reviews: res.data, total: res.meta?.total ?? res.data.length };
}

// Availability and prices move all day, so they are cached for minutes, not hours.
export async function getCalendar(uuid: string, start: string, end: string): Promise<HospitableCalendarDay[]> {
  const res = await call<{ data: { days: HospitableCalendarDay[] } }>(
    `/properties/${uuid}/calendar?start_date=${start}&end_date=${end}`,
    { next: { revalidate: 300, tags: [HOSPITABLE_TAG] } },
  );
  return res.data.days;
}

// A quote prices a stay with Hospitable Direct's rules (rates, discounts, fees,
// taxes, min stay) and returns the Hospitable checkout link for it.
export async function createQuote(
  uuid: string,
  input: {
    checkin_date: string;
    checkout_date: string;
    guests: { adults: number; children?: number; infants?: number; pets?: number };
    promo_code?: string;
  },
): Promise<HospitableQuote> {
  const res = await call<{ data: HospitableQuote }>(`/properties/${uuid}/quote`, {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return res.data;
}
