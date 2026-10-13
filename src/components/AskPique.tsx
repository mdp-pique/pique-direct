"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Contact = { phone: string; display: string; text: string };
type Turn = { role: "guest" | "assistant"; content: string; contact?: Contact | null; ref?: string };

const STORE = "ask-pique";
const SUGGESTIONS = [
  "A hot tub in Edmonton this weekend",
  "Pet-friendly places in Canmore",
  "How does check-in work?",
];

// Floating Ask Pique chat. The conversation lives in this tab's session
// storage so it follows the guest from page to page.
export function AskPique() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as { chatId: string; turns: Turn[] } | null;
      /* eslint-disable react-hooks/set-state-in-effect -- one-time restore after hydration */
      if (saved?.chatId) {
        setChatId(saved.chatId);
        setTurns(saved.turns ?? []);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  useEffect(() => {
    if (!chatId) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ chatId, turns }));
    } catch {}
  }, [chatId, turns]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const id = chatId ?? crypto.randomUUID();
    if (!chatId) setChatId(id);
    const next: Turn[] = [...turns, { role: "guest", content }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: id,
          page: pathname,
          turns: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      const contact: Contact | null = j.contact && typeof j.contact === "object" ? j.contact : null;
      setTurns([...next, { role: "assistant", content: j.reply ?? j.error ?? "Something went wrong.", contact, ref: typeof j.ref === "string" ? j.ref : undefined }]);
    } catch {
      setTurns([...next, { role: "assistant", content: "I couldn't reach the server. Check your connection and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTurns([]);
    setChatId(null);
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close Ask Pique" : "Ask Pique a question"}
        className={`fixed bottom-4 right-4 z-[55] flex h-14 items-center gap-2 rounded-full bg-alpine px-5 font-medium text-paper shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition hover:scale-[1.03] ${
          open ? "max-md:hidden" : ""
        }`}
      >
        <span aria-hidden className="text-lg leading-none">{open ? "✕" : "✦"}</span>
        <span className={open ? "hidden md:inline" : "hidden sm:inline"}>{open ? "Close" : "Ask Pique"}</span>
      </button>

      {open && (
        <section
          aria-label="Ask Pique"
          className="fixed inset-0 z-[56] flex flex-col bg-card text-ink md:inset-auto md:bottom-24 md:right-4 md:h-[min(640px,calc(100dvh-8rem))] md:w-[400px] md:rounded-3xl md:border md:border-line md:shadow-2xl"
          style={{ animation: "fade 0.2s ease-out both" }}
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="font-display text-xl">Ask Pique</p>
              <p className="text-xs text-muted">Homes, dates and prices, answered right away</p>
            </div>
            <div className="flex items-center gap-1">
              {turns.length > 0 && (
                <button type="button" onClick={reset} className="rounded-full px-3 py-1.5 text-xs text-ink-soft hover:bg-paper-2">
                  New chat
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="h-9 w-9 rounded-full text-lg hover:bg-paper-2">
                ✕
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
            {turns.length === 0 && (
              <div>
                <p className="text-ink-soft">
                  Hi! Tell me where and when you&apos;d like to stay, or ask anything about our homes.
                </p>
                <div className="mt-4 flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-line px-4 py-2 text-left text-sm transition hover:border-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) =>
              t.role === "guest" ? (
                <p key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-alpine px-4 py-2.5 text-sm text-paper">
                  {t.content}
                </p>
              ) : (
                <div key={i} className="max-w-[92%] text-sm leading-relaxed">
                  <Rich text={t.content} onNavigate={() => window.innerWidth < 768 && setOpen(false)} />
                  {t.contact && <ContactButtons c={t.contact} />}
                  {t.ref && <p className="mt-2 text-[11px] text-muted">Error code {t.ref}</p>}
                </div>
              ),
            )}
            {busy && (
              <p className="flex gap-1 text-muted" aria-label="Ask Pique is typing">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:120ms]">•</span>
                <span className="animate-bounce [animation-delay:240ms]">•</span>
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-2 border-t border-line p-3"
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Ask about a stay"
              aria-label="Your message"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="h-11 rounded-full bg-ember px-5 text-sm font-medium text-white transition hover:bg-ember-2 disabled:opacity-40"
            >
              Send
            </button>
          </form>
          <p className="px-5 pb-3 text-center text-[11px] text-muted">
            Ask Pique can make mistakes. Chats are saved so we can improve.
          </p>
        </section>
      )}
    </>
  );
}

function ContactButtons({ c }: { c: Contact }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a href={`tel:${c.phone}`} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
        Call {c.display}
      </a>
      <a href={`sms:${c.phone}?&body=${encodeURIComponent(c.text)}`} className="rounded-full border border-ink px-4 py-2 text-sm font-medium">
        Text us
      </a>
    </div>
  );
}

// Paragraphs, **bold**, bullet lines and links to our own pages. Nothing else
// is rendered as HTML.
function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n");
        const bullets = lines.every((l) => /^\s*[-•*]\s+/.test(l));
        return bullets ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {lines.map((l, j) => (
              <li key={j}>{inline(l.replace(/^\s*[-•*]\s+/, ""), onNavigate)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {inline(block, onNavigate)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string, onNavigate: () => void) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)\s]*\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (link) {
      return (
        <Link key={i} href={link[2]} onClick={onNavigate} className="font-medium text-ember underline underline-offset-2">
          {link[1]}
        </Link>
      );
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return part;
  });
}
