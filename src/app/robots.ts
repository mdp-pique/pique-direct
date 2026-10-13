import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Search engines and AI assistants are all welcome: being found and quoted by
// them is the point of this site. Only the JSON endpoints are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
