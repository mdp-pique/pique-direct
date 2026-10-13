import type { MetadataRoute } from "next";
import { propertyHref } from "@/lib/urls";
import { getProperties } from "@/lib/properties";
import { CITIES, SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/stays`, changeFrequency: "daily", priority: 0.9 },
    ...Object.keys(CITIES).map((c) => ({ url: `${SITE.url}/stays/${c}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...properties.map((p) => ({ url: `${SITE.url}${propertyHref(p)}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
