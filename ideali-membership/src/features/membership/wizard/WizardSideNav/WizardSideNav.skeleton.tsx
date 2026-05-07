export function WizardSideNavSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 11 }).map((_, index) => (
        <div
          key={index}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-transparent shadow-sm">
              {index + 1}
            </span>
            <span className="h-4 w-[min(12rem,65%)] animate-pulse rounded-full bg-slate-200" />
          </div>
          <span className="h-6 w-14 animate-pulse rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
