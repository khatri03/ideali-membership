import { MEMBERSHIP_DESCRIPTION_CONTENT } from "./MembershipDescriptionStepPage.fields";
import { MembershipDescriptionError, MembershipDescriptionStepPageContent } from "./MembershipDescriptionStepPage.content";
import { useMembershipDescriptionStep } from "./MembershipDescriptionStepPage.hooks";

export function MembershipDescriptionStepPage() {
  const { editor, error, isLoading, isSaving, reload } = useMembershipDescriptionStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipDescriptionError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_DESCRIPTION_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_DESCRIPTION_CONTENT.description}</p>
      </div>

      <MembershipDescriptionStepPageContent editor={editor} isLoading={isLoading} isSaving={isSaving} />
    </section>
  );
}

