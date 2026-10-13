import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { Reveal } from "@/components/Reveal";
import { SearchBar } from "@/components/SearchBar";
import { hasHospitableToken } from "@/lib/hospitable/client";
import { checkStay, getProperties, getYearCalendar, mapLimit, type PublicProperty } from "@/lib/properties";
import { CITIES, cityFromName } from "@/lib/site";

// Results depend on the query; keep them out of the index (city pages are the indexable version).
export const metadata: Metadata = { title: "Search stays", robots: { index: false, follow: true } };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Search = { city?: string; checkin?: string; checkout?: string; guests?: string; pets?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const city = cityFromName(sp.city);
  const guests = Math.min(Math.max(Number(sp.guests) || 1, 1), 30);
  const pets = sp.pets === "1";
  const hasDates = DATE.test(sp.checkin ?? "") && DATE.test(sp.checkout ?? "") && sp.checkout! > sp.checkin!;
  const checkin = hasDates ? sp.checkin! : undefined;
  const checkout = hasDates ? sp.checkout! : undefined;

  const candidates = (await getProperties()).filter(
    (p) => (!city || p.city === city) && p.guests >= guests && (!pets || p.petsAllowed),
  );

  let results: { p: PublicProperty; nightly?: number; nights?: number }[] = candidates.map((p) => ({ p }));
  let liveChecked = false;
  if (hasDates && hasHospitableToken()) {
    liveChecked = true;
    // Calendars are cached for 5 minutes; a cold search reads them 10 at a time.
    const open: { p: PublicProperty; nightly: number; nights: number }[] = [];
    await mapLimit(candidates, 10, async (p) => {
      const days = await getYearCalendar(p.id).catch(() => null);
      const stay = days ? checkStay(days, checkin!, checkout!) : null;
      if (stay?.ok) open.push({ p, nightly: stay.nightly, nights: stay.nights });
    });
    results = open.sort((a, b) => a.nightly - b.nightly);
  }

  const query = new URLSearchParams({
    ...(checkin && checkout ? { checkin, checkout } : {}),
    guests: String(guests),
    ...(pets ? { pets: "1" } : {}),
  }).toString();
  const money = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
  const where = city ? CITIES[city].name : "all our cities";
  const when = checkin && checkout ? ` from ${fmt(checkin)} to ${fmt(checkout)}` : "";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <SearchBar initial={{ city: city ?? "", checkin, checkout, guests, pets }} />
      <h1 className="font-display mt-12 text-4xl font-medium sm:text-5xl">
        {results.length} {results.length === 1 ? "home" : "homes"} {liveChecked ? "available" : ""} in {where}
      </h1>
      <p className="mt-2 text-ink-soft">
        For {guests} {guests === 1 ? "guest" : "guests"}
        {pets ? " with pets" : ""}
        {when}.{!hasDates && " Add dates to see only the homes that are free, with prices."}
      </p>

      {results.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-line bg-card p-10 text-center">
          <p className="font-display text-2xl">Nothing open for those dates.</p>
          <p className="mt-2 text-ink-soft">Try shifting by a day or two, or searching all cities.</p>
          <Link href="/stays" className="mt-6 inline-block rounded-full bg-ember px-6 py-3 font-medium text-white hover:bg-ember-2">
            Browse all stays
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ p, nightly, nights }, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}>
              <PropertyCard
                p={p}
                priority={i < 3}
                query={query}
                price={
                  nightly && nights
                    ? { perNight: money(nightly / nights, p.currency), total: money(nightly, p.currency), nights }
                    : undefined
                }
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
