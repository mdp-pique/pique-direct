import { NextResponse } from "next/server";
import { getCalendar, hasHospitableToken } from "@/lib/hospitable/client";
import { getPropertyById } from "@/lib/properties";

// Day-by-day availability and nightly price for the booking calendar, next 12 months.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!hasHospitableToken()) {
    return NextResponse.json({ error: "Live availability isn't connected yet." }, { status: 503 });
  }
  // Only listed properties can be looked up, so this can't be used to probe other ids.
  const property = await getPropertyById(id);
  if (!property) return NextResponse.json({ error: "Unknown property" }, { status: 404 });

  const start = new Date();
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const days = await getCalendar(id, iso(start), iso(end));
    return NextResponse.json(
      {
        currency: property.currency,
        days: days.map((d) => ({
          date: d.date,
          available: d.status.available,
          price: d.price.amount,
          minStay: d.min_stay,
          noCheckin: d.closed_for_checkin,
          noCheckout: d.closed_for_checkout,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("availability", e);
    return NextResponse.json({ error: "Couldn't load availability" }, { status: 502 });
  }
}
