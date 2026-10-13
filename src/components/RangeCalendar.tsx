"use client";

import { useState } from "react";

// Two-month (one on phones) range calendar for picking check-in and check-out.
// Dates are YYYY-MM-DD strings in the visitor's local calendar.
export function RangeCalendar({
  checkin,
  checkout,
  onChange,
}: {
  checkin: string | null;
  checkout: string | null;
  onChange: (checkin: string | null, checkout: string | null) => void;
}) {
  const today = localIso(new Date());
  const [month, setMonth] = useState(() => (checkin ?? today).slice(0, 7) + "-01");
  const [hover, setHover] = useState<string | null>(null);

  function pick(date: string) {
    if (!checkin || checkout || date <= checkin) onChange(date, null);
    else onChange(checkin, date);
  }

  const rangeEnd = checkout ?? (checkin && hover && hover > checkin ? hover : null);

  return (
    <div>
      <div className="flex items-center justify-between px-1">
        <NavButton label="Previous month" disabled={month <= today.slice(0, 7) + "-01"} onClick={() => setMonth(addMonths(month, -1))}>
          ‹
        </NavButton>
        <NavButton label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
          ›
        </NavButton>
      </div>
      <div className="-mt-9 grid gap-8 md:grid-cols-2">
        {[month, addMonths(month, 1)].map((m, idx) => (
          <div key={m} className={idx === 1 ? "hidden md:block" : ""}>
            <p className="text-center text-[15px] font-semibold">
              {new Date(`${m}T12:00:00`).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
            </p>
            <div className="mt-4 grid grid-cols-7 text-center text-xs text-muted">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="pb-2">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
              {monthGrid(m).map((date, i) => {
                if (!date) return <span key={i} />;
                const past = date < today;
                const isStart = date === checkin;
                const isEnd = date === rangeEnd;
                const between = checkin && rangeEnd && date > checkin && date < rangeEnd;
                return (
                  <div
                    key={date}
                    className={`relative h-11 ${between ? "bg-alpine/10" : ""} ${
                      isStart && rangeEnd ? "rounded-l-full bg-alpine/10" : ""
                    } ${isEnd && checkin ? "rounded-r-full bg-alpine/10" : ""}`}
                  >
                    <button
                      type="button"
                      disabled={past}
                      onClick={() => pick(date)}
                      onMouseEnter={() => setHover(date)}
                      aria-label={new Date(`${date}T12:00:00`).toDateString()}
                      aria-pressed={isStart || isEnd}
                      className={`absolute inset-0 m-auto h-11 w-11 rounded-full text-sm transition ${
                        isStart || isEnd
                          ? "bg-alpine font-semibold text-paper"
                          : past
                            ? "cursor-default text-muted/50 line-through"
                            : "hover:ring-1 hover:ring-ink"
                      } ${date === today && !isStart ? "font-semibold underline underline-offset-4" : ""}`}
                    >
                      {Number(date.slice(8))}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-paper-2 disabled:opacity-25"
    >
      {children}
    </button>
  );
}

export function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatRange(checkin: string | null, checkout: string | null) {
  if (!checkin) return null;
  const a = new Date(`${checkin}T12:00:00`);
  const fmt = (d: Date, withMonth: boolean) =>
    d.toLocaleDateString("en-CA", withMonth ? { month: "short", day: "numeric" } : { day: "numeric" });
  if (!checkout) return `${fmt(a, true)} – add check-out`;
  const b = new Date(`${checkout}T12:00:00`);
  const nights = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  const sameMonth = a.getMonth() === b.getMonth();
  return `${fmt(a, true)} – ${fmt(b, !sameMonth)}, ${nights} ${nights === 1 ? "night" : "nights"}`;
}

function addMonths(iso: string, n: number) {
  const [y, m] = iso.split("-").map(Number);
  return localIso(new Date(y, m - 1 + n, 1));
}

function monthGrid(first: string) {
  const [y, m] = first.split("-").map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const count = new Date(y, m, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => localIso(new Date(y, m - 1, i + 1))),
  ];
}
