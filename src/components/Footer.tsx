import Link from "next/link";
import { CITIES, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-snow-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">{SITE.shortName}</p>
          <p className="mt-3 max-w-xs text-sm text-basalt-soft">{SITE.tagline}.</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-mist">Stays</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(Object.keys(CITIES) as (keyof typeof CITIES)[]).map((slug) => (
              <li key={slug}>
                <Link className="hover:text-river-2" href={`/stays/${slug}`}>
                  {CITIES[slug].name} vacation rentals
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-mist">Booking direct</p>
          <p className="mt-3 text-sm text-basalt-soft">
            Live prices and availability from our own calendar. Secure checkout, ID verification and damage
            protection on every stay.
          </p>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-mist">
        © {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
