// Who's coming: shared by the search bar, results page and booking box.
// Plain module (no "use client") so server pages can call it too.

export type Party = { adults: number; children: number; infants: number; pets: number };

export const DEFAULT_PARTY: Party = { adults: 2, children: 0, infants: 0, pets: 0 };

export function describeParty(p: Party) {
  const guests = p.adults + p.children;
  const parts = [`${guests} ${guests === 1 ? "guest" : "guests"}`];
  if (p.infants) parts.push(`${p.infants} ${p.infants === 1 ? "infant" : "infants"}`);
  if (p.pets) parts.push(`${p.pets} ${p.pets === 1 ? "pet" : "pets"}`);
  return parts.join(", ");
}

export function partyToQuery(p: Party, q = new URLSearchParams()) {
  q.set("adults", String(p.adults));
  if (p.children) q.set("children", String(p.children));
  if (p.infants) q.set("infants", String(p.infants));
  if (p.pets) q.set("pets", String(p.pets));
  return q;
}

// Reads ?adults=&children=&infants=&pets= (and the older ?guests=).
export function partyFromQuery(get: (k: string) => string | null | undefined): Party {
  const n = (k: string, min: number, max: number, fallback: number) => {
    const v = Math.floor(Number(get(k)));
    return Number.isFinite(v) && get(k) != null ? Math.min(Math.max(v, min), max) : fallback;
  };
  const legacy = n("guests", 1, 30, 2);
  return {
    adults: n("adults", 1, 30, legacy),
    children: n("children", 0, 30, 0),
    infants: n("infants", 0, 4, 0),
    pets: n("pets", 0, 4, 0),
  };
}
