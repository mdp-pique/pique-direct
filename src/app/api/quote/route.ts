import { NextResponse } from "next/server";
import { createQuote, hasHospitableToken, HospitableError } from "@/lib/hospitable/client";
import { getPropertyById } from "@/lib/properties";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Prices a stay through Hospitable Direct and returns its checkout link.
export async function POST(req: Request) {
  if (!hasHospitableToken()) {
    return NextResponse.json({ error: "Live pricing isn't connected yet." }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as {
    propertyId?: string;
    checkin?: string;
    checkout?: string;
    adults?: number;
    children?: number;
    pets?: number;
  } | null;
  if (!body?.propertyId || !DATE.test(body.checkin ?? "") || !DATE.test(body.checkout ?? "")) {
    return NextResponse.json({ error: "Pick check-in and check-out dates." }, { status: 400 });
  }
  const property = await getPropertyById(body.propertyId);
  if (!property) return NextResponse.json({ error: "Unknown property" }, { status: 404 });

  const nights = (Date.parse(body.checkout!) - Date.parse(body.checkin!)) / 86_400_000;
  if (!(nights >= 1 && nights <= 90)) {
    return NextResponse.json({ error: "Stays can be 1 to 90 nights here. Contact us for longer stays." }, { status: 400 });
  }
  const adults = clamp(body.adults, 1, property.guests || 1);
  const children = clamp(body.children, 0, property.guests);
  if (adults + children > property.guests) {
    return NextResponse.json({ error: `This home sleeps up to ${property.guests}.` }, { status: 400 });
  }
  const pets = property.petsAllowed ? clamp(body.pets, 0, 4) : 0;

  try {
    const q = await createQuote(property.id, {
      checkin_date: body.checkin!,
      checkout_date: body.checkout!,
      guests: { adults, children, pets },
    });
    const f = q.financials;
    return NextResponse.json({
      nights,
      bookingUrl: q.booking_url,
      lines: [
        { label: `${nights} ${nights === 1 ? "night" : "nights"}`, amount: f.totals.sub_total.formatted },
        ...f.fees.filter((x) => x.amount > 0).map((x) => ({ label: x.label, amount: x.formatted })),
        ...f.discounts.filter((x) => x.amount !== 0).map((x) => ({ label: x.label, amount: x.formatted, discount: true })),
        ...f.taxes.filter((x) => x.amount > 0).map((x) => ({ label: x.label, amount: x.formatted })),
      ],
      total: f.totals.total.formatted,
    });
  } catch (e) {
    // Hospitable rejects dates that break availability or stay rules with a 4xx.
    if (e instanceof HospitableError && e.status >= 400 && e.status < 500) {
      return NextResponse.json({ error: "Those dates aren't available. Try different dates." }, { status: 409 });
    }
    console.error("quote", e);
    return NextResponse.json({ error: "Couldn't price that stay right now." }, { status: 502 });
  }
}

function clamp(n: unknown, min: number, max: number) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : min;
}
