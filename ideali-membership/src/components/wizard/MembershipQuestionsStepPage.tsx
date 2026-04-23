import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MEMBERSHIP_QUESTIONS_CONTENT } from "./MembershipQuestionsStepPage.fields";
import { useMembershipQuestionsStep } from "./MembershipQuestionsStepPage.hook";
import type { CustomFormListItem } from "../../types/customForms";

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
  showSortIndicator,
}: {
  form: CustomFormListItem;
  onView: (customFormUniqueId: string) => void;
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
          className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
        >
          Preview
        </button>
        {showSortIndicator ? (
          <button
            type="button"
            title="Drag to reorder"
            aria-label={`Drag ${form.text} to reorder`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700"
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
        {field.isMandatory ? <span className="text-sm font-bold leading-none text-rose-600">*</span> : null}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
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

export function MembershipQuestionsStepPage() {
  const {
    customForms,
    selectedCustomFormUniqueIds,
    isCustomFormDropdownOpen,
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
    setCustomFormDropdownOpen,
    openCustomFormPreview,
    closeCustomFormPreview,
  } = useMembershipQuestionsStep();

  const selectedCustomForms = selectedCustomFormUniqueIds
    .map((uniqueId) => customForms.find((form) => form.value === uniqueId))
    .filter((form): form is CustomFormListItem => Boolean(form));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onSelectedFormsDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    reorderSelectedCustomFormUniqueIds(String(active.id), String(over.id));
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
            <fieldset className="space-y-2" disabled={isSaving}>
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

            {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving questions...</p> : null}
          </>
        )}
      </div>

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
