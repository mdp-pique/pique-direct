import Image from "next/image";
import Link from "next/link";
import type { PublicProperty } from "@/lib/properties";
import { propertyHref } from "@/lib/urls";

export function PropertyCard({
  p,
  priority = false,
  query,
  price,
}: {
  p: PublicProperty;
  priority?: boolean;
  // Search dates/guests carried to the property page so its calendar opens on them.
  query?: string;
  price?: { perNight: string; total: string; nights: number };
}) {
  return (
    <Link href={query ? `${propertyHref(p)}?${query}` : propertyHref(p)} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-2">
        {p.heroImage && (
          <Image
            src={p.heroImage}
            alt={`${p.title}, ${p.cityName}`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        {p.petsAllowed && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#17140f] shadow-sm">
            Pet friendly
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-medium leading-snug transition group-hover:text-ember">{p.title}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {p.cityName} · {p.guests} guests · {p.bedrooms} {p.bedrooms === 1 ? "bedroom" : "bedrooms"}
          </p>
          {price && (
            <p className="mt-1 text-sm">
              <span className="font-semibold">{price.perNight}</span> / night
              <span className="text-muted"> · {price.total} for {price.nights} {price.nights === 1 ? "night" : "nights"} before fees</span>
            </p>
          )}
        </div>
        <span className="mt-1 shrink-0 text-ember transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
