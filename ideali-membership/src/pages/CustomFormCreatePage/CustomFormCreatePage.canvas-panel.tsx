import { DragOverlay, type DragCancelEvent, type DragEndEvent, type DragMoveEvent, type DragOverEvent, type DragStartEvent, type Modifier } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CustomFormFieldDraft } from "../../types/customForms";
import { DragGhost, SortableFieldCard, getPreviewColumnSpan, normalizeLayoutColumn, type ActiveDragItem, type ActiveDragRect } from "./index";

export function CustomFormCreatePageCanvasPanel({
  fields,
  isCanvasOver,
  isCanvasTargeted,
  isCompactViewport,
  onDragStart,
  onDragMove,
  onDragOver,
  onDragEnd,
  onDragCancel,
  modifiers,
  setCanvasRef,
  openPreview,
  canvasFieldError,
  previewColumnCount,
  selectedFieldId,
  setSelectedFieldIdForFieldDrop,
  openFieldLayoutMenu,
  clearFieldLayoutPreset,
  onRemoveField,
  activeDragItem,
  activeDragRect,
  setIsClearConfirmOpen,
  fieldLayoutMenu,
  fieldLayoutMenuStyle,
  closeFieldLayoutMenu,
}: {
  fields: CustomFormFieldDraft[];
  isCanvasOver: boolean;
  isCanvasTargeted: boolean;
  isCompactViewport: boolean;
  onDragStart: (event: DragStartEvent) => void;
  onDragMove: (event: DragMoveEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: (event: DragCancelEvent) => void;
  modifiers: Modifier[];
  setCanvasRef: (node: HTMLDivElement | null) => void;
  openPreview: () => void;
  canvasFieldError: string;
  previewColumnCount: number;
  selectedFieldId: string | null;
  setSelectedFieldIdForFieldDrop: (fieldId: string | null) => void;
  openFieldLayoutMenu: (fieldId: string, position: { x: number; y: number }) => void;
  clearFieldLayoutPreset: (fieldId: string) => void;
  onRemoveField: (fieldId: string) => void;
  activeDragItem: ActiveDragItem;
  activeDragRect: ActiveDragRect;
  setIsClearConfirmOpen: (value: boolean) => void;
  fieldLayoutMenu: { fieldId: string; x: number; y: number } | null;
  fieldLayoutMenuStyle: { left: number; top: number } | null;
  closeFieldLayoutMenu: () => void;
}) {
  return (
    <>
      <DragOverlay dropAnimation={null}>
        <DragGhost item={activeDragItem} rect={activeDragRect} />
      </DragOverlay>

      <main
        ref={setCanvasRef}
        className={[
          "flex min-h-0 flex-col rounded-[2rem] border bg-white/90 p-4 shadow-sm transition overflow-hidden lg:p-5",
          isCanvasOver || isCanvasTargeted ? "border-cyan-400 ring-4 ring-cyan-100" : "border-slate-200",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Form canvas</h2>
            <p className="mt-1 text-sm text-slate-500">Drop controls here and drag to reorder them.</p>
            {canvasFieldError ? <p className="mt-2 text-sm font-medium text-rose-600">{canvasFieldError}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {fields.length} field{fields.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={openPreview}
              disabled={fields.length === 0}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              disabled={fields.length === 0}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-5 max-h-[40rem] overflow-y-auto pr-0 sm:max-h-[44rem] sm:pr-1 lg:max-h-[48rem]">
          <div
            className={[
              "min-h-[24rem] rounded-[2rem] border border-dashed bg-slate-50 p-3 transition sm:min-h-[28rem] sm:p-4 lg:min-h-[32rem]",
              isCanvasOver || isCanvasTargeted
                ? "border-cyan-400 bg-cyan-50/60 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                : "border-slate-200",
            ].join(" ")}
          >
            {isCanvasOver || isCanvasTargeted ? (
              <div className="mb-4 rounded-2xl border border-cyan-200 bg-white/80 px-4 py-3 text-sm font-medium text-cyan-800">
                Release to drop into the form canvas.
              </div>
            ) : null}
            <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
              {fields.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      span={getPreviewColumnSpan(field, previewColumnCount)}
                      layoutColumn={normalizeLayoutColumn(field.layoutColumn ?? previewColumnCount)}
                      isCompactViewport={isCompactViewport}
                      selected={field.id === selectedFieldId}
                      onSelect={setSelectedFieldIdForFieldDrop}
                      onOpenLayoutMenu={openFieldLayoutMenu}
                      onClearLayout={clearFieldLayoutPreset}
                      onRemove={onRemoveField}
                      showDragHandle={fields.length > 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[20rem] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white px-4 text-center sm:min-h-[24rem] sm:px-6 lg:min-h-[28rem]">
                  <div className="max-w-md">
                    <p className="text-lg font-semibold text-slate-900">Drop your first field here</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Choose a control from the left palette to start building the form layout.
                    </p>
                  </div>
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </main>
    </>
  );
}
