import type { RefObject } from "react";
import { DndContext, closestCenter, type DragEndEvent, type Modifier } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CustomFormControl, CustomFormListItem } from "../../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../../types/membership";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { PlusIcon, constrainSelectedFormDragToParent } from "./MembershipQuestionsStepPage.utils";
import {
  MembershipQuestionsEmpty,
  MembershipQuestionsSkeleton,
  SortableCustomQuestionCard,
  SortableSelectedCustomFormCard,
} from "./MembershipQuestionsStepPage.components";

export function MembershipQuestionsStepPageContent({
  customFormControls,
  customForms,
  customFormDropdownRef,
  customQuestions,
  isCustomFormDropdownOpen,
  isSaving,
  isLoading,
  onCustomQuestionsDragEnd,
  onOpenCustomQuestionModal,
  onOpenCustomFormPreview,
  onRequestSelectedCustomFormRemoval,
  onRequestCustomQuestionRemoval,
  onSelectedFormsDragEnd,
  onSetCustomFormDropdownOpen,
  onToggleCustomForm,
  selectedCustomFormUniqueIds,
  selectedCustomForms,
  sensors,
  validationError,
}: {
  customFormControls: CustomFormControl[];
  customForms: CustomFormListItem[];
  customFormDropdownRef: RefObject<HTMLFieldSetElement>;
  customQuestions: MembershipCustomQuestionDraft[];
  isCustomFormDropdownOpen: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onCustomQuestionsDragEnd: (event: DragEndEvent) => void;
  onOpenCustomQuestionModal: () => void;
  onOpenCustomFormPreview: (customFormUniqueId: string) => void;
  onRequestSelectedCustomFormRemoval: (customFormUniqueId: string) => void;
  onRequestCustomQuestionRemoval: (customQuestionId: string) => void;
  onSelectedFormsDragEnd: (event: DragEndEvent) => void;
  onSetCustomFormDropdownOpen: (value: boolean) => void;
  onToggleCustomForm: (customFormUniqueId: string) => void;
  selectedCustomFormUniqueIds: string[];
  selectedCustomForms: CustomFormListItem[];
  sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
  validationError: string;
}) {
  return (
    <div className="mt-8 max-w-3xl space-y-4">
      {isLoading ? (
        <MembershipQuestionsSkeleton />
      ) : (
        <>
          <fieldset ref={customFormDropdownRef} className="space-y-2" disabled={isSaving}>
            <legend className="text-sm font-semibold text-slate-800">Custom Forms</legend>
            <button
              type="button"
              onClick={() => onSetCustomFormDropdownOpen(!isCustomFormDropdownOpen)}
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
                            onChange={() => onToggleCustomForm(form.value)}
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
                  modifiers={[constrainSelectedFormDragToParent as Modifier]}
                  onDragEnd={onSelectedFormsDragEnd}
                >
                  <SortableContext items={selectedCustomFormUniqueIds} strategy={verticalListSortingStrategy}>
                    <div className="mt-4 space-y-3">
                      {selectedCustomForms.map((form) => (
                        <SortableSelectedCustomFormCard
                          key={form.value}
                          form={form}
                          onDelete={(customFormUniqueId) => onRequestSelectedCustomFormRemoval(customFormUniqueId)}
                          showSortIndicator={selectedCustomForms.length > 1}
                          onView={(customFormUniqueId) => void onOpenCustomFormPreview(customFormUniqueId)}
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
                  onClick={() => onOpenCustomQuestionModal()}
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
                  modifiers={[constrainSelectedFormDragToParent as Modifier]}
                  onDragEnd={onCustomQuestionsDragEnd}
                >
                  <SortableContext items={customQuestions.map((question) => question.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {customQuestions.map((question) => (
                        <SortableCustomQuestionCard
                          key={question.id}
                          question={question}
                  onEdit={() => onOpenCustomQuestionModal()}
                          onDelete={(customQuestionId) => onRequestCustomQuestionRemoval(customQuestionId)}
                          showSortIndicator={customQuestions.length > 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-cyan-200 bg-white px-4 py-5 text-sm text-cyan-800">
                No custom questions have been added yet.
              </div>
            )}
          </div>

          {validationError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {validationError}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
