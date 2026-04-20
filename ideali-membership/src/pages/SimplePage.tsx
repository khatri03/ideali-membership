interface SimplePageProps {
  title: string;
  description: string;
}

export function SimplePage({ title, description }: SimplePageProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 text-slate-600">{description}</p>
    </section>
  );
}

