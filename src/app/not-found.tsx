import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-40 text-center">
      <h1 className="font-display text-5xl">This stay has moved on.</h1>
      <p className="mt-4 text-basalt-soft">The page you were looking for isn&apos;t here anymore.</p>
      <Link href="/stays" className="mt-8 inline-block rounded-full bg-river px-6 py-3 font-medium text-on-dark hover:bg-river-2">
        See all stays
      </Link>
    </div>
  );
}
