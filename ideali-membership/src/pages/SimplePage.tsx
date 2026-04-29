interface SimplePageProps {
  title: string;
  description: string;
  badgeLabel?: string;
}

export function SimplePage({ title, description, badgeLabel }: SimplePageProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {badgeLabel ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-slate-600">{description}</p>
    </section>
  );
}
