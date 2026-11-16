"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent, type Consent } from "@/components/CookieBanner";
import { GA_ID, GTM_ID, HIGHLEVEL_TRACKING_ID, TRACKING_ENABLED, track } from "@/lib/track";

// Loads the tracking tools once the visitor has accepted cookies, and reports
// call / text / email link taps on every page.
export function Tracking() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!TRACKING_ENABLED) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readConsent() === "accepted") setAccepted(true);
    const onConsent = (e: Event) => {
      const choice = (e as CustomEvent<Consent>).detail;
      if (choice === "accepted") return setAccepted(true);
      // Declined after accepting: tell Google, then reload so nothing keeps running.
      if (window.gtag) {
        window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        window.location.reload();
      }
    };
    window.addEventListener("pique:consent", onConsent);
    return () => window.removeEventListener("pique:consent", onConsent);
  }, []);

  useEffect(() => {
    if (!TRACKING_ENABLED) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      const method = href.startsWith("tel:") ? "call" : href.startsWith("sms:") ? "text" : href.startsWith("mailto:") ? "email" : null;
      if (method) track("contact", { method });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!accepted) return null;
  return (
    <>
      {/* Google Consent Mode v2: these tags only ever load after Accept. */}
      <Script id="consent-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});`}
      </Script>
      {GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});`}
        </Script>
      )}
      {!GTM_ID && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
          </Script>
        </>
      )}
      {HIGHLEVEL_TRACKING_ID && (
        <Script src="https://link.msgsndr.com/js/external-tracking.js" data-tracking-id={HIGHLEVEL_TRACKING_ID} strategy="afterInteractive" />
      )}
    </>
  );
}
