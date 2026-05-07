import type { CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";
import { PreviewFormCanvas, getLayoutPresetLabel, normalizeLayoutColumn } from "./index";

export function CustomFormCreatePageDialogs({
  draft,
  fields,
  isCompactViewport,
  previewColumnCount,
  isPreviewOpen,
  closePreview,
  fieldLayoutMenu,
  fieldLayoutMenuStyle,
  closeFieldLayoutMenu,
  setFieldLayoutPreset,
  isClearConfirmOpen,
  setIsClearConfirmOpen,
  clearAllCanvasFields,
  fieldToRemove,
  cancelRemoveField,
  confirmRemoveField,
  optionToRemove,
  cancelRemoveOption,
  confirmRemoveOption,
}: {
  draft: CustomFormDraft;
  fields: CustomFormFieldDraft[];
  isCompactViewport: boolean;
  previewColumnCount: number;
  isPreviewOpen: boolean;
  closePreview: () => void;
  fieldLayoutMenu: { fieldId: string; x: number; y: number } | null;
  fieldLayoutMenuStyle: { left: number; top: number } | null;
  closeFieldLayoutMenu: () => void;
  setFieldLayoutPreset: (fieldId: string, layoutColumn: number) => void;
  isClearConfirmOpen: boolean;
  setIsClearConfirmOpen: (value: boolean) => void;
  clearAllCanvasFields: () => void;
  fieldToRemove: CustomFormFieldDraft | null;
  cancelRemoveField: () => void;
  confirmRemoveField: () => void;
  optionToRemove: { id: string; displayText: string } | null;
  cancelRemoveOption: () => void;
  confirmRemoveOption: () => void;
}) {
  return (
    <>
      {fieldToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">!</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Remove “{fieldToRemove.label}”?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove the field from the canvas. Any current configuration for this field will
                  be lost.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelRemoveField}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveField}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove field
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {optionToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">!</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Remove option “{optionToRemove.displayText}”?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove the option from the selected field.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelRemoveOption}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveOption}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove option
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Preview</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {draft.headerText || "Untitled header"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
              <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {draft.description ? <p className="mb-6 text-sm leading-6 text-slate-600">{draft.description}</p> : null}

                {fields.length > 0 ? (
                  <PreviewFormCanvas fields={fields} spanCount={previewColumnCount} isCompactViewport={isCompactViewport} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">No fields to preview yet</p>
                    <p className="mt-2 text-sm text-slate-500">Add controls to the canvas to see the rendered form here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {fieldLayoutMenu && fieldLayoutMenuStyle ? (
        <div
          className="fixed inset-0 z-[60]"
          onMouseDown={closeFieldLayoutMenu}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            className="absolute w-48 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20"
            style={fieldLayoutMenuStyle}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Layout
            </p>
            {[1, 2, 3, 4].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFieldLayoutPreset(fieldLayoutMenu.fieldId, value)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800"
              >
                <span>{getLayoutPresetLabel(value)}</span>
                {fieldLayoutMenu &&
                normalizeLayoutColumn(fields.find((field) => field.id === fieldLayoutMenu.fieldId)?.layoutColumn ?? previewColumnCount) === value ? (
                  <span className="text-cyan-700">✓</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isClearConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">!</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Clear all canvas fields?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will remove every field from the canvas. Your inspector settings will be cleared for the current
                  selection, and this action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearAllCanvasFields}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Clear canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
