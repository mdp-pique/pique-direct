"use client";

import type { Party } from "@/lib/party";

// Adults / children / infants / pets, the way hotel and rental sites ask.
// Infants don't count toward a home's guest limit; they get a pack 'n play.
export function GuestPicker({
  party,
  onChange,
  maxGuests = 16,
  petsAllowed = true,
}: {
  party: Party;
  onChange: (p: Party) => void;
  maxGuests?: number;
  petsAllowed?: boolean;
}) {
  const seated = party.adults + party.children;
  const rows: { key: keyof Party; label: string; hint: string; min: number; max: number }[] = [
    { key: "adults", label: "Adults", hint: "Ages 13 and up", min: 1, max: maxGuests - party.children },
    { key: "children", label: "Children", hint: "Ages 2 to 12", min: 0, max: maxGuests - party.adults },
    { key: "infants", label: "Infants", hint: "Under 2", min: 0, max: 4 },
  ];
  if (petsAllowed) rows.push({ key: "pets", label: "Pets", hint: "Pet-friendly homes only", min: 0, max: 4 });

  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-6 py-4">
            <div>
              <p className="font-medium">{r.label}</p>
              <p className="text-sm text-muted">{r.hint}</p>
            </div>
            <div className="flex items-center gap-3">
              <Step label={`Fewer ${r.label.toLowerCase()}`} disabled={party[r.key] <= r.min} onClick={() => onChange({ ...party, [r.key]: party[r.key] - 1 })}>
                −
              </Step>
              <span className="w-5 text-center tabular-nums">{party[r.key]}</span>
              <Step label={`More ${r.label.toLowerCase()}`} disabled={party[r.key] >= r.max} onClick={() => onChange({ ...party, [r.key]: party[r.key] + 1 })}>
                +
              </Step>
            </div>
          </li>
        ))}
      </ul>
      {party.infants > 0 && (
        <p className="mt-1 rounded-xl bg-alpine/10 px-4 py-3 text-sm text-ink">
          Pack &apos;n plays are free. We&apos;ll confirm one for your stay before you arrive.
        </p>
      )}
      {seated >= maxGuests && maxGuests < 16 && <p className="mt-2 text-sm text-muted">This home sleeps up to {maxGuests}, not counting infants.</p>}
    </div>
  );
}

function Step({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line"
    >
      {children}
    </button>
  );
}
