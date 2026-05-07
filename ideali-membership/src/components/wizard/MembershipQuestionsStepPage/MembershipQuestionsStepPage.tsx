import { useEffect, useRef } from "react";
import { closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { MembershipQuestionsStepPageContent } from "./MembershipQuestionsStepPage.content";
import { useMembershipQuestionsStep } from "./MembershipQuestionsStepPage.hooks";
import { MembershipQuestionsError } from "./MembershipQuestionsStepPage.components";
import {
  CustomFormPreviewModal,
  DeleteCustomQuestionModal,
  DeleteSelectedCustomFormModal,
  MembershipCustomQuestionModal,
} from "./MembershipQuestionsStepPage.modals";
import type { CustomFormListItem } from "../../../types/customForms";

export function MembershipQuestionsStepPage() {
  const {
    customFormControls,
    customForms,
    selectedCustomFormUniqueIds,
    customQuestions,
    isCustomFormDropdownOpen,
    isCustomQuestionModalOpen,
    customQuestionDraft,
    editingCustomQuestionId,
    previewCustomFormUniqueId,
    previewCustomFormName,
    previewCustomFormLoading,
    previewCustomFormError,
    previewCustomFormLayoutColumn,
    previewCustomFormFields,
    error,
    isLoading,
    isSaving,
    reload,
    toggleCustomForm,
    reorderSelectedCustomFormUniqueIds,
    addCustomQuestion,
    addCustomQuestionAndContinue,
    openCustomQuestionModal,
    requestCustomQuestionRemoval,
    confirmCustomQuestionRemoval,
    cancelCustomQuestionRemoval,
    pendingCustomQuestionRemoval,
    requestSelectedCustomFormRemoval,
    confirmSelectedCustomFormRemoval,
    cancelSelectedCustomFormRemoval,
    pendingSelectedCustomFormRemoval,
    reorderCustomQuestions,
    closeCustomQuestionModal,
    updateCustomQuestionDraft,
    selectCustomQuestionControl,
    setCustomFormDropdownOpen,
    openCustomFormPreview,
    closeCustomFormPreview,
  } = useMembershipQuestionsStep();

  const selectedCustomForms = selectedCustomFormUniqueIds
    .map((uniqueId) => customForms.find((form) => form.value === uniqueId))
    .filter((form): form is CustomFormListItem => Boolean(form));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const customFormDropdownRef = useRef<HTMLFieldSetElement | null>(null);
  const isEditingCustomQuestion = Boolean(editingCustomQuestionId);

  useEffect(() => {
    if (!isCustomFormDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (customFormDropdownRef.current && !customFormDropdownRef.current.contains(event.target as Node)) {
        setCustomFormDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isCustomFormDropdownOpen, setCustomFormDropdownOpen]);

  function onSelectedFormsDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    reorderSelectedCustomFormUniqueIds(String(active.id), String(over.id));
  }

  function onCustomQuestionsDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    reorderCustomQuestions(String(active.id), String(over.id));
  }

  if (error) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <MembershipQuestionsError message={error} onRetry={reload} />
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{MEMBERSHIP_QUESTIONS_CONTENT.title}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{MEMBERSHIP_QUESTIONS_CONTENT.description}</p>
        <p className="text-sm text-slate-500">{MEMBERSHIP_QUESTIONS_CONTENT.helper}</p>
      </div>

      <MembershipQuestionsStepPageContent
        customFormControls={customFormControls}
        customForms={customForms}
        customFormDropdownRef={customFormDropdownRef}
        customQuestions={customQuestions}
        isCustomFormDropdownOpen={isCustomFormDropdownOpen}
        isLoading={isLoading}
        isSaving={isSaving}
        onCustomQuestionsDragEnd={onCustomQuestionsDragEnd}
        onOpenCustomQuestionModal={() => openCustomQuestionModal()}
        onOpenCustomFormPreview={(customFormUniqueId) => void openCustomFormPreview(customFormUniqueId)}
        onRequestSelectedCustomFormRemoval={(customFormUniqueId) => requestSelectedCustomFormRemoval(customFormUniqueId)}
        onRequestCustomQuestionRemoval={(customQuestionId) => requestCustomQuestionRemoval(customQuestionId)}
        onSelectedFormsDragEnd={onSelectedFormsDragEnd}
        onSetCustomFormDropdownOpen={setCustomFormDropdownOpen}
        onToggleCustomForm={toggleCustomForm}
        selectedCustomFormUniqueIds={selectedCustomFormUniqueIds}
        selectedCustomForms={selectedCustomForms}
        sensors={sensors}
        validationError=""
      />

      {isCustomQuestionModalOpen ? (
        <MembershipCustomQuestionModal
          controls={customFormControls}
          draft={customQuestionDraft}
          isEditing={isEditingCustomQuestion}
          onClose={closeCustomQuestionModal}
          onSubmit={addCustomQuestion}
          onSubmitAndContinue={addCustomQuestionAndContinue}
          onSelectControl={selectCustomQuestionControl}
          onUpdateDraft={updateCustomQuestionDraft}
        />
      ) : null}

      {pendingCustomQuestionRemoval ? (
        <DeleteCustomQuestionModal
          label={pendingCustomQuestionRemoval.label}
          onCancel={cancelCustomQuestionRemoval}
          onConfirm={confirmCustomQuestionRemoval}
        />
      ) : null}

      {pendingSelectedCustomFormRemoval ? (
        <DeleteSelectedCustomFormModal
          label={pendingSelectedCustomFormRemoval.label}
          onCancel={cancelSelectedCustomFormRemoval}
          onConfirm={confirmSelectedCustomFormRemoval}
        />
      ) : null}

      {previewCustomFormUniqueId ? (
        <CustomFormPreviewModal
          title={previewCustomFormName || "Custom form preview"}
          loading={previewCustomFormLoading}
          error={previewCustomFormError}
          layoutColumn={previewCustomFormLayoutColumn}
          fields={previewCustomFormFields}
          onClose={closeCustomFormPreview}
        />
      ) : null}
    </section>
  );
}
