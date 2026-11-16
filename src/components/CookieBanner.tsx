"use client";

import { useEffect, useState } from "react";
import { TRACKING_ENABLED } from "@/lib/track";

// Holds analytics and ad pixels until the visitor accepts. Same banner as the owner site (pique-management).
// Only shown once a tracking tool is configured (NEXT_PUBLIC_GTM_ID, _GA_ID or
// _HIGHLEVEL_TRACKING_ID, see lib/track.ts); until then the site sets no
// tracking cookies, so there's nothing to ask. Tracking.tsx reads the choice.
const KEY = "pique_consent";
// No privacy page on this site yet (needed before tracking is switched on).
const PRIVACY_HREF: string | null = null;
export type Consent = "accepted" | "declined";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("pique:cookies"));
}

export function CookieBanner() {
  const enabled = TRACKING_ENABLED;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("pique:cookies", reopen);
    return () => window.removeEventListener("pique:cookies", reopen);
  }, [enabled]);
  if (!open) return null;
  const choose = (c: Consent) => {
    try {
      localStorage.setItem(KEY, c);
      localStorage.setItem(`${KEY}_at`, new Date().toISOString());
    } catch {}
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pique:consent", { detail: c }));
  };
  return (
    <div role="dialog" aria-label="Cookie settings" className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-2xl rounded-2xl border border-rule bg-snow p-5 text-basalt shadow-2xl sm:p-6">
      <p className="text-[15px] leading-relaxed">
        We&rsquo;d like to use cookies for Google Analytics and our ad and marketing tools (Google, Meta, HighLevel) to see how the site is used and measure our ads. They only run if you accept.{" "}
        {PRIVACY_HREF && <a href={PRIVACY_HREF} className="underline underline-offset-2">Privacy Policy</a>}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("accepted")} className="rounded-full bg-river px-5 py-2.5 text-[14px] font-medium text-on-dark">
          Accept
        </button>
        <button type="button" onClick={() => choose("declined")} className="rounded-full border border-rule px-5 py-2.5 text-[14px]">
          Decline
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ className = "" }: { className?: string }) {
  if (!TRACKING_ENABLED) return null;
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
