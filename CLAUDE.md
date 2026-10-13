# Pique Direct

Direct booking site for Pique Properties (Edmonton, Canmore, Calgary). Next.js App Router on Vercel, content and booking from the Hospitable Public API. Separate from the internal ops app (`mdp-pique/pique-ops`) on purpose: nothing here touches its database or automations.

## How it works
- `src/lib/hospitable/client.ts` is the only code that calls Hospitable (`HOSPITABLE_API_TOKEN`). Reads are cached (1 h content, 5 min calendar) under the `hospitable` tag; `POST /api/revalidate` (bearer `REVALIDATE_SECRET`) refreshes everything.
- Booking: `/api/availability` (calendar) and `/api/quote` (Hospitable Direct quote). The quote returns Hospitable's checkout link; payment goes to Pique's Stripe through Hospitable, and the booking lands in Hospitable as a `direct` reservation, so the ops app's automations (ID check, pet fee, cleaning shifts) apply unchanged.
- Without a token the site renders the two sample properties in `data/fixtures/properties.json` (real public fields only).

## Rules
- **Prices only from the direct quote.** Hospitable's calendar endpoint returns the Airbnb listing's nightly rates (provider `airbnb-official`), not Hospitable Direct's: on 10-13 a direct quote was ~22% above the calendar rate. Never show calendar `price` to guests; use it for availability only. Every amount on the site or in Ask Pique comes from `priceStay()`.
- **Public fields only.** `toPublicProperty()` in `src/lib/properties.ts` is an allowlist. Hospitable's property payload also carries the house manual (building, pool, garage and door codes), wifi and streaming logins and the iCal feed; never request `include=details` and never pass a raw Hospitable object to a page, route, sitemap, llms.txt or JSON-LD. Reviews: only `public` text and rating, never `private` feedback. Coordinates are rounded to ~1 km; no street address.
- Listing text was written for Airbnb; `cleanDescription()` drops the policies block and platform mentions until rewritten copy exists.
- Property URLs end in the first 8 characters of the Hospitable id; a renamed listing 308-redirects to its new slug. Don't change the slug format without redirects.
- Every page must stay readable without JS (crawlers and AI assistants): animations only toggle classes on server-rendered content.

## Ask Pique (chat)
- `src/components/AskPique.tsx` (floating chat, conversation kept in sessionStorage) → `POST /api/chat` (`src/app/api/chat/route.ts`): Claude (`claude-opus-5-5`, effort low, server-side fallbacks) in a manual tool loop, at most 6 tool rounds, 20 guest messages per chat, 1,000 characters per message, rough per-IP limit.
- Rules live in `src/lib/chat/prompt.ts` (MDP 10-13): may quote and explain prices and point out real discounts (longer stay, other dates, cheaper similar home) from `price_stay`, **never negotiates**; hands off to call/text (1-780-230-0267, `SITE.phone`) for deals, existing bookings, exceptions, upset guests or anything unsure. No age rule (none of the 94 listings has one).
- Tools (`src/lib/chat/tools.ts`) only read the public allowlisted data the pages use: `search_homes` (same `searchHomes()` as /search), `get_home`, `price_stay` (same `priceStay()` as the booking box, max 6 per answer), `offer_contact` (shows Call / Text with a pre-written text). The reply keeps only links to our own pages.
- Every turn is saved to the ops Supabase project through `record_website_chat_turn()` (pique-ops migration `20261013010000_website_chats.sql`; tables `website_chats`, `website_chat_messages`, staff-readable): the site holds only the public anon key plus `WEBSITE_CHAT_SECRET`, which the function checks against a stored hash. Saving runs after the reply and never blocks it.
- Env: `ANTHROPIC_API_KEY` (without it the chat answers "isn't switched on yet" with Call / Text), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `WEBSITE_CHAT_SECRET`.
