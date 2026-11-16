import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist } from "next/font/google";
import { AskPique } from "@/components/AskPique";
import { CookieBanner } from "@/components/CookieBanner";
import { Tracking } from "@/components/Tracking";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import "./globals.css";

// Same type as the owner site (pique-management): Bodoni Moda for display, Geist for text.
const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", axes: ["opsz"] });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, locale: SITE.locale },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  // Search Console / Bing Webmaster Tools ownership tags (HTML tag method); set in Vercel.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "dE0yhu7plA5kA815Bgb-T3yn8IhNWKBYiwanDaOCeKY",
    other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "EF130544B212B46DE29C7602AF1067E1" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#17191a" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA" className={`${bodoni.variable} ${geist.variable}`}>
      <head>
        {/* Lets the scroll-reveal CSS hide content only when JS is running. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
            areaServed: ["Edmonton", "Canmore", "Calgary"].map((c) => ({ "@type": "City", name: `${c}, Alberta` })),
          }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <AskPique />
        <CookieBanner />
        <Tracking />
      </body>
    </html>
  );
}
