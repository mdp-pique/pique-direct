import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INFO_BY_SLUG, INFO_PAGES, type Block } from "@/content/info";

// About, contact, FAQ and the policy pages, all from src/content/info.ts.
export const dynamicParams = false;
export function generateStaticParams() {
  return INFO_PAGES.map((p) => ({ info: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ info: string }> }): Promise<Metadata> {
  const page = INFO_BY_SLUG.get((await params).info);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/${page.slug}` } };
}

export default async function InfoPage({ params }: { params: Promise<{ info: string }> }) {
  const page = INFO_BY_SLUG.get((await params).info);
  if (!page) notFound();
  const faq = page.slug === "faq";
  return (
    <article className="mx-auto max-w-3xl px-4 pb-8 pt-32 sm:px-6">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{page.title}</h1>
      <p className="mt-3 text-sm text-mist">Updated {page.updated}</p>
      {page.intro && <p className="mt-6 text-lg text-basalt-soft">{rich(page.intro)}</p>}
      <div className="mt-10 space-y-10">
        {page.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="font-display text-2xl">{s.heading}</h2>}
            <div className={`${s.heading ? "mt-3" : ""} space-y-4 leading-relaxed text-basalt-soft`}>
              {s.body.map((b, j) => (
                <BlockView key={j} b={b} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: page.sections.map((s) => ({
                "@type": "Question",
                name: s.heading,
                acceptedAnswer: { "@type": "Answer", text: s.body.filter((b): b is string => typeof b === "string").join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </article>
  );
}

function BlockView({ b }: { b: Block }) {
  if (typeof b === "string") return <p>{rich(b)}</p>;
  if ("h" in b) return <h3 className="font-medium text-basalt">{b.h}</h3>;
  return (
    <ul className="list-disc space-y-2 pl-5">
      {b.list.map((li, i) => (
        <li key={i}>{rich(li)}</li>
      ))}
    </ul>
  );
}

// [text](/path), [text](https://...), tel: and mailto: links inside copy.
function rich(text: string) {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (let m; (m = re.exec(text)); ) {
    out.push(text.slice(last, m.index));
    const [, label, href] = m;
    const cls = "text-river underline underline-offset-2 hover:text-river-2";
    out.push(
      href.startsWith("/") ? (
        <Link key={m.index} href={href} className={cls}>
          {label}
        </Link>
      ) : (
        <a key={m.index} href={href} className={cls}>
          {label}
        </a>
      ),
    );
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}
