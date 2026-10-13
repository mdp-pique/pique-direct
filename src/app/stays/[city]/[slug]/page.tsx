import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BookingWidget } from "@/components/BookingWidget";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { PropertyCard } from "@/components/PropertyCard";
import { propertyHref } from "@/lib/urls";
import { Reveal } from "@/components/Reveal";
import {
  findPropertyBySlug,
  getImages,
  getProperties,
  getReviews,
  SPACE_TYPES,
  uniqueAmenities,
} from "@/lib/properties";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getProperties()).map((p) => ({ city: p.city, slug: p.slug }));
}

type Params = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await findPropertyBySlug((await params).slug);
  if (!p) return {};
  const images = await getImages(p.id);
  const lead = p.summary[0] ?? p.description[0] ?? "";
  return {
    title: `${p.title} · ${p.cityName} vacation rental`,
    description: `${SPACE_TYPES[p.spaceType]} in ${p.cityName}, sleeps ${p.guests}, ${p.bedrooms} bedrooms. ${lead}`.slice(0, 300),
    alternates: { canonical: propertyHref(p) },
    openGraph: {
      title: p.title,
      description: lead,
      images: images.slice(0, 4).map((i) => ({ url: i.url, alt: i.alt || p.title })),
    },
  };
}

export default async function PropertyPage({ params }: Params) {
  const { city, slug } = await params;
  const p = await findPropertyBySlug(slug);
  if (!p) notFound();
  // Listing renamed or moved: send visitors and crawlers to the current URL.
  if (p.city !== city || p.slug !== slug) permanentRedirect(propertyHref(p));

  const [images, reviews, all] = await Promise.all([getImages(p.id), getReviews(p.id), getProperties()]);
  const amenities = uniqueAmenities(p.amenities);
  const nearby = all.filter((x) => x.city === p.city && x.id !== p.id).slice(0, 3);
  const url = `${SITE.url}${propertyHref(p)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VacationRental",
          "@id": url,
          url,
          identifier: p.id,
          name: p.title,
          description: [...p.summary, ...p.description.slice(0, 2)].join(" "),
          brand: { "@type": "Brand", name: SITE.name },
          image: images.slice(0, 12).map((i) => i.url),
          address: { "@type": "PostalAddress", addressLocality: p.cityName, addressRegion: "AB", addressCountry: "CA" },
          ...(p.geo ? { latitude: p.geo.lat, longitude: p.geo.lng } : {}),
          checkinTime: p.checkin ?? undefined,
          checkoutTime: p.checkout ?? undefined,
          petsAllowed: p.petsAllowed,
          containsPlace: {
            "@type": "Accommodation",
            additionalType: "EntirePlace",
            occupancy: { "@type": "QuantitativeValue", value: p.guests },
            numberOfBedrooms: p.bedrooms,
            numberOfBathroomsTotal: p.bathrooms,
            amenityFeature: amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
          },
          ...(reviews.average && reviews.total
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: reviews.average,
                  ratingCount: reviews.total,
                  bestRating: 5,
                },
                review: reviews.reviews.slice(0, 5).map((r) => ({
                  "@type": "Review",
                  reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
                  reviewBody: r.text,
                  datePublished: r.date.slice(0, 10),
                  author: { "@type": "Person", name: `${r.source} guest` },
                })),
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Stays", item: `${SITE.url}/stays` },
            { "@type": "ListItem", position: 2, name: p.cityName, item: `${SITE.url}/stays/${p.city}` },
            { "@type": "ListItem", position: 3, name: p.title, item: url },
          ],
        }}
      />

      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/stays" className="hover:text-ember">Stays</Link> /{" "}
        <Link href={`/stays/${p.city}`} className="hover:text-ember">{p.cityName}</Link>
      </nav>
      <h1 className="font-display rise text-4xl font-medium leading-tight sm:text-5xl">{p.title}</h1>
      <p className="rise mt-2 text-ink-soft" style={{ animationDelay: "100ms" }}>
        {SPACE_TYPES[p.spaceType]} in {p.cityName}, {p.region}
        {reviews.average ? ` · ★ ${reviews.average.toFixed(2)} (${reviews.total} reviews)` : ""}
      </p>

      <div className="mt-6">
        <Gallery images={images} title={p.title} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          {/* Key facts first, in plain words: what search snippets and AI answers quote. */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              ["Guests", p.guests],
              ["Bedrooms", p.bedrooms],
              ["Beds", p.beds],
              ["Bathrooms", p.bathrooms],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-4">
                <dt className="text-xs uppercase tracking-wider text-muted">{k}</dt>
                <dd className="font-display mt-1 text-2xl">{v}</dd>
              </div>
            ))}
          </dl>

          {p.summary.length > 0 && (
            <Reveal className="mt-10">
              <p className="font-display text-2xl leading-snug">{p.summary.join(" ")}</p>
            </Reveal>
          )}

          {p.highlights.length > 0 && (
            <Reveal className="mt-8">
              <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span className="text-ember">✦</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <section className="mt-12">
            <h2 className="font-display text-3xl">About this home</h2>
            <div className="mt-4 space-y-4 whitespace-pre-line leading-relaxed text-ink-soft">
              {p.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {p.sleeping.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-3xl">Where you&apos;ll sleep</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.sleeping.map((s) => (
                  <li key={s} className="rounded-xl border border-line bg-card p-4 text-sm">{s}</li>
                ))}
              </ul>
            </section>
          )}

          {amenities.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-3xl">What&apos;s here</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <li key={a} className="rounded-full border border-line px-4 py-2 text-sm">{a}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12">
            <h2 className="font-display text-3xl">Good to know</h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              {p.checkin && <li>Check-in from {fmtTime(p.checkin)}</li>}
              {p.checkout && <li>Check-out by {fmtTime(p.checkout)}</li>}
              <li>{p.petsAllowed ? "Pets welcome (a nightly pet fee applies)." : "No pets, please."}</li>
              <li>No smoking and no parties.</li>
              <li>ID verification and a short rental agreement before your door code is sent.</li>
            </ul>
          </section>

          {reviews.reviews.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-3xl">
                {reviews.average ? `★ ${reviews.average.toFixed(2)} · ` : ""}
                {reviews.total} reviews
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {reviews.reviews.slice(0, 6).map((r, i) => (
                  <Reveal key={r.id} delay={(i % 2) * 100} as="article" className="rounded-2xl border border-line bg-card p-5">
                    <p className="text-ember">{"★".repeat(Math.round(r.rating))}</p>
                    <p className="mt-2 leading-relaxed">{r.text}</p>
                    <p className="mt-3 text-xs text-muted">
                      {r.source} guest · {new Date(r.date).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
                    </p>
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside id="book" className="scroll-mt-20 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <BookingWidget propertyId={p.id} maxGuests={p.guests} petsAllowed={p.petsAllowed} currency={p.currency} />
        </aside>
      </div>

      {/* Phones: the booking box sits below the content, so keep a way to it on screen. */}
      <a
        href="#book"
        className="fixed bottom-4 left-4 right-20 z-40 rounded-full bg-ember py-3.5 text-center font-medium text-white shadow-lg lg:hidden"
      >
        Check dates &amp; price
      </a>

      {nearby.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl">More in {p.cityName}</h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((n) => (
              <PropertyCard key={n.id} p={n} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-CA", { hour: "numeric", minute: m ? "2-digit" : undefined });
}
