import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

interface WizardStepPageProps {
  title: string;
  description: string;
}

export function WizardStepPage({ title, description }: WizardStepPageProps) {
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const [searchParams] = useSearchParams();
  const stepNo = searchParams.get("stepNo");

  useEffect(() => {
    if (membershipTypeUniqueId) {
      console.log("Membership type unique id:", membershipTypeUniqueId);
    }

    if (stepNo) {
      console.log("Wizard step number:", stepNo);
    }
  }, [membershipTypeUniqueId, stepNo]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
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
