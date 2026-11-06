// Shown the moment a search starts, while every home's calendar is checked.
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6" aria-busy="true">
      <div className="h-[4.25rem] w-full max-w-3xl animate-pulse rounded-full bg-rule/60" />
      <p role="status" className="mt-8 flex items-center gap-3 text-mist">
        <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-river border-t-transparent" />
        Checking which homes are free for your dates…
      </p>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] rounded-2xl bg-rule/60" />
            <div className="mt-4 h-4 w-2/3 rounded bg-rule/60" />
            <div className="mt-2 h-3 w-1/3 rounded bg-rule/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
