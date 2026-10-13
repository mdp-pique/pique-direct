"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, type CitySlug } from "@/lib/site";

export type SearchValues = { city?: string; checkin?: string; checkout?: string; guests?: number; pets?: boolean };

// Where / dates / guests / pets, sent to /search. `variant="hero"` sits on photography.
export function SearchBar({ initial = {}, variant = "page" }: { initial?: SearchValues; variant?: "hero" | "page" }) {
  const router = useRouter();
  const [city, setCity] = useState(initial.city ?? "");
  const [checkin, setCheckin] = useState(initial.checkin ?? "");
  const [checkout, setCheckout] = useState(initial.checkout ?? "");
  const [guests, setGuests] = useState(initial.guests ?? 2);
  const [pets, setPets] = useState(Boolean(initial.pets));
  const today = localIso(new Date());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (checkin && checkout && checkout > checkin) {
      q.set("checkin", checkin);
      q.set("checkout", checkout);
    }
    q.set("guests", String(guests));
    if (pets) q.set("pets", "1");
    router.push(`/search?${q}`);
  }

  const hero = variant === "hero";
  const field = "flex min-w-0 flex-col px-4 py-2.5 text-left text-ink";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-muted";
  const input = "bg-transparent text-sm outline-none [color-scheme:light] dark:[color-scheme:dark]";

  return (
    <form
      onSubmit={submit}
      className={`grid grid-cols-2 items-center gap-y-1 divide-line rounded-3xl border border-line p-1.5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.4)] md:flex md:divide-x md:rounded-full ${
        hero ? "bg-card/95 backdrop-blur-xl" : "bg-card"
      }`}
    >
      <label className={`${field} col-span-2 md:flex-[1.2]`}>
        <span className={label}>Where</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={`${input} cursor-pointer`}>
          <option value="">Anywhere</option>
          {(Object.keys(CITIES) as CitySlug[]).map((c) => (
            <option key={c} value={c}>
              {CITIES[c].name}
            </option>
          ))}
        </select>
      </label>
      <label className={`${field} md:flex-1`}>
        <span className={label}>Check in</span>
        <input
          type="date"
          min={today}
          value={checkin}
          onChange={(e) => {
            setCheckin(e.target.value);
            if (checkout && checkout <= e.target.value) setCheckout("");
          }}
          className={input}
        />
      </label>
      <label className={`${field} md:flex-1`}>
        <span className={label}>Check out</span>
        <input
          type="date"
          min={checkin || today}
          value={checkout}
          onChange={(e) => setCheckout(e.target.value)}
          className={input}
        />
      </label>
      <label className={`${field} md:w-28`}>
        <span className={label}>Guests</span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={`${input} cursor-pointer`}>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </label>
      <label className={`${field} flex-row items-center gap-2 md:w-24`}>
        <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} className="accent-[var(--ember)]" />
        <span className="text-sm">Pets</span>
      </label>
      <button
        type="submit"
        className="col-span-2 m-1 rounded-full bg-ember px-6 py-3 font-medium text-white transition hover:bg-ember-2 md:m-0"
      >
        Search
      </button>
    </form>
  );
}

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
