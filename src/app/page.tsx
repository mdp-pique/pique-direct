import Image from "next/image";
import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { Reveal } from "@/components/Reveal";
import { getProperties, getReviews, mapLimit } from "@/lib/properties";
import { SearchBar } from "@/components/SearchBar";
import { CITIES, type CitySlug } from "@/lib/site";

export const revalidate = 3600;

const HEADLINE = ["Stay", "somewhere", "worth", "remembering."];

const FAQ = [
  {
    q: "Why book directly with Pique instead of a booking platform?",
    a: "You book the same homes with the same team, straight from our calendar. Prices and availability are live, and there's no platform service fee added at checkout.",
  },
  {
    q: "Is checkout secure?",
    a: "Yes. Payment is processed by Stripe through our booking system, Hospitable. Card details go straight to Stripe and are never stored by us.",
  },
  {
    q: "What do I need before check-in?",
    a: "A quick ID verification and a short rental agreement. Your door code and arrival guide are sent as soon as those are done.",
  },
  {
    q: "Are pets allowed?",
    a: "Some of our homes welcome pets for a nightly fee. Look for the Pet friendly tag, or ask us.",
  },
];

export default async function Home() {
  const properties = await getProperties();
  const counts = (Object.keys(CITIES) as CitySlug[]).map((c) => ({
    slug: c,
    ...CITIES[c],
    count: properties.filter((p) => p.city === c).length,
    cover: properties.find((p) => p.city === c)?.heroImage ?? null,
  }));
  const hero = properties.find((p) => p.city === "canmore")?.heroImage ?? properties[0]?.heroImage ?? null;
  const featured = properties.slice(0, 6);
  // Real guest quotes for the strip under the hero: short, five-star, one per home.
  const quotes: { text: string; home: string }[] = [];
  await mapLimit(properties.slice(0, 16), 8, async (p) => {
    const r = (await getReviews(p.id).catch(() => null))?.reviews.find(
      (x) => x.rating === 5 && x.text.length >= 50 && x.text.length <= 180,
    );
    if (r) quotes.push({ text: r.text, home: `${p.cityName}` });
  });

  return (
    <>
      {/* Hero */}
      <section className="grain relative flex h-[100svh] min-h-[560px] items-end overflow-hidden bg-alpine text-white">
        {hero && (
          <Image src={hero} alt="" fill priority sizes="100vw" className="kenburns object-cover opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <p className="rise text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Edmonton · Canmore · Calgary
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl font-medium leading-[0.95] sm:text-7xl lg:text-8xl">
            {HEADLINE.map((w, i) => (
              <span key={w} className="rise mr-[0.25em] inline-block" style={{ animationDelay: `${150 + i * 110}ms` }}>
                {w === "remembering." ? <em className="font-normal italic text-[#f3c9a8]">{w}</em> : w}
              </span>
            ))}
          </h1>
          <p className="rise mt-6 max-w-xl text-base text-white/85 sm:text-lg" style={{ animationDelay: "700ms" }}>
            {properties.length > 2 ? `${properties.length} homes` : "Homes"} with private hot tubs, saunas and
            mountain views, booked directly with the people who host them.
          </p>
          <div className="fade mt-8 max-w-4xl" style={{ animationDelay: "850ms" }}>
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Guest quotes, drifting past. Pauses on hover so a quote can be read. */}
      {quotes.length > 2 && (
        <section aria-label="What guests say" className="group overflow-hidden border-b border-line bg-paper py-8">
          <div className="marquee flex w-max gap-6 group-hover:[animation-play-state:paused]">
            {[...quotes, ...quotes].map((q, i) => (
              <figure key={i} aria-hidden={i >= quotes.length} className="w-[340px] shrink-0 rounded-2xl border border-line bg-card p-5">
                <p className="text-ember">★★★★★</p>
                <blockquote className="font-display mt-2 text-lg leading-snug">&ldquo;{q.text}&rdquo;</blockquote>
                <figcaption className="mt-3 text-xs uppercase tracking-wider text-muted">Guest in {q.home}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Cities */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Reveal>
          <h2 className="font-display text-4xl font-medium sm:text-5xl">Where to next?</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {counts.map((c, i) => (
            <Reveal key={c.slug} delay={i * 120}>
              <Link href={`/stays/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-alpine">
                {c.cover && (
                  <Image
                    src={c.cover}
                    alt={`Vacation rental in ${c.name}`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover opacity-90 transition duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    {c.count} {c.count === 1 ? "home" : "homes"}
                  </p>
                  <p className="font-display mt-1 text-4xl">{c.name}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-medium sm:text-5xl">Guest favourites</h2>
            <Link href="/stays" className="text-sm font-medium text-ember hover:underline">
              See all stays →
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 100}>
                <PropertyCard p={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Why direct */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 rounded-[2rem] bg-alpine px-6 py-14 text-white sm:px-12 md:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
              Book direct. <em className="italic text-[#f3c9a8]">Same homes,</em> fewer middlemen.
            </h2>
          </Reveal>
          <ul className="grid gap-6 text-white/85">
            {[
              ["No platform service fee", "The price you see comes straight from our calendar."],
              ["A real local team", "Message or call the people who look after your home."],
              ["Protected stays", "Secure Stripe checkout, ID verification and damage protection."],
            ].map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 120} className="border-t border-white/15 pt-5">
                <p className="font-display text-xl text-white">{t}</p>
                <p className="mt-1 text-sm">{d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ: plain text in the HTML so search engines and AI assistants can quote it. */}
      <section className="mx-auto max-w-3xl px-4 pt-24 sm:px-6">
        <Reveal>
          <h2 className="font-display text-4xl font-medium">Questions, answered</h2>
        </Reveal>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-ember transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      </section>
    </>
  );
}
