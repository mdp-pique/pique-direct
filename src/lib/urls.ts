export function propertyHref(p: { city: string; slug: string }) {
  return `/stays/${p.city}/${p.slug}`;
}
