import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/chat/prompt";
import { saveTurn } from "@/lib/chat/store";
import { TOOLS, runTool, type ToolContext } from "@/lib/chat/tools";
import { SITE } from "@/lib/site";

export const maxDuration = 60;

const MODEL = "claude-opus-5-5";
const MAX_GUEST_TURNS = 20; // per conversation
const MAX_CHARS = 1000; // per guest message
const MAX_STEPS = 6; // tool rounds per answer
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Best-effort per-instance limit; a shared limiter can replace it if the chat is abused.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

type Turn = { role: "guest" | "assistant"; content: string };

// Shown with every error, so a guest is never stuck.
const CONTACT = { phone: SITE.phone.e164, display: SITE.phone.display, text: "Hi, I have a question about a stay." };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Ask Pique isn't switched on yet.", contact: CONTACT }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "That's a lot of questions at once. Give it a few minutes, or call or text us.", contact: CONTACT }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as {
    chatId?: string;
    turns?: Turn[];
    page?: string;
    propertyId?: string;
  } | null;
  const turns = Array.isArray(body?.turns) ? body!.turns : [];
  const last = turns.at(-1);
  if (!body?.chatId || !UUID.test(body.chatId) || !last || last.role !== "guest" || typeof last.content !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (last.content.length > MAX_CHARS) {
    return NextResponse.json({ error: `Please keep messages under ${MAX_CHARS} characters.` }, { status: 400 });
  }
  if (turns.filter((t) => t.role === "guest").length > MAX_GUEST_TURNS) {
    return NextResponse.json({ error: "This chat has reached its limit. Call or text the team and they'll take it from here.", contact: CONTACT }, { status: 429 });
  }

  // History is plain text from the browser: it can only ever be a guest or an assistant turn.
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.slice(-24).map((t) => ({
    role: t.role === "assistant" ? "assistant" : "user",
    content: String(t.content).slice(0, 4000),
  }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  messages.push({
    role: "system",
    content: `Today is ${new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton", weekday: "long", year: "numeric", month: "long", day: "numeric" })} (Edmonton time).${
      body.page ? ` The guest is on ${body.page.slice(0, 200)}.` : ""
    }`,
  });

  const client = new Anthropic();
  const ctx: ToolContext = { quotes: 0, contact: null, linkedHomes: new Set() };
  const toolLog: { name: string; input: unknown }[] = [];
  let reply = "";

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        reply = "I can't help with that one here. Our team can, though: give us a call or send a text.";
        ctx.contact ??= { text: "Hi, I have a question about a stay." };
        break;
      }
      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (response.stop_reason !== "tool_use") {
        reply = text;
        break;
      }

      messages.push({ role: "assistant", content: response.content });
      const uses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      const results = await Promise.all(
        uses.map(async (u): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          toolLog.push({ name: u.name, input: u.input });
          try {
            return { type: "tool_result", tool_use_id: u.id, content: await runTool(u.name, u.input as Record<string, unknown>, ctx) };
          } catch (e) {
            console.error("chat tool", u.name, e);
            return { type: "tool_result", tool_use_id: u.id, content: "The tool failed. Tell the guest you couldn't check that right now.", is_error: true };
          }
        }),
      );
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    console.error("chat", e);
    return NextResponse.json({ error: "Ask Pique is having trouble right now. Call or text us and we'll help.", contact: CONTACT }, { status: 502 });
  }

  if (!reply) {
    reply = "Sorry, I couldn't finish that one. Could you ask it a different way, or call or text the team?";
    ctx.contact ??= { text: "Hi, I have a question about a stay." };
  }
  // Only links to our own pages survive; anything else the model wrote stays plain text.
  reply = keepOwnLinks(reply);

  const chat = {
    id: body.chatId,
    page_url: body.page?.slice(0, 500),
    property_id: body.propertyId?.slice(0, 64),
    handed_off: Boolean(ctx.contact),
  };
  after(() =>
    saveTurn(chat, [
      { role: "guest", content: last.content },
      { role: "assistant", content: reply, tools: toolLog.length ? toolLog : undefined },
    ]),
  );

  return NextResponse.json({
    reply,
    contact: ctx.contact ? { phone: SITE.phone.e164, display: SITE.phone.display, text: ctx.contact.text } : null,
  });
}

function keepOwnLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, href: string) => {
    if (href.startsWith("/") && !href.startsWith("//")) return m;
    if (href.startsWith(SITE.url)) return `[${label}](${href.slice(SITE.url.length) || "/"})`;
    return label;
  });
}
