"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES, SITE } from "@/lib/site";

// Transparent over the home hero, solid once the page scrolls (or on inner pages).
export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const solid = !overHero || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "bg-snow/85 text-basalt shadow-[0_1px_0_var(--rule)] backdrop-blur-xl" : "bg-transparent text-on-dark"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-[28px] leading-none tracking-tight" aria-label={SITE.name}>
          {SITE.shortName}
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {(Object.keys(CITIES) as (keyof typeof CITIES)[]).map((slug) => (
            <Link
              key={slug}
              href={`/stays/${slug}`}
              className="hidden rounded-full px-3 py-1.5 transition hover:bg-current/10 sm:inline-block"
            >
              {CITIES[slug].name}
            </Link>
          ))}
          <Link
            href="/stays"
            className="rounded-full bg-river px-4 py-2 font-medium text-on-dark transition hover:bg-river-2"
          >
            Find a stay
          </Link>
        </nav>
      </div>
    </header>
  );
}
