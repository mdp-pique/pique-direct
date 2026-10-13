import "server-only";
import { cache } from "react";
import fixtures from "../../data/fixtures/properties.json";
import {
  getCalendar,
  getPropertyImages,
  getPropertyReviews,
  hasHospitableToken,
  listProperties,
} from "./hospitable/client";
import type { HospitableImage, HospitableProperty, HospitableReview } from "./hospitable/types";
import { CITIES, type CitySlug, cityFromName } from "./site";

// Everything a public page may show about a property. Built field by field from
// the Hospitable payload (an allowlist): the API also returns the house manual,
// building/door codes, wifi and streaming logins and the iCal feed, and none of
// that may ever reach a page, the sitemap, llms.txt or structured data.
export type PublicProperty = {
  id: string;
  slug: string;
  city: CitySlug;
  cityName: string;
  region: string;
  title: string;
  summary: string[];
  highlights: string[];
  description: string[];
  propertyType: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  sleeping: string[];
  amenities: string[];
  checkin: string | null;
  checkout: string | null;
  petsAllowed: boolean;
  childrenAllowed: boolean;
  // Rounded to ~1 km so the exact address is never published.
  geo: { lat: number; lng: number } | null;
  heroImage: string | null;
  currency: string;
};

export type PublicImage = { url: string; thumb: string; alt: string };
export type PublicReview = { id: string; rating: number; text: string; date: string; source: string };

// --- data access -----------------------------------------------------------

type FixtureEntry = {
  property: HospitableProperty;
  images: HospitableImage[];
  reviews: { total: number; reviews: HospitableReview[] };
};
const FIXTURES = (fixtures as unknown as { properties: FixtureEntry[] }).properties;

const rawProperties = cache(async (): Promise<HospitableProperty[]> => {
  if (!hasHospitableToken()) return FIXTURES.map((f) => f.property);
  return listProperties();
});

export const getProperties = cache(async (): Promise<PublicProperty[]> => {
  const raw = await rawProperties();
  const list = raw
    .filter((p) => p.listed)
    .map(toPublicProperty)
    .filter((p): p is PublicProperty => p !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
  // Hospitable's `picture` is usually Airbnb's small thumbnail on Airbnb's own
  // image host, so the cover is the first full-size photo from the gallery.
  await mapLimit(list, 8, async (p) => {
    const first = (await getImages(p.id).catch(() => []))[0];
    p.heroImage = first?.url ?? null;
  });
  return list;
});

export async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

// --- availability ----------------------------------------------------------

export type StayDay = {
  date: string;
  available: boolean;
  price: number;
  minStay: number;
  noCheckin: boolean;
  noCheckout: boolean;
};

// Twelve months of calendar from today. The same request (and cache entry)
// serves the booking calendar and date search.
export const getYearCalendar = cache(async (id: string): Promise<StayDay[]> => {
  const start = new Date();
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const days = await getCalendar(id, iso(start), iso(end));
  return days.map((d) => ({
    date: d.date,
    available: d.status.available,
    price: d.price.amount,
    minStay: d.min_stay,
    noCheckin: d.closed_for_checkin,
    noCheckout: d.closed_for_checkout,
  }));
});

// Can this stay be booked? Every night must be open, the check-in day must
// allow arrival and meet its minimum stay, and the check-out day must allow
// departure. Returns the summed nightly rate (cents, before fees and taxes).
export function checkStay(days: StayDay[], checkin: string, checkout: string): { ok: true; nightly: number; nights: number } | { ok: false } {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const first = byDate.get(checkin);
  if (!first || first.noCheckin) return { ok: false };
  let total = 0;
  let nights = 0;
  for (let d = checkin; d < checkout; d = addDay(d)) {
    const day = byDate.get(d);
    if (!day?.available) return { ok: false };
    total += day.price;
    nights++;
  }
  if (nights < Math.max(1, first.minStay)) return { ok: false };
  if (byDate.get(checkout)?.noCheckout) return { ok: false };
  return { ok: true, nightly: total, nights };
}

function addDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function getPropertiesInCity(city: CitySlug) {
  return (await getProperties()).filter((p) => p.city === city);
}

// Slugs end in the first 8 characters of the Hospitable id, so a renamed
// listing keeps working: the page redirects to the new slug instead of 404ing.
export async function findPropertyBySlug(slug: string) {
  const key = slug.slice(-8);
  return (await getProperties()).find((p) => p.id.startsWith(key)) ?? null;
}

export async function getPropertyById(id: string) {
  return (await getProperties()).find((p) => p.id === id) ?? null;
}

export const getImages = cache(async (id: string): Promise<PublicImage[]> => {
  const raw = hasHospitableToken()
    ? await getPropertyImages(id)
    : (FIXTURES.find((f) => f.property.id === id)?.images ?? []);
  return raw
    .filter((img) => !isInstructionImage(img.caption))
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ url: img.url, thumb: img.thumbnail_url, alt: cleanCaption(img.caption) }));
});

export const getReviews = cache(
  async (id: string): Promise<{ reviews: PublicReview[]; total: number; average: number | null }> => {
    const raw = hasHospitableToken()
      ? await getPropertyReviews(id)
      : (FIXTURES.find((f) => f.property.id === id)?.reviews ?? { total: 0, reviews: [] });
    // Only the public review text is used. Private guest feedback and category
    // scores are never read from the payload.
    const reviews = raw.reviews
      .filter((r) => r.public?.rating && r.public.review && r.public.review.trim().length > 0)
      .map((r) => ({
        id: r.id,
        rating: r.public.rating as number,
        text: r.public.review!.trim(),
        date: r.reviewed_at,
        source: platformName(r.platform),
      }));
    const rated = raw.reviews.map((r) => r.public?.rating).filter((n): n is number => typeof n === "number" && n > 0);
    const average = rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 100) / 100 : null;
    return { reviews, total: raw.total, average };
  },
);

// --- mapping ---------------------------------------------------------------

export function toPublicProperty(p: HospitableProperty): PublicProperty | null {
  const city = cityFromName(p.address?.city);
  if (!city) return null;
  const title = cleanTitle(p.public_name || p.name);
  const lat = Number(p.address.coordinates?.latitude);
  const lng = Number(p.address.coordinates?.longitude);
  const { summary, highlights } = splitSummary(p.summary);
  return {
    id: p.id,
    slug: `${slugify(title)}-${p.id.slice(0, 8)}`,
    city,
    cityName: CITIES[city].name,
    region: CITIES[city].region,
    title,
    summary,
    highlights,
    description: cleanDescription(p.description),
    propertyType: humanize(p.property_type ?? "home"),
    guests: p.capacity?.max ?? 0,
    bedrooms: p.capacity?.bedrooms ?? 0,
    beds: p.capacity?.beds ?? 0,
    bathrooms: p.capacity?.bathrooms ?? 0,
    sleeping: sleepingArrangements(p.room_details ?? []),
    amenities: (p.amenities ?? []).map(amenityLabel).filter((a): a is string => a !== null),
    checkin: p.checkin,
    checkout: p.checkout,
    petsAllowed: Boolean(p.house_rules?.pets_allowed),
    childrenAllowed: p.house_rules?.children_allowed !== false,
    geo: Number.isFinite(lat) && Number.isFinite(lng) ? { lat: round2(lat), lng: round2(lng) } : null,
    heroImage: null,
    currency: p.currency || "CAD",
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function cleanTitle(name: string) {
  return name
    .replace(/[★☆✓✔⚡✨❤♥️•✦‣]+/gu, " · ")
    .replace(/^\s*[·\s]*NEW\b\s*/i, "")
    .replace(/#\d+[A-Z]?\s*(&\s*#\d+[A-Z]?)?/g, "")
    .replace(/[*|]+/g, " · ")
    .replace(/\s*-\s+|\s+-\s*/g, " · ")
    .replace(/\s*·\s*(·\s*)+/g, " · ")
    .replace(/^[\s·]+|[\s·!]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 8)
    .join("-");
}

// The Hospitable summary is a headline, a "What we offer" checklist and a sign-off.
function splitSummary(text: string | null) {
  const summary: string[] = [];
  const highlights: string[] = [];
  for (const raw of (text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[✔✓•‣·-]/.test(line)) highlights.push(line.replace(/^[✔✓•‣·-]+\s*/, ""));
    else if (!/^what we offer/i.test(line) && !/book your .* (now|today)/i.test(line)) summary.push(line);
  }
  return { summary, highlights };
}

// The listing text was written for Airbnb: drop the booking disclaimer, the
// policies block (it references Airbnb's checkout and insurance) and any line
// that mentions a platform. AI-rewritten direct-booking copy will replace this.
function cleanDescription(text: string | null): string[] {
  if (!text) return [];
  const cut = text.split(/\n[^\n]*IMPORTANT NOTES/i)[0];
  return cut
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split("\n")
        .filter((l) => !/airbnb|vrbo|booking\.com|by booking, you're confirming/i.test(l))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function isInstructionImage(caption: string | null) {
  return Boolean(caption && /\bQR\b|award tag/i.test(caption));
}

function cleanCaption(caption: string | null) {
  return (caption ?? "").replace(/\s+/g, " ").trim();
}

function platformName(p: string) {
  return ({ airbnb: "Airbnb", booking: "Booking.com", homeaway: "Vrbo", direct: "Direct" } as Record<string, string>)[p] ?? "Guest";
}

function humanize(s: string) {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const BED_NAMES: Record<string, string> = {
  king_bed: "king bed",
  queen_bed: "queen bed",
  double_bed: "double bed",
  single_bed: "single bed",
  sofa_bed: "sofa bed",
  bunk_bed: "bunk bed",
  twin_bed: "twin bed",
  futon: "futon",
  air_mattress: "air mattress",
  crib: "crib",
};

function sleepingArrangements(rooms: NonNullable<HospitableProperty["room_details"]>) {
  let bedroom = 0;
  const out: string[] = [];
  for (const room of rooms) {
    if (!room.beds?.length) continue;
    const beds = room.beds
      .map((b) => `${b.quantity > 1 ? `${b.quantity} ` : ""}${BED_NAMES[b.type] ?? humanize(b.type).toLowerCase()}${b.quantity > 1 ? "s" : ""}`)
      .join(", ");
    const label = room.type === "bedroom" ? `Bedroom ${++bedroom}` : humanize(room.type);
    out.push(`${label}: ${beds}`);
  }
  return out;
}

// Hospitable amenity codes worth showing, in a guest's words. Codes not listed
// here (cleaning products, hangers, ...) are left out on purpose.
const AMENITIES: Record<string, string> = {
  jacuzzi: "Hot tub",
  hot_tub: "Hot tub",
  sauna: "Sauna",
  pool: "Pool",
  gym: "Gym",
  exercise_equipment: "Gym",
  fireplace: "Fireplace",
  fire_pit: "Fire pit",
  bbq: "BBQ",
  bbq_area: "BBQ",
  ac: "Air conditioning",
  wifi: "Fast WiFi",
  wireless_internet: "Fast WiFi",
  tv: "Smart TV",
  kitchen: "Full kitchen",
  dishwasher: "Dishwasher",
  coffee_maker: "Coffee maker",
  washer: "Washer",
  dryer: "Dryer",
  free_parking: "Free parking",
  free_on_premise_parking: "Free parking",
  garage: "Garage",
  patio: "Patio",
  patio_or_belcony: "Balcony",
  garden_or_backyard: "Backyard",
  laptop_friendly_workspace: "Workspace",
  long_term_stays_allowed: "Long stays welcome",
  high_chair: "High chair",
  crib: "Crib",
  pack_n_play_travel_crib: "Pack 'n play",
  board_games: "Board games",
  elevator: "Elevator",
  resort_access: "Resort amenities",
  room_darkening_shades: "Blackout shades",
  ev_charger: "EV charger",
};

function amenityLabel(code: string) {
  return AMENITIES[code] ?? null;
}

export function uniqueAmenities(list: string[]) {
  return [...new Set(list)];
}
