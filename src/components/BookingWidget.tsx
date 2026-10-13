"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PARTY, describeParty, partyFromQuery, type Party } from "@/lib/party";
import { GuestPicker } from "./GuestPicker";

type Day = { date: string; available: boolean; price: number; minStay: number; noCheckin: boolean; noCheckout: boolean };
type Quote = { nights: number; bookingUrl: string; lines: { label: string; amount: string; discount?: boolean }[]; total: string };

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function BookingWidget({
  propertyId,
  maxGuests,
  petsAllowed,
  currency,
}: {
  propertyId: string;
  maxGuests: number;
  petsAllowed: boolean;
  currency: string;
}) {
  const [days, setDays] = useState<Map<string, Day> | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [checkin, setCheckin] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);
  const [party, setParty] = useState<Party>(DEFAULT_PARTY);
  const [whoOpen, setWhoOpen] = useState(false);
  const { adults, children, infants, pets } = party;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dates and party from a search (?checkin=&checkout=&adults=&children=&infants=&pets=) preselect the stay.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ci = q.get("checkin");
    const co = q.get("checkout");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the URL after hydration */
    if (ci && co && /^\d{4}-\d{2}-\d{2}$/.test(ci) && /^\d{4}-\d{2}-\d{2}$/.test(co) && co > ci) {
      setCheckin(ci);
      setCheckout(co);
      setMonth(`${ci.slice(0, 7)}-01`);
    }
    if (q.has("adults") || q.has("guests")) {
      const p = partyFromQuery((k) => q.get(k));
      const adults = Math.min(p.adults, maxGuests);
      setParty({ ...p, adults, children: Math.min(p.children, maxGuests - adults), pets: petsAllowed ? p.pets : 0 });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [maxGuests, petsAllowed]);

  useEffect(() => {
    let live = true;
    fetch(`/api/availability?id=${propertyId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Couldn't load availability");
        if (live) setDays(new Map((j.days as Day[]).map((d) => [d.date, d])));
      })
      .catch((e: Error) => live && setCalendarError(e.message));
    return () => {
      live = false;
    };
  }, [propertyId]);

  // Re-price whenever the stay changes.
  useEffect(() => {
    if (!checkin || !checkout) return;
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the request below
    setLoading(true);
    setQuoteError(null);
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, checkin, checkout, adults, children, infants, pets }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!live) return;
        if (!r.ok) {
          setQuote(null);
          setQuoteError(j.error ?? "Couldn't price that stay.");
        } else setQuote(j);
      })
      .catch(() => live && setQuoteError("Couldn't price that stay."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [propertyId, checkin, checkout, adults, children, infants, pets]);

  const fromPrice = useMemo(() => {
    if (!days) return null;
    const prices = [...days.values()].filter((d) => d.available).slice(0, 60).map((d) => d.price);
    return prices.length ? Math.min(...prices) : null;
  }, [days]);

  function pick(date: string) {
    const d = days?.get(date);
    if (!checkin || checkout || date <= checkin) {
      if (!d?.available || d.noCheckin) return;
      setCheckin(date);
      setCheckout(null);
      setQuote(null);
      setQuoteError(null);
      return;
    }
    // Every night from check-in up to (not including) checkout must be open.
    for (let x = checkin; x < date; x = addDays(x, 1)) {
      if (!days?.get(x)?.available) {
        setQuoteError("Some nights in that range are booked.");
        return;
      }
    }
    const min = days?.get(checkin)?.minStay ?? 1;
    if (nightsBetween(checkin, date) < min) {
      setQuoteError(`Minimum stay from that date is ${min} nights.`);
      return;
    }
    if (d?.noCheckout) {
      setQuoteError("Check-out isn't possible on that day.");
      return;
    }
    setCheckout(date);
  }

  const today = isoDate(new Date());
  const money = (cents: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] sm:p-6">
      <p className="font-display text-2xl">
        {fromPrice ? (
          <>
            From {money(fromPrice)} <span className="text-base text-ink-soft">/ night</span>
          </>
        ) : (
          "Check dates & price"
        )}
      </p>

      {calendarError ? (
        <p className="mt-4 rounded-xl bg-paper-2 p-4 text-sm text-ink-soft">{calendarError}</p>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              disabled={month <= firstOfMonth(new Date())}
              onClick={() => setMonth(addMonths(month, -1))}
              className="h-9 w-9 rounded-full hover:bg-paper-2 disabled:opacity-30"
            >
              ←
            </button>
            <p className="font-medium">
              {new Date(`${month}T12:00:00`).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
              className="h-9 w-9 rounded-full hover:bg-paper-2"
            >
              →
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-muted">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {monthGrid(month).map((date, i) => {
              if (!date) return <span key={i} />;
              const d = days?.get(date);
              const past = date < today;
              const open = !past && Boolean(d?.available);
              const inRange = checkin && checkout && date > checkin && date < checkout;
              const isEnd = date === checkin || date === checkout;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!days || past || (!open && !(checkin && !checkout && date > checkin))}
                  onClick={() => pick(date)}
                  className={`flex h-12 flex-col items-center justify-center rounded-xl text-sm transition ${
                    isEnd
                      ? "bg-alpine text-paper"
                      : inRange
                        ? "bg-alpine/10"
                        : open
                          ? "hover:bg-paper-2"
                          : "text-muted line-through opacity-50"
                  }`}
                >
                  <span>{Number(date.slice(8))}</span>
                  {open && d && <span className={`text-[10px] ${isEnd ? "text-paper/80" : "text-muted"}`}>{money(d.price)}</span>}
                </button>
              );
            })}
          </div>
          {!days && <p className="mt-2 text-center text-xs text-muted">Loading live availability…</p>}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-line">
        <button
          type="button"
          aria-expanded={whoOpen}
          onClick={() => setWhoOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span>
            <span className="block text-xs font-semibold">Who</span>
            <span className="block text-sm text-ink-soft">{describeParty(party)}</span>
          </span>
          <span className={`text-muted transition ${whoOpen ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {whoOpen && (
          <div className="border-t border-line px-4 pb-3">
            <GuestPicker party={party} onChange={setParty} maxGuests={maxGuests} petsAllowed={petsAllowed} />
          </div>
        )}
      </div>

      {quoteError && <p className="mt-4 text-sm text-ember-2">{quoteError}</p>}

      {quote && (
        <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          {quote.lines.map((l) => (
            <div key={l.label} className={`flex justify-between ${l.discount ? "text-alpine" : ""}`}>
              <span className="text-ink-soft">{l.label}</span>
              <span>{l.amount}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{quote.total}</span>
          </div>
        </div>
      )}

      {quote ? (
        <a
          href={quote.bookingUrl}
          className="mt-5 block rounded-full bg-ember py-3.5 text-center font-medium text-white transition hover:bg-ember-2"
        >
          Book now
        </a>
      ) : (
        <p className="mt-5 rounded-full border border-line py-3.5 text-center text-sm text-ink-soft">
          {loading ? "Pricing your stay…" : checkin ? "Now pick your check-out day" : "Pick your check-in day"}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted">Secure checkout by Stripe. No platform service fee.</p>
    </div>
  );
}

// --- date helpers (all YYYY-MM-DD strings, no time zones involved) ----------

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function firstOfMonth(d: Date) {
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function addMonths(iso: string, n: number) {
  const [y, m] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1 + n, 1));
}
function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + n));
}
function nightsBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
function monthGrid(first: string) {
  const [y, m] = first.split("-").map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const count = new Date(y, m, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => isoDate(new Date(y, m - 1, i + 1))),
  ];
}
