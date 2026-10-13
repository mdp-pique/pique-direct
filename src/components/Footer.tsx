import Link from "next/link";
import { CITIES, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-semibold">
            {SITE.shortName}
            <span className="text-ember">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">{SITE.tagline}.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Stays</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(Object.keys(CITIES) as (keyof typeof CITIES)[]).map((slug) => (
              <li key={slug}>
                <Link className="hover:text-ember" href={`/stays/${slug}`}>
                  {CITIES[slug].name} vacation rentals
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Booking direct</p>
          <p className="mt-3 text-sm text-ink-soft">
            Live prices and availability from our own calendar. Secure checkout, ID verification and damage
            protection on every stay.
          </p>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
