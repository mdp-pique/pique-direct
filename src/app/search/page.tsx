import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { Reveal } from "@/components/Reveal";
import { SearchBar } from "@/components/SearchBar";
import { describeParty, partyFromQuery, partyToQuery } from "@/lib/party";
import { searchHomes } from "@/lib/search";
import { AMENITY_FILTERS, SPACE_ORDER } from "@/lib/filters";
import { SPACE_TYPES, type PublicProperty, type SpaceType } from "@/lib/properties";
import { CITIES, cityFromName } from "@/lib/site";

// Results depend on the query; keep them out of the index (city pages are the indexable version).
export const metadata: Metadata = { title: "Search stays", robots: { index: false, follow: true } };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Search = Record<string, string | undefined>;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const city = cityFromName(sp.city);
  const party = partyFromQuery((k) => sp[k]);
  const hasDates = DATE.test(sp.checkin ?? "") && DATE.test(sp.checkout ?? "") && sp.checkout! > sp.checkin!;
  const checkin = hasDates ? sp.checkin! : undefined;
  const checkout = hasDates ? sp.checkout! : undefined;

  const type = (SPACE_ORDER as string[]).includes(sp.type ?? "") ? (sp.type as SpaceType) : null;
  const amen = new Set((sp.amen ?? "").split(",").filter((a) => AMENITY_FILTERS.some((f) => f.slug === a)));
  const amenLabels = AMENITY_FILTERS.filter((f) => amen.has(f.slug)).map((f) => f.label as string);

  // Chip counts come from `base`: the homes that fit the dates and party, before type/amenity filters.
  const { base, results, liveChecked } = await searchHomes({ city, checkin, checkout, party, type, amenities: amenLabels });
  const hasAll = (p: PublicProperty, labels: string[]) => labels.every((l) => p.amenities.includes(l));

  // Links that toggle one filter and keep everything else in the query.
  const withParams = (changes: Record<string, string | null>) => {
    const q = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string"));
    for (const [k, v] of Object.entries(changes)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    return `/search?${q}`;
  };
  const toggleAmen = (slug: string) => {
    const next = new Set(amen);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    return withParams({ amen: [...next].join(",") || null });
  };
  const keepQuery = new URLSearchParams({ ...(type ? { type } : {}), ...(amen.size ? { amen: [...amen].join(",") } : {}) }).toString();

  const query = partyToQuery(party, new URLSearchParams(checkin && checkout ? { checkin, checkout } : {})).toString();
  const where = city ? CITIES[city].name : "all our cities";
  const when = checkin && checkout ? ` from ${fmt(checkin)} to ${fmt(checkout)}` : "";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <SearchBar initial={{ city: city ?? "", checkin, checkout, party }} keepQuery={keepQuery} />

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type of home">
          <Chip href={withParams({ type: null })} on={!type}>
            Any type
          </Chip>
          {SPACE_ORDER.map((t) => {
            const n = base.filter(({ p }) => p.spaceType === t && hasAll(p, amenLabels)).length;
            return (
              <Chip key={t} href={withParams({ type: type === t ? null : t })} on={type === t} disabled={!n && type !== t} count={n}>
                {SPACE_TYPES[t]}
              </Chip>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Amenities">
          {AMENITY_FILTERS.map((f) => {
            const n = base.filter(({ p }) => (!type || p.spaceType === type) && hasAll(p, [...amenLabels, f.label])).length;
            const on = amen.has(f.slug);
            return (
              <Chip key={f.slug} href={toggleAmen(f.slug)} on={on} disabled={!n && !on} count={on ? undefined : n}>
                {f.label}
              </Chip>
            );
          })}
        </div>
      </div>
      <h1 className="font-display mt-12 text-4xl font-medium sm:text-5xl">
        {results.length} {results.length === 1 ? "home" : "homes"} {liveChecked ? "available" : ""} in {where}
      </h1>
      <p className="mt-2 text-ink-soft">
        For {describeParty(party)}
        {when}.{!hasDates && " Add dates to see only the homes that are free, with prices."}
      </p>

      {results.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">{base.length ? "No homes match those filters." : "Nothing open for those dates."}</p>
          <p className="mt-2 text-ink-soft">
            {base.length ? "Turn off a filter or two to see more." : "Try shifting by a day or two, or searching all cities."}
          </p>
          <Link href="/stays" className="mt-6 inline-block rounded-full bg-ember px-6 py-3 font-medium text-white hover:bg-ember-2">
            Browse all stays
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ p }, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}>
              <PropertyCard
                p={p}
                priority={i < 3}
                query={query}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  on,
  disabled,
  count,
  children,
}: {
  href: string;
  on: boolean;
  disabled?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-full border border-line px-4 py-2 text-sm text-muted opacity-50">{children}</span>;
  }
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={on}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
      }`}
    >
      {children}
      {count !== undefined && <span className={on ? "text-paper/70" : "text-muted"}> {count}</span>}
    </Link>
  );
}

function fmt(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
