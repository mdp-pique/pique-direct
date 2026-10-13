import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { AMENITY_FILTERS, SPACE_ORDER } from "../filters";
import { DEFAULT_PARTY, type Party } from "../party";
import { SPACE_TYPES, findPropertyBySlug, getReviews, uniqueAmenities, type SpaceType } from "../properties";
import { priceStay } from "../quote";
import { searchHomes } from "../search";
import { cityFromName } from "../site";
import { propertyHref } from "../urls";

// Ask Pique's only tools. Each reads the same public-only data the pages use
// (toPublicProperty allowlist), so the assistant can't reach house manuals,
// access codes, bookings or anything in the ops database.

const DATE = { type: "string", description: "YYYY-MM-DD" } as const;
const AMENITY_LABELS = AMENITY_FILTERS.map((a) => a.label as string);

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_homes",
    description:
      "Find homes. With checkin and checkout, returns only homes free for the whole stay. Returns up to 8. Has no prices: use price_stay for those.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        city: { type: ["string", "null"], enum: ["edmonton", "canmore", "calgary", null] },
        checkin: { ...DATE, type: ["string", "null"] },
        checkout: { ...DATE, type: ["string", "null"] },
        adults: { type: "integer" },
        children: { type: "integer", description: "Ages 2 to 12" },
        infants: { type: "integer", description: "Under 2; don't count toward the guest limit" },
        pets: { type: "integer" },
        home_type: { type: ["string", "null"], enum: [...SPACE_ORDER, null], description: Object.entries(SPACE_TYPES).map(([k, v]) => `${k} = ${v}`).join(", ") },
        amenities: { type: "array", items: { type: "string", enum: AMENITY_LABELS } },
      },
      required: ["city", "checkin", "checkout", "adults", "children", "infants", "pets", "home_type", "amenities"],
    },
  },
  {
    name: "get_home",
    description: "Public details of one home: layout, beds, amenities, rules, check-in/out times, rating and a few guest reviews.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: { url: { type: "string", description: "The home's url from search_homes" } },
      required: ["url"],
    },
  },
  {
    name: "price_stay",
    description:
      "Exact price for one home and stay from the booking system: nightly total, fees, discounts, taxes and the total. Fails if the dates aren't available. Use it to compare dates or lengths of stay.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        url: { type: "string", description: "The home's url from search_homes" },
        checkin: DATE,
        checkout: DATE,
        adults: { type: "integer" },
        children: { type: "integer" },
        infants: { type: "integer" },
        pets: { type: "integer" },
      },
      required: ["url", "checkin", "checkout", "adults", "children", "infants", "pets"],
    },
  },
  {
    name: "offer_contact",
    description: "Show the guest Call and Text buttons for the Pique team. Use it whenever the rules say to hand off.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: "string", description: "Short reason, e.g. 'wants a lower price', 'existing booking'" },
        text_message: { type: "string", description: "A short first text the guest could send the team, written as the guest, with the home and dates if known" },
      },
      required: ["reason", "text_message"],
    },
  },
];

export type ToolContext = { quotes: number; contact: { text: string } | null; linkedHomes: Set<string> };

const MAX_QUOTES = 6;

export async function runTool(name: string, input: Record<string, unknown>, ctx: ToolContext): Promise<string> {
  switch (name) {
    case "search_homes": {
      const party = partyOf(input);
      const checkin = str(input.checkin);
      const checkout = str(input.checkout);
      const type = SPACE_ORDER.includes(input.home_type as SpaceType) ? (input.home_type as SpaceType) : null;
      const amenities = Array.isArray(input.amenities) ? input.amenities.filter((a): a is string => AMENITY_LABELS.includes(a as string)) : [];
      const { results, liveChecked } = await searchHomes({
        city: cityFromName(str(input.city)),
        checkin: checkin && checkout && checkout > checkin ? checkin : undefined,
        checkout: checkin && checkout && checkout > checkin ? checkout : undefined,
        party,
        type,
        amenities,
      });
      const homes = results.slice(0, 8).map(({ p }) => {
        ctx.linkedHomes.add(propertyHref(p));
        return {
          name: p.title,
          url: propertyHref(p),
          type: SPACE_TYPES[p.spaceType],
          city: p.cityName,
          sleeps: p.guests,
          bedrooms: p.bedrooms,
          pet_friendly: p.petsAllowed,
          highlights: uniqueAmenities(p.amenities).slice(0, 8),
        };
      });
      return JSON.stringify({
        availability_checked: liveChecked,
        total_matches: results.length,
        prices: "Not included. Call price_stay for the real direct-booking price before naming any amount.",
        homes,
        ...(!liveChecked && checkin ? { note: "Live availability unavailable; don't promise these are free." } : {}),
      });
    }
    case "get_home": {
      const p = await homeFromUrl(input.url);
      if (!p) return JSON.stringify({ error: "Unknown home. Use a url from search_homes." });
      ctx.linkedHomes.add(propertyHref(p));
      const reviews = await getReviews(p.id).catch(() => null);
      return JSON.stringify({
        name: p.title,
        url: propertyHref(p),
        type: SPACE_TYPES[p.spaceType],
        city: p.cityName,
        sleeps: p.guests,
        bedrooms: p.bedrooms,
        beds: p.beds,
        bathrooms: p.bathrooms,
        sleeping: p.sleeping,
        amenities: uniqueAmenities(p.amenities),
        highlights: p.highlights,
        summary: p.summary.join(" "),
        description: p.description.slice(0, 3).join("\n\n"),
        checkin_from: p.checkin,
        checkout_by: p.checkout,
        pets_allowed: p.petsAllowed,
        rating: reviews?.average ?? null,
        review_count: reviews?.total ?? 0,
        recent_reviews: (reviews?.reviews ?? []).slice(0, 3).map((r) => r.text),
      });
    }
    case "price_stay": {
      if (ctx.quotes >= MAX_QUOTES) return JSON.stringify({ error: "Price check limit reached for this message. Use the prices you have." });
      ctx.quotes++;
      const p = await homeFromUrl(input.url);
      if (!p) return JSON.stringify({ error: "Unknown home. Use a url from search_homes." });
      const r = await priceStay(p, { checkin: str(input.checkin) ?? "", checkout: str(input.checkout) ?? "", party: partyOf(input) });
      if (!r.ok) return JSON.stringify({ error: r.error });
      ctx.linkedHomes.add(propertyHref(p));
      return JSON.stringify({
        home: p.title,
        nights: r.nights,
        lines: r.lines,
        total: r.total,
        // The page opens with these dates picked; Book now there goes to checkout.
        book_url: `${propertyHref(p)}?checkin=${str(input.checkin)}&checkout=${str(input.checkout)}&adults=${partyOf(input).adults}`,
      });
    }
    case "offer_contact": {
      ctx.contact = { text: (str(input.text_message) ?? "Hi, I have a question about a stay.").slice(0, 400) };
      return JSON.stringify({ shown: true });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

async function homeFromUrl(url: unknown) {
  const slug = (str(url) ?? "").split("?")[0].split("/").filter(Boolean).pop() ?? "";
  return slug.length >= 8 ? findPropertyBySlug(slug) : null;
}

function partyOf(input: Record<string, unknown>): Party {
  const n = (v: unknown, min: number, max: number, d: number) => {
    const x = Math.floor(Number(v));
    return Number.isFinite(x) ? Math.min(Math.max(x, min), max) : d;
  };
  return {
    adults: n(input.adults, 1, 30, DEFAULT_PARTY.adults),
    children: n(input.children, 0, 30, 0),
    infants: n(input.infants, 0, 4, 0),
    pets: n(input.pets, 0, 4, 0),
  };
}

function str(v: unknown) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
