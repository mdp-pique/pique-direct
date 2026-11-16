import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Search engines and AI assistants are all welcome: being found and quoted by
// them is the point of this site. Only the JSON endpoints are kept out.
// Named so nobody mistakes them for blocked: OAI-SearchBot / ChatGPT-User =
// ChatGPT search and links; Claude-SearchBot / Claude-User = Claude; Bingbot
// also feeds ChatGPT and Copilot search. Same list as the owner site.
const BOTS = [
  "Googlebot", "Bingbot", "Applebot", "Applebot-Extended", "Google-Extended",
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/"];
  return {
    rules: [...BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow })), { userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
