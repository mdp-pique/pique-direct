import { NextResponse } from "next/server";
import { hasHospitableToken } from "@/lib/hospitable/client";
import { getPropertyById, getYearCalendar } from "@/lib/properties";

// Day-by-day availability and nightly price for the booking calendar, next 12 months.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!hasHospitableToken()) {
    return NextResponse.json({ error: "Live availability isn't connected yet." }, { status: 503 });
  }
  // Only listed properties can be looked up, so this can't be used to probe other ids.
  const property = await getPropertyById(id);
  if (!property) return NextResponse.json({ error: "Unknown property" }, { status: 404 });

  try {
    const days = await getYearCalendar(id);
    return NextResponse.json(
      { currency: property.currency, days },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("availability", e);
    return NextResponse.json({ error: "Couldn't load availability" }, { status: 502 });
  }
}
