interface WizardStepPageProps {
  title: string;
  description: string;
}

export function WizardStepPage({ title, description }: WizardStepPageProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        Membership wizard step
      </div>

      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-medium text-slate-500">Step content placeholder</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This area will host the interactive controls for the {title.toLowerCase()} step.
        </p>
      </div>
    </section>
  );
}
