import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { useMembershipQuestionsStep } from "./MembershipQuestionsStepPage.hook";
import type { CustomFormControl, CustomFormListItem } from "../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../types/membership";

function MembershipQuestionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
          <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
          <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
          <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function MembershipQuestionsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="space-y-2">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function MembershipQuestionsEmpty() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="text-base font-semibold text-slate-900">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateTitle}</p>
      <p className="mt-2 leading-6">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateDescription}</p>
    </div>
  );
}

function MembershipCustomQuestionModal({
  controls,
  draft,
  isEditing,
  onClose,
  onSubmit,
  onSubmitAndContinue,
  onSelectControl,
  onUpdateDraft,
}: {
  controls: CustomFormControl[];
  draft: MembershipCustomQuestionDraft | null;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (draft: MembershipCustomQuestionDraft) => void;
  onSubmitAndContinue: (draft: MembershipCustomQuestionDraft) => void;
  onSelectControl: (controlId: number) => void;
  onUpdateDraft: (updater: (current: MembershipCustomQuestionDraft) => MembershipCustomQuestionDraft) => void;
}) {
  if (!draft) {
    return null;
  }

  const selectedControl = controls.find((control) => control.id === draft.controlId) ?? controls[0];

  const updateOption = (optionId: string, updater: (option: MembershipCustomQuestionDraft["options"][number]) => MembershipCustomQuestionDraft["options"][number]) => {
    onUpdateDraft((current) => ({
      ...current,
      options: current.options.map((option) => (option.id === optionId ? updater(option) : option)),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              {isEditing ? "Edit Custom Question" : "Add Custom Question"}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {isEditing ? "Update question" : "Question builder"}
            </h3>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Control type</span>
                <select
                  value={draft.controlId}
                  onChange={(event) => onSelectControl(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  {controls.map((control) => (
                    <option key={control.id} value={control.id}>
                      {control.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    Question label
                    <span className="text-rose-600" aria-label="Required" title="Required">
                      *
                    </span>
                  </span>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(event) =>
                      onUpdateDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder={selectedControl?.defaultLabel || "Question label"}
                  />
                </label>

                {selectedControl?.canHavePlaceHolder ? (
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Placeholder</span>
                    <input
                      type="text"
                      value={draft.placeHolder || ""}
                      onChange={(event) =>
                        onUpdateDraft((current) => ({
                          ...current,
                          placeHolder: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      placeholder="Shown inside the question"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Tooltip</span>
                  <input
                    type="text"
                    value={draft.tooltip || ""}
                    onChange={(event) =>
                      onUpdateDraft((current) => ({
                        ...current,
                        tooltip: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="Optional helper text"
                  />
                </label>

                {selectedControl?.canBeRequired ? (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">Required</span>
                      <p className="text-xs text-slate-500">Make this question mandatory.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.required}
                      onClick={() =>
                        onUpdateDraft((current) => ({
                          ...current,
                          required: !current.required,
                        }))
                      }
                      className={[
                        "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                        draft.required
                          ? "border-cyan-500 bg-cyan-500"
                          : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                          draft.required ? "translate-x-7" : "translate-x-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedControl?.canHaveMinLength ? (
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Min length</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.minLength || ""}
                        onChange={(event) =>
                          onUpdateDraft((current) => ({
                            ...current,
                            minLength: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        placeholder="0"
                      />
                    </label>
                  ) : null}

                  {selectedControl?.canHaveMaxLength ? (
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Max length</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.maxLength || ""}
                        onChange={(event) =>
                          onUpdateDraft((current) => ({
                            ...current,
                            maxLength: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        placeholder="0"
                      />
                    </label>
                  ) : null}
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">Default value</span>
                  <input
                    type="text"
                    value={draft.defaultValue || ""}
                    onChange={(event) =>
                      onUpdateDraft((current) => ({
                        ...current,
                        defaultValue: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="Optional default value"
                  />
                </label>

                {selectedControl?.hasOptions ? (
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Options</p>
                        <p className="text-xs text-slate-500">Define the choices for this question.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDraft((current) => ({
                            ...current,
                            options: [
                              ...current.options,
                              {
                                id: globalThis.crypto?.randomUUID?.() ?? `question-option-${Date.now()}`,
                                displayText: `Option ${current.options.length + 1}`,
                                value: `option-${current.options.length + 1}`,
                                isDefault: current.options.length === 0,
                              },
                            ],
                          }))
                        }
                        title="Add option"
                        aria-label="Add option"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 transition hover:bg-cyan-50"
                      >
                        <PlusIcon />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {draft.options.map((option, index) => (
                        <div key={option.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                            <input
                              type="text"
                              value={option.displayText}
                              onChange={(event) =>
                                updateOption(option.id, (currentOption) => ({
                                  ...currentOption,
                                  displayText: event.target.value,
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                              placeholder={`Option ${index + 1}`}
                            />
                            <input
                              type="text"
                              value={option.value}
                              onChange={(event) =>
                                updateOption(option.id, (currentOption) => ({
                                  ...currentOption,
                                  value: event.target.value,
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                              placeholder={`value-${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDraft((current) => ({
                                  ...current,
                                  defaultValue: option.value,
                                  options: current.options.map((item) => ({
                                    ...item,
                                    isDefault: item.id === option.id,
                                  })),
                                }))
                              }
                              className={[
                                "rounded-full px-3 py-2 text-xs font-semibold transition",
                                option.isDefault || draft.defaultValue === option.value
                                  ? "bg-amber-100 text-amber-700"
                                  : "border border-amber-200 bg-white text-amber-600 hover:bg-amber-50",
                              ].join(" ")}
                            >
                              {option.isDefault || draft.defaultValue === option.value ? "Default" : "Set default"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDraft((current) => {
                                  const nextOptions = current.options.filter((item) => item.id !== option.id);
                                  const nextDefault = nextOptions.find((item) => item.isDefault) ?? nextOptions[0];

                                  return {
                                    ...current,
                                    options: nextOptions.map((item, nextIndex) => ({
                                      ...item,
                                      isDefault: item.id === nextDefault?.id || (nextIndex === 0 && nextOptions.length === 1),
                                    })),
                                    defaultValue: nextDefault?.value || null,
                                  };
                                })
                              }
                              title="Remove option"
                              aria-label={`Remove option ${index + 1}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => onSubmit(draft)}
            className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            {isEditing ? "Save & Close" : "Add & Close"}
          </button>
          <button
            type="button"
            onClick={() => onSubmitAndContinue(draft)}
            className="rounded-full border border-cyan-200 bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
          >
            {isEditing ? "Save & Continue" : "Add & Continue"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DragGripIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
      <circle cx="5" cy="4" r="1" />
      <circle cx="11" cy="4" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="11" cy="12" r="1" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5l4 4L8 20l-5 1 1-5 12.5-12.5Z" />
    </svg>
  );
}

const constrainSelectedFormDragToParent: Modifier = ({
  activeNodeRect,
  containerNodeRect,
  transform,
}) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  const minX = containerNodeRect.left - activeNodeRect.left;
  const maxX = containerNodeRect.right - activeNodeRect.right;
  const minY = containerNodeRect.top - activeNodeRect.top;
  const maxY = containerNodeRect.bottom - activeNodeRect.bottom;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

function SortableSelectedCustomFormCard({
  form,
  onView,
  onDelete,
  showSortIndicator,
}: {
  form: CustomFormListItem;
  onView: (customFormUniqueId: string) => void;
  onDelete: (customFormUniqueId: string) => void;
  showSortIndicator: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: form.value,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center justify-between gap-3 rounded-[1.25rem] border border-cyan-200 bg-white px-4 py-3 shadow-sm",
        isDragging ? "opacity-70 shadow-md" : "",
      ].join(" ")}
    >
      <p className="min-w-0 truncate text-sm font-semibold text-cyan-900">{form.text}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onView(form.value)}
          title="Preview"
          aria-label={`Preview ${form.text}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 transition hover:bg-cyan-100"
        >
          <PreviewIcon />
        </button>
        <button
          type="button"
          onClick={() => onDelete(form.value)}
          title="Delete"
          aria-label={`Delete ${form.text}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50"
        >
          <TrashIcon />
        </button>
        {showSortIndicator ? (
          <button
            type="button"
            title="Drag to reorder"
            aria-label={`Drag ${form.text} to reorder`}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <DragGripIcon />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SortableCustomQuestionCard({
  question,
  onEdit,
  onDelete,
  showSortIndicator,
}: {
  question: MembershipCustomQuestionDraft;
  onEdit: (customQuestionId: string) => void;
  onDelete: (customQuestionId: string) => void;
  showSortIndicator: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const controlType = question.controlType.trim().toLowerCase();
  const supportsOptions = controlType === "select" || controlType === "radio";
  const chips = [
    question.required ? "Mandatory" : "Optional",
    supportsOptions && question.options.length > 0
      ? `${question.options.length} option${question.options.length === 1 ? "" : "s"}`
      : null,
    question.minLength || question.maxLength
      ? `${question.minLength || "0"}-${question.maxLength || "any"} chars`
      : null,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center justify-between gap-3 rounded-[1.25rem] border border-cyan-200 bg-white px-4 py-3 shadow-sm",
        isDragging ? "opacity-70 shadow-md" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{question.label}</p>
        <p className="truncate text-xs text-slate-500">{question.controlName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                chip === "Mandatory"
                  ? "bg-rose-100 text-rose-700"
                  : chip === "Optional"
                    ? "bg-slate-100 text-slate-600"
                    : chip === "Default set"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-cyan-100 text-cyan-700",
              ].join(" ")}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(question.id)}
          title="Edit"
          aria-label={`Edit ${question.label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={() => onDelete(question.id)}
          title="Delete"
          aria-label={`Delete ${question.label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50"
        >
          <TrashIcon />
        </button>
        {showSortIndicator ? (
          <button
            type="button"
            title="Drag to reorder"
            aria-label={`Drag ${question.label} to reorder`}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <DragGripIcon />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function getPreviewDefaultOptionValue(options: Array<{ value: string }>, defaultValue: string | null) {
  return defaultValue || options[0]?.value || "";
}

function formatPhonePreviewValue(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function PhonePreviewInput({
  value,
  placeholder,
}: {
  value: string;
  placeholder: string;
}) {
  const [phoneValue, setPhoneValue] = useState(() => formatPhonePreviewValue(value));

  return (
    <input
      type="tel"
      inputMode="tel"
      pattern="[0-9()\\-\\s]*"
      value={phoneValue}
      onChange={(event) => setPhoneValue(formatPhonePreviewValue(event.target.value))}
      placeholder={placeholder || "(555) 123-4567"}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
    />
  );
}

function CustomFormPreviewField({
  field,
}: {
  field: {
    controlLabel: string;
    placeHolder: string | null;
    tooltip: string | null;
    isMandatory: boolean;
    defaultValue: string | null;
    options: Array<{
      id: number;
      displayText: string;
      value: string;
    }>;
    controlType: string;
  };
}) {
  const controlType = field.controlType.toLowerCase();
  const defaultOptionValue = getPreviewDefaultOptionValue(field.options, field.defaultValue);
  const label = field.placeHolder || field.controlLabel;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">{field.controlLabel}</span>
        {field.isMandatory ? <span className="text-base font-bold leading-none text-rose-600">*</span> : null}
      </div>

      {controlType === "textarea" ? (
        <textarea
          rows={4}
          defaultValue={field.defaultValue || ""}
          placeholder={label}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      ) : controlType === "select" && field.options.length > 0 ? (
        <select
          defaultValue={defaultOptionValue}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        >
          <option value="">{label || "Select one"}</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      ) : controlType === "radio" && field.options.length > 0 ? (
        <div className="space-y-3">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="radio"
                name={`preview-${field.controlLabel}`}
                defaultChecked={defaultOptionValue === option.value}
                className="h-4 w-4 accent-cyan-600"
              />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      ) : controlType === "checkbox" ? (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" defaultChecked={field.defaultValue === "true"} className="h-4 w-4 accent-cyan-600" />
          <span className="text-sm font-medium text-slate-800">{field.controlLabel}</span>
        </label>
      ) : controlType === "file" ? (
        <input type="file" className="block w-full text-sm text-slate-500" />
      ) : controlType === "number" ? (
        <input
          type="number"
          inputMode="numeric"
          defaultValue={field.defaultValue || ""}
          placeholder={label}
          min={0}
          step="1"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      ) : controlType === "date" ? (
        <input
          type="date"
          defaultValue={field.defaultValue || ""}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      ) : controlType === "phone" ? (
        <PhonePreviewInput value={field.defaultValue || ""} placeholder={label} />
      ) : (
        <input
          type="text"
          defaultValue={field.defaultValue || ""}
          placeholder={label}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      )}

      {field.tooltip ? <p className="mt-2 text-xs text-slate-500">{field.tooltip}</p> : null}
    </div>
  );
}

function CustomFormPreviewModal({
  title,
  loading,
  error,
  fields,
  layoutColumn,
  onClose,
}: {
  title: string;
  loading: boolean;
  error: string;
  layoutColumn: number;
  fields: Array<{
    id: number;
    displayOrder: number;
    controlLabel: string;
    placeHolder: string | null;
    tooltip: string | null;
    isMandatory: boolean;
    defaultValue: string | null;
    options: Array<{
      id: number;
      displayText: string;
      value: string;
    }>;
    controlType: string;
    iconClass: string;
  }>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Preview</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                  <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : fields.length > 0 ? (
              <div
                className="grid gap-5"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, layoutColumn || 1))}, minmax(0, 1fr))`,
                }}
              >
                {fields.map((field) => (
                  <CustomFormPreviewField key={field.id} field={field} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-semibold text-slate-900">No fields to preview yet</p>
                <p className="mt-2 text-sm text-slate-500">This custom form does not contain any fields.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteCustomQuestionModal({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Remove custom question</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Are you sure?</h3>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            This will remove <span className="font-semibold text-slate-900">{label}</span> from the configured custom
            questions list.
          </p>
          <p className="text-sm leading-6 text-slate-600">This action cannot be undone.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-rose-200 bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteSelectedCustomFormModal({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Remove selected form</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Are you sure?</h3>
        </div>

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            This will remove <span className="font-semibold text-slate-900">{label}</span> from the selected custom
            forms list.
          </p>
          <p className="text-sm leading-6 text-slate-600">You can add it back again from the dropdown.</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-rose-200 bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

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
