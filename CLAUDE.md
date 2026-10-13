# Pique Direct

Direct booking site for Pique Properties (Edmonton, Canmore, Calgary). Next.js App Router on Vercel, content and booking from the Hospitable Public API. Separate from the internal ops app (`mdp-pique/pique-ops`) on purpose: nothing here touches its database or automations.

## How it works
- `src/lib/hospitable/client.ts` is the only code that calls Hospitable (`HOSPITABLE_API_TOKEN`). Reads are cached (1 h content, 5 min calendar) under the `hospitable` tag; `POST /api/revalidate` (bearer `REVALIDATE_SECRET`) refreshes everything.
- Booking: `/api/availability` (calendar) and `/api/quote` (Hospitable Direct quote). The quote returns Hospitable's checkout link; payment goes to Pique's Stripe through Hospitable, and the booking lands in Hospitable as a `direct` reservation, so the ops app's automations (ID check, pet fee, cleaning shifts) apply unchanged.
- Without a token the site renders the two sample properties in `data/fixtures/properties.json` (real public fields only).

## Rules
- **Public fields only.** `toPublicProperty()` in `src/lib/properties.ts` is an allowlist. Hospitable's property payload also carries the house manual (building, pool, garage and door codes), wifi and streaming logins and the iCal feed; never request `include=details` and never pass a raw Hospitable object to a page, route, sitemap, llms.txt or JSON-LD. Reviews: only `public` text and rating, never `private` feedback. Coordinates are rounded to ~1 km; no street address.
- Listing text was written for Airbnb; `cleanDescription()` drops the policies block and platform mentions until rewritten copy exists.
- Property URLs end in the first 8 characters of the Hospitable id; a renamed listing 308-redirects to its new slug. Don't change the slug format without redirects.
- Every page must stay readable without JS (crawlers and AI assistants): animations only toggle classes on server-rendered content.
