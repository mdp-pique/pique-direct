"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CITIES, type CitySlug } from "@/lib/site";
import { DEFAULT_PARTY, describeParty, partyToQuery, type Party } from "@/lib/party";
import { GuestPicker } from "./GuestPicker";
import { RangeCalendar, formatRange } from "./RangeCalendar";

export type SearchValues = { city?: string; checkin?: string; checkout?: string; party?: Party };

type Panel = "where" | "dates" | "who" | null;

// Where / when / who, sent to /search. Each field opens its own panel; on
// phones the panel docks to the bottom of the screen like a sheet.
export function SearchBar({
  initial = {},
  variant = "page",
  keepQuery,
}: {
  initial?: SearchValues;
  variant?: "hero" | "page";
  // Filters already applied on the results page, kept when searching again.
  keepQuery?: string;
}) {
  const router = useRouter();
  const [city, setCity] = useState(initial.city ?? "");
  const [checkin, setCheckin] = useState<string | null>(initial.checkin ?? null);
  const [checkout, setCheckout] = useState<string | null>(initial.checkout ?? null);
  const [party, setParty] = useState<Party>(initial.party ?? DEFAULT_PARTY);
  const [open, setOpen] = useState<Panel>(null);
  const root = useRef<HTMLFormElement>(null);
  // Checking every home's calendar can take a few seconds: show it right away.
  const [searching, startSearch] = useTransition();

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
    const q = new URLSearchParams(keepQuery);
    if (city) q.set("city", city);
    if (checkin && checkout) {
      q.set("checkin", checkin);
      q.set("checkout", checkout);
    }
    partyToQuery(party, q);
    setOpen(null);
    startSearch(() => router.push(`/search?${q}`));
  }

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));
  const dates = formatRange(checkin, checkout);

  return (
    <form
      ref={root}
      onSubmit={submit}
      className={`relative rounded-[1.75rem] border border-rule p-1.5 text-basalt md:w-fit md:max-w-full shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)] md:rounded-full ${
        "bg-card"
      }`}
    >
      <div className="grid grid-cols-2 md:flex md:items-center">
        <Field label="Where" value={city ? CITIES[city as CitySlug].name : "Anywhere"} active={open === "where"} onClick={() => toggle("where")} className="col-span-2 md:w-40" />
        <Field
          label="Dates"
          value={dates ?? "Add dates"}
          placeholder={!dates}
          active={open === "dates"}
          onClick={() => toggle("dates")}
          className="col-span-2 md:w-60"
        />
        <Field label="Who" value={describeParty(party)} active={open === "who"} onClick={() => toggle("who")} className="md:w-48" />
        <button
          type="submit"
          disabled={searching}
          aria-busy={searching}
          className="m-1 inline-flex items-center justify-center gap-2 rounded-full bg-river px-6 py-3.5 md:ml-2 font-medium text-on-dark transition hover:bg-river-2 disabled:cursor-wait disabled:opacity-90"
        >
          {searching && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {searching ? "Searching" : "Search"}
        </button>
      </div>

      {open && <div aria-hidden className="fixed inset-0 z-[65] bg-black/40 md:hidden" style={{ animation: "fade 0.2s ease-out both" }} />}
      {open && (
        <div
          className={`fixed inset-x-0 bottom-0 z-[70] max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-rule bg-card p-5 text-basalt shadow-2xl md:absolute md:inset-x-auto md:rounded-3xl md:p-6 ${
            // The hero bar sits at the bottom of the screen, so its panels open upward.
            variant === "hero" ? "md:bottom-[calc(100%+10px)] md:top-auto" : "md:bottom-auto md:top-[calc(100%+10px)]"
          } ${
            open === "dates" ? "md:left-0 md:w-[720px]" : open === "who" ? "md:right-0 md:w-[380px]" : "md:left-0 md:w-72"
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
                      className={`flex w-full items-baseline justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-snow-2 ${
                        city === value ? "bg-snow-2 font-semibold" : ""
                      }`}
                    >
                      <span>{name}</span>
                      <span className="text-sm text-mist">{hint}</span>
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
              <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
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
                  className="rounded-full bg-basalt px-5 py-2.5 text-sm font-medium text-snow"
                >
                  {checkin && checkout ? "Next" : "Done"}
                </button>
              </div>
            </>
          )}
          {open === "who" && (
            <>
              <GuestPicker party={party} onChange={setParty} />
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="mt-4 w-full rounded-full bg-basalt py-3 font-medium text-snow transition hover:opacity-90"
              >
                Done
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
      className={`min-w-0 rounded-full px-5 py-2.5 text-left transition ${active ? "bg-snow-2 ring-1 ring-rule" : "hover:bg-snow-2/70"} ${className}`}
    >
      <span className="block text-xs font-semibold text-basalt">{label}</span>
      <span className={`block truncate text-sm ${placeholder ? "text-mist" : "text-basalt-soft"}`}>{value}</span>
    </button>
  );
}
