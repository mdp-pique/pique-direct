import "server-only";
import { hasHospitableToken } from "./hospitable/client";
import type { Party } from "./party";
import { checkStay, getProperties, getYearCalendar, mapLimit, type PublicProperty, type SpaceType } from "./properties";
import type { CitySlug } from "./site";

export type SearchHit = { p: PublicProperty; nightly?: number; nights?: number };

// One search used by the search page and Ask Pique, so both always agree.
// `base` is every home that fits the place, party and dates; `results`
// narrows it by type of home and amenities (the page counts chips from base).
export async function searchHomes(input: {
  city?: CitySlug | null;
  checkin?: string;
  checkout?: string;
  party: Party;
  type?: SpaceType | null;
  amenities?: string[];
}): Promise<{ base: SearchHit[]; results: SearchHit[]; liveChecked: boolean }> {
  const guests = input.party.adults + input.party.children; // infants don't count toward capacity
  const pets = input.party.pets > 0;
  const candidates = (await getProperties()).filter(
    (p) => (!input.city || p.city === input.city) && p.guests >= guests && (!pets || p.petsAllowed),
  );

  let base: SearchHit[] = candidates.map((p) => ({ p }));
  let liveChecked = false;
  if (input.checkin && input.checkout && hasHospitableToken()) {
    liveChecked = true;
    // Calendars are cached for 5 minutes; a cold search reads them 10 at a time.
    const open: Required<SearchHit>[] = [];
    await mapLimit(candidates, 10, async (p) => {
      const days = await getYearCalendar(p.id).catch(() => null);
      const stay = days ? checkStay(days, input.checkin!, input.checkout!) : null;
      if (stay?.ok) open.push({ p, nightly: stay.nightly, nights: stay.nights });
    });
    base = open.sort((a, b) => a.nightly - b.nightly);
  }

  const amenities = input.amenities ?? [];
  const results = base.filter(
    ({ p }) => (!input.type || p.spaceType === input.type) && amenities.every((a) => p.amenities.includes(a)),
  );
  return { base, results, liveChecked };
}
