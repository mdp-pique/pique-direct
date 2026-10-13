export const SITE = {
  name: "Pique Properties",
  shortName: "Pique",
  tagline: "Design-forward stays in Edmonton, Canmore and Calgary",
  description:
    "Book Pique Properties' homes directly: hot tubs, saunas, mountain views and city stays across Edmonton, Canmore and Calgary, with live pricing, no platform service fee and a local team on call.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://piquelifestyle.com").replace(/\/$/, ""),
  locale: "en_CA",
  // Main line for calls and texts (from piquelifestyle.com).
  phone: { e164: "+17802300267", display: "1-780-230-0267" },
};

export type CitySlug = "edmonton" | "canmore" | "calgary";

export const CITIES: Record<
  CitySlug,
  { name: string; region: string; headline: string; intro: string; hero?: string }
> = {
  edmonton: {
    name: "Edmonton",
    region: "Alberta",
    headline: "Edmonton stays with room to breathe",
    intro:
      "Private hot tubs, barrel saunas, king beds and garages for winter. Homes and suites near Whyte Avenue, West Edmonton Mall, downtown and the river valley, for families, teams and longer work stays.",
  },
  canmore: {
    name: "Canmore",
    region: "Alberta",
    headline: "Canmore, in the heart of the Rockies",
    intro:
      "Resort condos and mountain homes minutes from downtown Canmore and Banff National Park. Pools, hot tubs, fireplaces and balconies facing the Three Sisters.",
  },
  calgary: {
    name: "Calgary",
    region: "Alberta",
    headline: "Calgary, close to everything",
    intro: "Comfortable, well-equipped homes in Calgary, an hour from the mountains.",
  },
};

export function cityFromName(name: string | null | undefined): CitySlug | null {
  const key = (name ?? "").trim().toLowerCase();
  return key in CITIES ? (key as CitySlug) : null;
}
