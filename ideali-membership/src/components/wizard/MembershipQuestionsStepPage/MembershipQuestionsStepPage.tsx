import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { useMembershipQuestionsStep } from "./MembershipQuestionsStepPage.hooks";
import { PlusIcon, constrainSelectedFormDragToParent } from "./MembershipQuestionsStepPage.utils";
import {
  CustomFormPreviewModal,
  DeleteCustomQuestionModal,
  DeleteSelectedCustomFormModal,
  MembershipCustomQuestionModal,
  MembershipQuestionsEmpty,
  MembershipQuestionsError,
  MembershipQuestionsSkeleton,
  SortableCustomQuestionCard,
  SortableSelectedCustomFormCard,
} from "./MembershipQuestionsStepPage.components";
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

    const oldIndex = selectedCustomFormUniqueIds.indexOf(String(active.id));
    const newIndex = selectedCustomFormUniqueIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const nextOrder = arrayMove(selectedCustomFormUniqueIds, oldIndex, newIndex);
    console.log(nextOrder);

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
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_QUESTIONS_CONTENT.description}
        </p>
        <p className="text-sm text-slate-500">{MEMBERSHIP_QUESTIONS_CONTENT.helper}</p>
      </div>

      <div className="mt-8 max-w-3xl space-y-4">
        {isLoading ? (
          <MembershipQuestionsSkeleton />
        ) : (
          <>
            <fieldset ref={customFormDropdownRef} className="space-y-2" disabled={isSaving}>
              <legend className="text-sm font-semibold text-slate-800">Custom Forms</legend>
              <button
                type="button"
                onClick={() => setCustomFormDropdownOpen(!isCustomFormDropdownOpen)}
                data-wizard-focus="true"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>
                  {selectedCustomFormUniqueIds.length > 0
                    ? `${selectedCustomFormUniqueIds.length} custom form${selectedCustomFormUniqueIds.length === 1 ? "" : "s"} selected`
                    : "Select custom forms"}
                </span>
                <span className="text-lg leading-none text-slate-400">{isCustomFormDropdownOpen ? "^" : "v"}</span>
              </button>

              {isCustomFormDropdownOpen ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
                  {customForms.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {customForms.map((form) => {
                        const isSelected = selectedCustomFormUniqueIds.includes(form.value);

                        return (
                          <label
                            key={form.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                              isSelected
                                ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCustomForm(form.value)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="min-w-0 flex-1 text-sm font-semibold">{form.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <MembershipQuestionsEmpty />
                  )}
                </div>
              ) : null}

              {selectedCustomForms.length > 0 ? (
                <div className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cyan-900">Selected custom forms</p>
                      <p className="mt-1 text-xs text-cyan-700">Drag the cards to change their order.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                      {selectedCustomForms.length}
                    </span>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[constrainSelectedFormDragToParent]}
                    onDragEnd={onSelectedFormsDragEnd}
                  >
                    <SortableContext items={selectedCustomFormUniqueIds} strategy={verticalListSortingStrategy}>
                      <div className="mt-4 space-y-3">
                        {selectedCustomForms.map((form) => (
                          <SortableSelectedCustomFormCard
                            key={form.value}
                            form={form}
                            onDelete={(customFormUniqueId) => requestSelectedCustomFormRemoval(customFormUniqueId)}
                            showSortIndicator={selectedCustomForms.length > 1}
                            onView={(customFormUniqueId) => void openCustomFormPreview(customFormUniqueId)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : null}
            </fieldset>

            {customForms.length === 0 ? <MembershipQuestionsEmpty /> : null}

            <div className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cyan-900">Custom Questions</p>
                  <p className="mt-1 text-xs text-cyan-700">Add standalone questions directly on the membership type.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCustomQuestionModal()}
                    disabled={isSaving || customFormControls.length === 0}
                    title="Add custom question"
                    aria-label="Add custom question"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusIcon />
                  </button>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700">
                    {customQuestions.length}
                  </span>
                </div>
              </div>

              {customQuestions.length > 0 ? (
                <div className="mt-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[constrainSelectedFormDragToParent]}
                    onDragEnd={onCustomQuestionsDragEnd}
                  >
                    <SortableContext
                      items={customQuestions.map((question) => question.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {customQuestions.map((question) => (
                          <SortableCustomQuestionCard
                            key={question.id}
                            question={question}
                            onEdit={openCustomQuestionModal}
                            showSortIndicator={customQuestions.length > 1}
                            onDelete={requestCustomQuestionRemoval}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <div className="mt-4">
                  <MembershipQuestionsEmpty />
                </div>
              )}
            </div>

            {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving questions...</p> : null}
          </>
        )}
      </div>

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



