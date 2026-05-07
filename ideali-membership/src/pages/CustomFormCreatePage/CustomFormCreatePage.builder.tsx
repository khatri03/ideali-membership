import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CustomFormControl, CustomFormFieldDraft } from "../../types/customForms";
import { ControlPaletteItem, DragGhost, SortableFieldCard, getPreviewColumnSpan, normalizeLayoutColumn, type ActiveDragItem, type ActiveDragRect } from "./index";

export function CustomFormCreatePageBuilder({
  controlSearch,
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
  setSelectedFieldId,
  selectedFieldId,
  activeDragItem,
  activeDragRect,
  sensors,
  previewColumnCount,
  setIsCanvasTargeted,
  onRemoveField,
  setSelectedFieldIdForFieldDrop,
}: {
  controlSearch: string;
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
  setSelectedFieldId: (value: string | null) => void;
  selectedFieldId: string | null;
  activeDragItem: ActiveDragItem;
  activeDragRect: ActiveDragRect;
  sensors: unknown;
  previewColumnCount: number;
  setIsCanvasTargeted: (value: boolean) => void;
  onRemoveField: (fieldId: string) => void;
  setSelectedFieldIdForFieldDrop: (fieldId: string | null) => void;
}) {
  return (
    <DndContext
      sensors={sensors as any}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Field palette</h2>
              </div>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Search field types
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="text-slate-400" aria-hidden="true">
                    /
                  </span>
                  <input
                    type="text"
                    value={controlSearch}
                    onChange={(event) => setControlSearch(event.target.value)}
                    placeholder="Search by name or type"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {controlSearch ? (
                    <button
                      type="button"
                      onClick={() => setControlSearch("")}
                      className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </label>
            </div>

            <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1 sm:max-h-[28rem] lg:max-h-[32rem]">
              {isLoadingControls ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                </div>
              ) : controlsError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {controlsError}
                </div>
              ) : filteredControls.length > 0 ? (
                filteredControls.map((control) => (
                  <ControlPaletteItem
                    key={control.id}
                    control={control}
                    count={controlUsageCounts.get(control.id) ?? 0}
                    onDoubleClick={appendFieldToCanvas}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  {controls.length > 0
                    ? "No controls match your search."
                    : "No controls were returned by the backend."}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50/80 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-900">Builder note</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start with the core controls first. We can progressively add advanced settings,
              validation rules, and persistence after the structure is stable.
            </p>
          </div>
        </aside>

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
      </div>
    </DndContext>
  );
}
