import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type DetailPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "slate" | "cyan" | "emerald" | "amber" | "rose";
  compact?: boolean;
};

type EmptyStatePanelProps = {
  title: string;
  description: string;
};

type StatusTone = NonNullable<StatCardProps["tone"]>;

const STAT_TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-900",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-900",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
  amber: "border-amber-100 bg-amber-50 text-amber-900",
  rose: "border-rose-100 bg-rose-50 text-rose-900",
};

export function DetailPanel({ title, description, children, action, className }: DetailPanelProps) {
  return (
    <section className={cn("rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, detail, tone = "slate", compact = false }: StatCardProps) {
  return (
    <article className={cn("rounded-3xl border shadow-sm", compact ? "p-3.5" : "p-5", STAT_TONE_CLASSES[tone])}>
      <p className={cn("font-semibold uppercase tracking-[0.18em] text-slate-500", compact ? "text-[10px]" : "text-xs")}>
        {label}
      </p>
      <div className={cn("font-semibold tracking-tight text-slate-900", compact ? "mt-2 text-lg" : "mt-3 text-2xl")}>
        {value}
      </div>
      {detail ? <p className={cn("leading-6 text-slate-600", compact ? "mt-1.5 text-xs" : "mt-2 text-sm")}>{detail}</p> : null}
    </article>
  );
}

export function EmptyStatePanel({ title, description }: EmptyStatePanelProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "slate" | "cyan" | "emerald" | "amber" | "rose" }) {
  const toneClasses: Record<StatusTone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", toneClasses[tone])}>
      {label}
    </span>
  );
}
