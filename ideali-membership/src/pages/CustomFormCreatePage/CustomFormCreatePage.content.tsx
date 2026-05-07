import { Link } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import type {
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  Modifier,
} from "@dnd-kit/core";
import { APP_ROUTES } from "../../routes";
import type { CustomFormControl, CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";
import {
  FieldPreview,
  PreviewFormCanvas,
  getLayoutPresetLabel,
  normalizeLayoutColumn,
} from "./index";
import { CustomFormCreatePageBuilder } from "./CustomFormCreatePage.builder";
import type { ActiveDragItem, ActiveDragRect } from "./index";

export function CustomFormCreatePageContent({
  isEditMode,
  loadError,
  saveError,
  isSavingForm,
  isLoadingForm,
  handleSaveForm,
  draft,
  setDraft,
  nameError,
  headerTextError,
  layoutColumnError,
  controls,
  controlsError,
  fields,
  isCanvasOver,
  isCanvasTargeted,
  isCompactViewport,
  isLoadingControls,
  onDragCancel,
  onDragEnd,
  onDragMove,
  onDragOver,
  onDragStart,
  modifiers,
  openFieldLayoutMenu,
  openPreview,
  appendFieldToCanvas,
  canvasFieldError,
  clearFieldLayoutPreset,
  controlUsageCounts,
  fieldIdSet,
  filteredControls,
  isClearConfirmOpen,
  setIsClearConfirmOpen,
  setCanvasRef,
  setControlSearch,
  controlSearch,
  setSelectedFieldId,
  selectedFieldId,
  activeDragItem,
  activeDragRect,
  sensors,
  previewColumnCount,
  setIsCanvasTargeted,
  onRemoveField,
  closePreview,
  isPreviewOpen,
  setFieldLayoutPreset,
  fieldLayoutMenu,
  fieldLayoutMenuStyle,
  closeFieldLayoutMenu,
  fieldToRemove,
  optionToRemove,
  cancelRemoveField,
  confirmRemoveField,
  cancelRemoveOption,
  confirmRemoveOption,
  clearAllCanvasFields,
}: {
  isEditMode: boolean;
  loadError: string | null;
  saveError: string | null;
  isSavingForm: boolean;
  isLoadingForm: boolean;
  handleSaveForm: () => Promise<void>;
  draft: CustomFormDraft;
  setDraft: Dispatch<SetStateAction<CustomFormDraft>>;
  nameError: string;
  headerTextError: string;
  layoutColumnError: string;
  controls: CustomFormControl[];
  controlsError: string | null;
  fields: CustomFormFieldDraft[];
  isCanvasOver: boolean;
  isCanvasTargeted: boolean;
  isCompactViewport: boolean;
  isLoadingControls: boolean;
  onDragCancel: (event: DragCancelEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragStart: (event: DragStartEvent) => void;
  modifiers: Modifier[];
  openFieldLayoutMenu: (fieldId: string, position: { x: number; y: number }) => void;
  openPreview: () => void;
  appendFieldToCanvas: (control: CustomFormControl) => void;
  canvasFieldError: string;
  clearFieldLayoutPreset: (fieldId: string) => void;
  controlUsageCounts: Map<number, number>;
  fieldIdSet: Set<string>;
  filteredControls: CustomFormControl[];
  isClearConfirmOpen: boolean;
  setIsClearConfirmOpen: (value: boolean) => void;
  setCanvasRef: (node: HTMLDivElement | null) => void;
  setControlSearch: (value: string) => void;
  controlSearch: string;
  setSelectedFieldId: (value: string | null) => void;
  selectedFieldId: string | null;
  activeDragItem: ActiveDragItem;
  activeDragRect: ActiveDragRect;
  sensors: unknown;
  previewColumnCount: number;
  setIsCanvasTargeted: (value: boolean) => void;
  onRemoveField: (fieldId: string) => void;
  closePreview: () => void;
  isPreviewOpen: boolean;
  setFieldLayoutPreset: (fieldId: string, layoutColumn: number) => void;
  fieldLayoutMenu: { fieldId: string; x: number; y: number } | null;
  fieldLayoutMenuStyle: { left: number; top: number } | null;
  closeFieldLayoutMenu: () => void;
  fieldToRemove: CustomFormFieldDraft | null;
  optionToRemove: { id: string; displayText: string } | null;
  cancelRemoveField: () => void;
  confirmRemoveField: () => void;
  cancelRemoveOption: () => void;
  confirmRemoveOption: () => void;
  clearAllCanvasFields: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Custom Form Designer
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {isEditMode ? "Edit custom form" : "Design a custom form"}
            </h1>
            <p className="mt-3 text-slate-600">
              {isEditMode
                ? "Update the existing form, keep field identity stable, and publish the revised structure."
                : "Drag field types from the palette, arrange them on the canvas, and tune the constraints in the inspector."}
            </p>
          </div>

          <Link
            to={APP_ROUTES.customForms}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to forms list
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {loadError ? (
              <span className="text-rose-600">{loadError}</span>
            ) : saveError ? (
              <span className="text-rose-600">{saveError}</span>
            ) : (
              "Ready to save."
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveForm}
            disabled={isSavingForm || isLoadingForm || Boolean(loadError)}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSavingForm ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FieldPreview
            title="Name"
            value={draft.name}
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Membership enrollment form"
            required
            error={nameError}
          />
          <FieldPreview
            title="Header Text"
            value={draft.headerText}
            onChange={(value) => setDraft((current) => ({ ...current, headerText: value }))}
            placeholder="Tell us a little about you"
            required
            error={headerTextError}
          />
          <FieldPreview
            title="Description"
            value={draft.description}
            onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
            placeholder="Optional supporting copy"
          />
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>Layout Columns</span>
              <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
                *
              </span>
            </span>
            <select
              value={draft.layoutColumn}
              onChange={(event) => setDraft((current) => ({ ...current, layoutColumn: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} column{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {layoutColumnError ? <p className="mt-2 text-xs font-medium text-rose-600">{layoutColumnError}</p> : null}
          </label>
        </div>
      </div>

      <CustomFormCreatePageBuilder
        controlSearch={controlSearch}
        controls={controls}
        controlsError={controlsError}
        fields={fields}
        isCanvasOver={isCanvasOver}
        isCanvasTargeted={isCanvasTargeted}
        isCompactViewport={isCompactViewport}
        isLoadingControls={isLoadingControls}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        modifiers={modifiers}
        openFieldLayoutMenu={openFieldLayoutMenu}
        openPreview={openPreview}
        appendFieldToCanvas={appendFieldToCanvas}
        canvasFieldError={canvasFieldError}
        clearFieldLayoutPreset={clearFieldLayoutPreset}
        controlUsageCounts={controlUsageCounts}
        fieldIdSet={fieldIdSet}
        filteredControls={filteredControls}
        isClearConfirmOpen={isClearConfirmOpen}
        setIsClearConfirmOpen={setIsClearConfirmOpen}
        setCanvasRef={setCanvasRef}
        setControlSearch={setControlSearch}
        setSelectedFieldId={setSelectedFieldId}
        selectedFieldId={selectedFieldId}
        activeDragItem={activeDragItem}
        activeDragRect={activeDragRect}
        sensors={sensors}
        previewColumnCount={previewColumnCount}
        setIsCanvasTargeted={setIsCanvasTargeted}
        onRemoveField={onRemoveField}
        setSelectedFieldIdForFieldDrop={setSelectedFieldId}
      />

      {fieldToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Remove “{fieldToRemove.label}”?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove the field from the canvas. Any current
                  configuration for this field will be lost.
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
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Preview
                </p>
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
                {draft.description ? (
                  <p className="mb-6 text-sm leading-6 text-slate-600">{draft.description}</p>
                ) : null}

                {fields.length > 0 ? (
                  <PreviewFormCanvas
                    fields={fields}
                    spanCount={previewColumnCount}
                    isCompactViewport={isCompactViewport}
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">No fields to preview yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Add controls to the canvas to see the rendered form here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {fieldLayoutMenu && fieldLayoutMenuStyle ? (
        <div className="fixed inset-0 z-[60]" onMouseDown={closeFieldLayoutMenu} onContextMenu={(event) => event.preventDefault()}>
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
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Clear all canvas fields?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will remove every field from the canvas. Your inspector settings will be
                  cleared for the current selection, and this action cannot be undone.
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
    </section>
  );
}
