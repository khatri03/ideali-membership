import { MEMBERSHIP_COLOR_CONTENT } from "./MembershipColorStepPage.fields";
import { MembershipColorError, MembershipColorStepPageContent } from "./MembershipColorStepPage.content";
import { useMembershipColorStep } from "./MembershipColorStepPage.hooks";

export function MembershipColorStepPage() {
  const {
    selectedPresetColor,
    customColor,
    hasInteractedWithCustomColor,
    error,
    isLoading,
    isSaving,
    reload,
    selectPresetColor,
    openCustomColorPicker,
    updateCustomColor,
    customColorInputRef,
  } = useMembershipColorStep();

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipColorError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_COLOR_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_COLOR_CONTENT.description}</p>
      </div>

      <MembershipColorStepPageContent
        customColor={customColor}
        customColorInputRef={customColorInputRef}
        hasInteractedWithCustomColor={hasInteractedWithCustomColor}
        isLoading={isLoading}
        isSaving={isSaving}
        onChangeCustomColor={updateCustomColor}
        onOpenCustomColorPicker={openCustomColorPicker}
        onSelectPresetColor={selectPresetColor}
        selectedPresetColor={selectedPresetColor}
      />
    </section>
  );
}

