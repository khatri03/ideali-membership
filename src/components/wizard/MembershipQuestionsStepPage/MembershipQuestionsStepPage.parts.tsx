import { useEffect, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { getPreviewColumnSpan } from "../../../lib/customFormDesignerUtils";
import type { CustomFormControl, CustomFormListItem } from "../../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../../types/membership";
import { MultiSelectInput } from "../../../components/inputs/MultiSelectInput/MultiSelectInput";
import { PhoneInput } from "../../../components/inputs/PhoneInput/PhoneInput";
import {
  getPreviewDefaultOptionValue,
  parseDelimitedValues,
  toSentenceCase,
  toggleAcceptedFileType,
} from "./MembershipQuestionsStepPage.helpers";

export function DragGripIcon() {
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

export function PreviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function TrashIcon() {
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

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5l4 4L8 20l-5 1 1-5 12.5-12.5Z" />
    </svg>
  );
}

export function MembershipQuestionsSkeleton() {
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

export function MembershipQuestionsError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function MembershipQuestionsEmpty() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      <p className="text-base font-semibold text-slate-900">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateTitle}</p>
      <p className="mt-2 leading-6">{MEMBERSHIP_QUESTIONS_CONTENT.emptyStateDescription}</p>
    </div>
  );
}

function PhonePreviewInput({
  value,
  placeholder,
}: {
  value: string;
  placeholder: string;
}) {
  const [phoneValue, setPhoneValue] = useState(() => value);

  return (
    <PhoneInput
      value={phoneValue}
      onChange={setPhoneValue}
      placeholder={placeholder}
      inputMode="tel"
      pattern="[0-9()\\-\\s]*"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
    />
  );
}

function CustomFormPreviewField({
  field,
  formLayoutColumn,
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
    layoutColumn: number | null;
  };
  formLayoutColumn: number;
}) {
  const controlType = field.controlType.toLowerCase();
  const defaultOptionValue = getPreviewDefaultOptionValue(field.options, field.defaultValue);
  const [previewMultiSelectValue, setPreviewMultiSelectValue] = useState(() => parseDelimitedValues(field.defaultValue));
  const label = field.placeHolder || field.controlLabel;
  const layoutSpan = getPreviewColumnSpan(
    { layoutColumn: field.layoutColumn },
    formLayoutColumn,
  );

  useEffect(() => {
    if (controlType === "multiselect") {
      setPreviewMultiSelectValue(parseDelimitedValues(field.defaultValue));
    }
  }, [controlType, field.defaultValue]);

  return (
    <div
      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
      style={{ gridColumn: `span ${layoutSpan} / span ${layoutSpan}` }}
    >
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
      ) : controlType === "multiselect" ? (
        <MultiSelectInput
          value={previewMultiSelectValue}
          onChange={setPreviewMultiSelectValue}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={field.placeHolder || "Select one or more"}
        />
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

export function CustomFormPreviewModal({
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
    layoutColumn: number | null;
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
                {fields.map((field) => (
                  <CustomFormPreviewField key={field.id} field={field} formLayoutColumn={layoutColumn} />
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

export function DeleteCustomQuestionModal({
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

export function DeleteSelectedCustomFormModal({
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

export function SortableSelectedCustomFormCard({
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

export function SortableCustomQuestionCard({
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

export function MembershipCustomQuestionModal({
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
  const acceptedFileTypes = selectedControl?.acceptedFileTypes ?? [];

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
                          requiredMessage:
                            !current.required && !current.requiredMessage.trim()
                              ? `${toSentenceCase(current.label)} is required.`
                              : current.requiredMessage,
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

                {selectedControl?.canBeRequired ? (
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      Required message
                    </span>
                    <input
                      type="text"
                      value={draft.requiredMessage}
                      onChange={(event) =>
                        onUpdateDraft((current) => ({
                          ...current,
                          requiredMessage: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      placeholder={`${toSentenceCase(draft.label)} is required.`}
                    />
                  </label>
                ) : null}

                {selectedControl?.controlType?.toLowerCase() === "file" ? (
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Accepted file types</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Leave all unchecked to allow any file.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {acceptedFileTypes.map((item) => {
                        const isChecked = draft.acceptedFileTypes.includes(item.value);

                        return (
                          <label
                            key={item.value}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(event) =>
                                onUpdateDraft((current) => ({
                                  ...current,
                                  acceptedFileTypes: toggleAcceptedFileType(
                                    current.acceptedFileTypes,
                                    item.value,
                                    event.target.checked,
                                  ),
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="font-medium">{item.text}</span>
                          </label>
                        );
                      })}
                    </div>
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
