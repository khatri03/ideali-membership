import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import type { CustomFormControl, CustomFormListItem } from "../../../../types/customForms";
import type { MembershipCustomQuestionDraft } from "../../../../types/membership";
import {
  DragGripIcon,
  PencilIcon,
  PreviewIcon,
  TrashIcon,
} from "./MembershipQuestionsStepPage.utils";

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
        <button type="button" onClick={() => onView(form.value)} title="Preview" aria-label={`Preview ${form.text}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 transition hover:bg-cyan-100">
          <PreviewIcon />
        </button>
        <button type="button" onClick={() => onDelete(form.value)} title="Delete" aria-label={`Delete ${form.text}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50">
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
        <button type="button" onClick={() => onEdit(question.id)} title="Edit" aria-label={`Edit ${question.label}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50">
          <PencilIcon />
        </button>
        <button type="button" onClick={() => onDelete(question.id)} title="Delete" aria-label={`Delete ${question.label}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50">
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
