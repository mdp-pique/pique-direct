import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { HOSPITABLE_TAG } from "@/lib/hospitable/client";

// Refreshes every page built from Hospitable data. Point a Hospitable webhook
// (property or review changed) here, or call it by hand after editing a listing:
//   POST /api/revalidate  with header  Authorization: Bearer <REVALIDATE_SECRET>
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? new URL(req.url).searchParams.get("secret");
  if (!secret || given !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  revalidateTag(HOSPITABLE_TAG, "max");
  return NextResponse.json({ revalidated: true });
}
