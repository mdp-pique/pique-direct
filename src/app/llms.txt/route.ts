import { propertyHref } from "@/lib/urls";
import { SPACE_TYPES, getProperties } from "@/lib/properties";
import { CITIES, type CitySlug, SITE } from "@/lib/site";

export const revalidate = 3600;

// llms.txt: a plain-text map of the site for AI assistants (https://llmstxt.org).
export async function GET() {
  const properties = await getProperties();
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Every home below can be booked directly on this site. Each page shows live availability, nightly prices and a full price breakdown (fees, taxes, discounts) before checkout. Checkout is handled securely by Stripe.",
    "",
  ];
  for (const city of Object.keys(CITIES) as CitySlug[]) {
    const list = properties.filter((p) => p.city === city);
    if (!list.length) continue;
    lines.push(`## ${CITIES[city].name}, Alberta`, "", CITIES[city].intro, "", `- [All ${CITIES[city].name} stays](${SITE.url}/stays/${city})`);
    for (const p of list) {
      const facts = [
        `sleeps ${p.guests}`,
        `${p.bedrooms} bedroom${p.bedrooms === 1 ? "" : "s"}`,
        `${p.bathrooms} bath`,
        p.petsAllowed ? "pet friendly" : null,
        ...[...new Set(p.amenities)].filter((a) => ["Hot tub", "Sauna", "Pool", "Fireplace", "Air conditioning", "Garage"].includes(a)),
      ].filter(Boolean);
      lines.push(`- [${p.title}](${SITE.url}${propertyHref(p)}): ${SPACE_TYPES[p.spaceType].toLowerCase()}, ${facts.join(", ")}`);
    }
    lines.push("");
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
