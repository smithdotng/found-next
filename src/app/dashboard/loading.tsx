export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-slate-200" />
        ))}
      </div>
      <div className="mt-8 h-72 rounded-2xl bg-white ring-1 ring-slate-200" />
    </div>
  );
}
