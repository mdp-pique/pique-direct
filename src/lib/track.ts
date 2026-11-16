// Analytics events and settings, shared by the cookie banner and every
// component that reports something (search, Book now, the application).
// IDs come from Vercel env vars, so turning a tool on or off needs no code.
//
// Google Tag Manager is the container: GA4, Google Ads, Meta, HighLevel /
// Nurture to Profit, OpenAI / ChatGPT ads or any other pixel are added as tags
// there, without a deploy. GA4 can also run on its own (no GTM) and HighLevel's
// tracking script can be loaded directly. Nothing loads until the visitor
// accepts cookies.
// Container set up 11-16 under info@piquepropertiesinc.com (GA4 runs inside it).
// An env var overrides it; set NEXT_PUBLIC_GTM_ID to "off" to switch it off.
const GTM_SETTING = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-5QDMGGW";
export const GTM_ID = GTM_SETTING === "off" ? "" : GTM_SETTING;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const HIGHLEVEL_TRACKING_ID = process.env.NEXT_PUBLIC_HIGHLEVEL_TRACKING_ID ?? "";
export const TRACKING_ENABLED = Boolean(GTM_ID || GA_ID || HIGHLEVEL_TRACKING_ID);

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// One call per event: GTM reads it from the dataLayer (use a Custom Event
// trigger with the same name); GA4 without GTM gets it through gtag.
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !TRACKING_ENABLED) return;
  (window.dataLayer = window.dataLayer || []).push({ event, ...params });
  if (!GTM_ID && window.gtag) window.gtag("event", event, params);
}
