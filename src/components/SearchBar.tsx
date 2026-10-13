"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CITIES, type CitySlug } from "@/lib/site";
import { DEFAULT_PARTY, describeParty, partyToQuery, type Party } from "@/lib/party";
import { GuestPicker } from "./GuestPicker";
import { RangeCalendar, formatRange } from "./RangeCalendar";

export type SearchValues = { city?: string; checkin?: string; checkout?: string; party?: Party };

type Panel = "where" | "dates" | "who" | null;

// Where / when / who, sent to /search. Each field opens its own panel; on
// phones the panel docks to the bottom of the screen like a sheet.
export function SearchBar({ initial = {}, variant = "page" }: { initial?: SearchValues; variant?: "hero" | "page" }) {
  const router = useRouter();
  const [city, setCity] = useState(initial.city ?? "");
  const [checkin, setCheckin] = useState<string | null>(initial.checkin ?? null);
  const [checkout, setCheckout] = useState<string | null>(initial.checkout ?? null);
  const [party, setParty] = useState<Party>(initial.party ?? DEFAULT_PARTY);
  const [open, setOpen] = useState<Panel>(null);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (checkin && checkout) {
      q.set("checkin", checkin);
      q.set("checkout", checkout);
    }
    partyToQuery(party, q);
    setOpen(null);
    router.push(`/search?${q}`);
  }

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));
  const dates = formatRange(checkin, checkout);

  return (
    <form
      ref={root}
      onSubmit={submit}
      className={`relative rounded-[1.75rem] border border-line p-1.5 text-ink shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)] md:rounded-full ${
        "bg-card"
      }`}
    >
      <div className="grid grid-cols-2 md:flex md:items-center">
        <Field label="Where" value={city ? CITIES[city as CitySlug].name : "Anywhere"} active={open === "where"} onClick={() => toggle("where")} className="col-span-2 md:w-48" />
        <Field
          label="Dates"
          value={dates ?? "Add dates"}
          placeholder={!dates}
          active={open === "dates"}
          onClick={() => toggle("dates")}
          className="col-span-2 md:flex-1"
        />
        <Field label="Who" value={describeParty(party)} active={open === "who"} onClick={() => toggle("who")} className="md:w-52" />
        <button type="submit" className="m-1 rounded-full bg-ember px-7 py-3.5 font-medium text-white transition hover:bg-ember-2">
          Search
        </button>
      </div>

      {open && <div aria-hidden className="fixed inset-0 z-[65] bg-black/40 md:hidden" style={{ animation: "fade 0.2s ease-out both" }} />}
      {open && (
        <div
          className={`fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-line bg-card p-5 text-ink shadow-2xl md:absolute md:inset-x-auto md:rounded-3xl md:p-6 ${
            // The hero bar sits at the bottom of the screen, so its panels open upward.
            variant === "hero" ? "md:bottom-[calc(100%+10px)] md:top-auto" : "md:bottom-auto md:top-[calc(100%+10px)]"
          } ${
            open === "dates" ? "md:left-0 md:right-0" : open === "who" ? "md:right-0 md:w-[380px]" : "md:left-0 md:w-72"
          }`}
          style={{ animation: "fade 0.2s ease-out both" }}
        >
          {open === "where" && (
            <ul className="space-y-1">
              {[["", "Anywhere", "All three cities"], ...(Object.keys(CITIES) as CitySlug[]).map((c) => [c, CITIES[c].name, `${CITIES[c].region}`])].map(
                ([value, name, hint]) => (
                  <li key={value}>
                    <button
                      type="button"
                      onClick={() => {
                        setCity(value);
                        setOpen("dates");
                      }}
                      className={`flex w-full items-baseline justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-paper-2 ${
                        city === value ? "bg-paper-2 font-semibold" : ""
                      }`}
                    >
                      <span>{name}</span>
                      <span className="text-sm text-muted">{hint}</span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
          {open === "dates" && (
            <>
              <RangeCalendar
                checkin={checkin}
                checkout={checkout}
                onChange={(a, b) => {
                  setCheckin(a);
                  setCheckout(b);
                }}
              />
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCheckin(null);
                    setCheckout(null);
                  }}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  Clear dates
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(checkin && checkout ? "who" : null)}
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
                >
                  {checkin && checkout ? "Next" : "Done"}
                </button>
              </div>
            </>
          )}
          {open === "who" && (
            <>
              <GuestPicker party={party} onChange={setParty} />
              <button type="submit" className="mt-4 w-full rounded-full bg-ember py-3 font-medium text-white hover:bg-ember-2">
                Search
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  placeholder,
  active,
  onClick,
  className = "",
}: {
  label: string;
  value: string;
  placeholder?: boolean;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`min-w-0 rounded-full px-5 py-2.5 text-left transition ${active ? "bg-paper-2 ring-1 ring-line" : "hover:bg-paper-2/70"} ${className}`}
    >
      <span className="block text-xs font-semibold text-ink">{label}</span>
      <span className={`block truncate text-sm ${placeholder ? "text-muted" : "text-ink-soft"}`}>{value}</span>
    </button>
  );
}
