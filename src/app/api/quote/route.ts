import { NextResponse } from "next/server";
import { getPropertyById } from "@/lib/properties";
import { priceStay } from "@/lib/quote";

// Prices a stay through Hospitable Direct and returns its checkout link.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    propertyId?: string;
    checkin?: string;
    checkout?: string;
    adults?: number;
    children?: number;
    infants?: number;
    pets?: number;
  } | null;
  if (!body?.propertyId) return NextResponse.json({ error: "Pick check-in and check-out dates." }, { status: 400 });
  const property = await getPropertyById(body.propertyId);
  if (!property) return NextResponse.json({ error: "Unknown property" }, { status: 404 });

  const r = await priceStay(property, {
    checkin: body.checkin ?? "",
    checkout: body.checkout ?? "",
    party: { adults: body.adults, children: body.children, infants: body.infants, pets: body.pets },
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ nights: r.nights, bookingUrl: r.bookingUrl, lines: r.lines, total: r.total });
}
