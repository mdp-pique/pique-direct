import "server-only";
import { HospitableError, createQuote, hasHospitableToken } from "./hospitable/client";
import type { Party } from "./party";
import type { PublicProperty } from "./properties";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type PricedStay = {
  ok: true;
  nights: number;
  bookingUrl: string;
  // What guests see: the stay (rate + fees + discounts) and taxes.
  lines: { label: string; amount: string; discount?: boolean }[];
  // The full breakdown, for Ask Pique when a guest asks what's in the price.
  details: { label: string; amount: string; discount?: boolean }[];
  // Total of any discount already in the stay price, e.g. a weekly discount.
  savings?: string;
  // false = request to book: the team approves before the stay is confirmed.
  instantBook: boolean;
  total: string;
};
export type PriceError = { ok: false; status: number; error: string };

// Prices a stay through Hospitable Direct (rates, discounts, fees, taxes, stay
// rules) and returns its checkout link. Shared by the booking box and Ask Pique.
export async function priceStay(
  property: PublicProperty,
  input: { checkin: string; checkout: string; party: Partial<Party> },
): Promise<PricedStay | PriceError> {
  if (!hasHospitableToken()) return { ok: false, status: 503, error: "Live pricing isn't connected yet." };
  if (!DATE.test(input.checkin) || !DATE.test(input.checkout)) {
    return { ok: false, status: 400, error: "Pick check-in and check-out dates." };
  }
  const nights = (Date.parse(input.checkout) - Date.parse(input.checkin)) / 86_400_000;
  if (!(nights >= 1 && nights <= 90)) {
    return { ok: false, status: 400, error: "Stays can be 1 to 90 nights here. Contact us for longer stays." };
  }
  const adults = clamp(input.party.adults, 1, property.guests || 1);
  const children = clamp(input.party.children, 0, property.guests);
  if (adults + children > property.guests) {
    return { ok: false, status: 400, error: `This home sleeps up to ${property.guests}.` };
  }
  const infants = clamp(input.party.infants, 0, 4);
  const pets = property.petsAllowed ? clamp(input.party.pets, 0, 4) : 0;

  try {
    const q = await createQuote(property.id, {
      checkin_date: input.checkin,
      checkout_date: input.checkout,
      guests: { adults, children, infants, pets },
    });
    const f = q.financials;
    // Shown the way Airbnb shows it (Michael Stead 11-25): one stay price with the
    // nightly rate, cleaning, extra-guest and pet fees and any discount folded in,
    // then taxes. Hospitable's checkout and records still keep every line.
    // Amounts are in cents. The stay price is Hospitable's own "total without taxes".
    const fees = f.fees.filter((x) => x.amount > 0);
    const discounts = f.discounts.filter((x) => x.amount !== 0);
    const taxes = f.taxes.filter((x) => x.amount > 0);
    const stayCents = f.totals.total_without_taxes?.amount ?? f.totals.total.amount - taxes.reduce((a, x) => a + x.amount, 0);
    const money = (c: number) => (c / 100).toLocaleString("en-CA", { style: "currency", currency: q.currency || property.currency || "CAD" });
    const nightLabel = `${nights} ${nights === 1 ? "night" : "nights"}`;
    return {
      ok: true,
      nights,
      bookingUrl: q.booking_url,
      lines: [
        { label: nightLabel, amount: money(stayCents) },
        ...taxes.map((x) => ({ label: x.label, amount: money(x.amount) })),
      ],
      details: [
        { label: `${nightLabel} (rate)`, amount: money(f.totals.sub_total.amount) },
        ...fees.map((x) => ({ label: x.label, amount: money(x.amount) })),
        ...discounts.map((x) => ({ label: x.label, amount: money(-Math.abs(x.amount)), discount: true })),
      ],
      savings: discounts.length ? money(discounts.reduce((a, x) => a + Math.abs(x.amount), 0)) : undefined,
      instantBook: q.instant_book_applies === true,
      total: money(f.totals.total.amount),
    };
  } catch (e) {
    // Hospitable rejects dates that break availability or stay rules with a 4xx.
    if (e instanceof HospitableError && e.status >= 400 && e.status < 500) {
      return { ok: false, status: 409, error: "Those dates aren't available. Try different dates." };
    }
    console.error("quote", e);
    return { ok: false, status: 502, error: "Couldn't price that stay right now." };
  }
}

function clamp(n: unknown, min: number, max: number) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : min;
}
