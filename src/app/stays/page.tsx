import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { Reveal } from "@/components/Reveal";
import { SearchBar } from "@/components/SearchBar";
import { getProperties } from "@/lib/properties";
import { CITIES, type CitySlug } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All stays",
  description: "Every Pique Properties vacation rental in Edmonton, Canmore and Calgary, bookable directly.",
  alternates: { canonical: "/stays" },
};

export default async function Stays() {
  const properties = await getProperties();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <h1 className="font-display text-5xl font-medium sm:text-6xl">All stays</h1>
      <div className="mt-8">
        <SearchBar />
      </div>
      {(Object.keys(CITIES) as CitySlug[]).map((city) => {
        const list = properties.filter((p) => p.city === city);
        if (!list.length) return null;
        return (
          <section key={city} className="pt-16">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
              <h2 className="font-display text-3xl">{CITIES[city].name}</h2>
              <Link href={`/stays/${city}`} className="text-sm font-medium text-ember hover:underline">
                {list.length} {list.length === 1 ? "home" : "homes"} →
              </Link>
            </div>
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 80}>
                  <PropertyCard p={p} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
