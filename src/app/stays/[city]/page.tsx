import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PropertyCard } from "@/components/PropertyCard";
import { propertyHref } from "@/lib/urls";
import { Reveal } from "@/components/Reveal";
import { SearchBar } from "@/components/SearchBar";
import { getPropertiesInCity } from "@/lib/properties";
import { CITIES, SITE, cityFromName } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = cityFromName((await params).city);
  if (!city) return {};
  const c = CITIES[city];
  const count = (await getPropertiesInCity(city)).length;
  return {
    title: `${c.name} vacation rentals`,
    description: `${count} ${c.name} vacation rentals you can book directly. ${c.intro}`.slice(0, 300),
    alternates: { canonical: `/stays/${city}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const city = cityFromName((await params).city);
  if (!city) notFound();
  const c = CITIES[city];
  const list = await getPropertiesInCity(city);
  const petFriendly = list.filter((p) => p.petsAllowed).length;
  const hotTubs = list.filter((p) => p.amenities.includes("Hot tub")).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${c.name} vacation rentals by ${SITE.name}`,
          itemListElement: list.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}${propertyHref(p)}`,
            name: p.title,
          })),
        }}
      />
      <p className="rise text-xs font-semibold uppercase tracking-[0.3em] text-ember">{c.name}, {c.region}</p>
      <h1 className="font-display rise mt-3 max-w-3xl text-5xl font-medium leading-[1] sm:text-6xl">{c.headline}</h1>
      <p className="rise mt-5 max-w-2xl text-lg text-ink-soft" style={{ animationDelay: "120ms" }}>
        {c.intro}
      </p>
      {/* A plain-language fact line: easy for search snippets and AI answers to lift. */}
      <p className="mt-4 text-sm text-muted">
        {list.length} {list.length === 1 ? "home" : "homes"} in {c.name}
        {hotTubs ? ` · ${hotTubs} with a hot tub` : ""}
        {petFriendly ? ` · ${petFriendly} pet friendly` : ""}
      </p>
      <div className="mt-8">
        <SearchBar initial={{ city }} />
      </div>
      <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <PropertyCard p={p} priority={i < 3} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
