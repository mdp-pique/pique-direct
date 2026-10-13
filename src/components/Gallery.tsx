"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PublicImage } from "@/lib/properties";

// Mosaic of the first five photos; "Show all" opens a full-screen viewer.
export function Gallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (n: number) => setOpen((i) => (i === null ? i : (i + n + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  if (!images.length) return null;
  const tiles = images.slice(0, 5);

  return (
    <>
      <div className="relative grid h-[52vh] min-h-[320px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl">
        {tiles.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden bg-paper-2 ${
              i === 0 ? "col-span-4 row-span-2 md:col-span-2" : "hidden md:block"
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt || `${title}, photo ${i + 1}`}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "25vw"}
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink shadow backdrop-blur transition hover:bg-white"
        >
          Show all {images.length} photos
        </button>
      </div>

      {open !== null && (
        <div role="dialog" aria-modal aria-label={`${title} photos`} className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white">
          <div className="flex items-center justify-between p-4 text-sm">
            <span>
              {open + 1} / {images.length}
            </span>
            <button type="button" onClick={close} className="rounded-full px-4 py-2 hover:bg-white/10">
              Close ✕
            </button>
          </div>
          <div className="relative flex-1">
            <Image key={images[open].url} src={images[open].url} alt={images[open].alt || title} fill sizes="100vw" className="rise object-contain" />
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-xl hover:bg-white/20">
              ←
            </button>
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-xl hover:bg-white/20">
              →
            </button>
          </div>
          {images[open].alt && <p className="mx-auto max-w-2xl p-4 text-center text-sm text-white/80">{images[open].alt}</p>}
        </div>
      )}
    </>
  );
}
