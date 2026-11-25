import type { MetadataRoute } from "next";
import { propertyHref } from "@/lib/urls";
import { getProperties } from "@/lib/properties";
import { INFO_PAGES } from "@/content/info";
import { CITIES, SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/stays`, changeFrequency: "daily", priority: 0.9 },
    ...Object.keys(CITIES).map((c) => ({ url: `${SITE.url}/stays/${c}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...INFO_PAGES.map((p) => ({ url: `${SITE.url}/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...properties.map((p) => ({ url: `${SITE.url}${propertyHref(p)}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
