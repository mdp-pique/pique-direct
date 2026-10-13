import "server-only";

// Saves Ask Pique conversations to the ops Supabase project through
// record_website_chat_turn(), the only thing the website can do there: it uses
// the public anon key plus WEBSITE_CHAT_SECRET, which the function checks.
// Saving never blocks or breaks a reply.
export async function saveTurn(
  chat: { id: string; page_url?: string; property_id?: string; handed_off: boolean },
  messages: { role: "guest" | "assistant"; content: string; tools?: unknown }[],
) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const secret = process.env.WEBSITE_CHAT_SECRET;
  if (!url || !key || !secret) return;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_website_chat_turn`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_secret: secret, p_chat: chat, p_messages: messages }),
      cache: "no-store",
    });
    if (!res.ok) console.error("chat save", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("chat save", e);
  }
}
