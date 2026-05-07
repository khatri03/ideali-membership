import {
  DndContext,
  closestCenter,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
} from "@dnd-kit/core";
import type { CustomFormControl, CustomFormFieldDraft } from "../../types/customForms";
import type { ActiveDragItem, ActiveDragRect } from "./index";
import { CustomFormCreatePageCanvasPanel } from "./CustomFormCreatePage.canvas-panel";
import { CustomFormCreatePagePalettePanel } from "./CustomFormCreatePage.palette-panel";

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
  fieldLayoutMenu,
  fieldLayoutMenuStyle,
  closeFieldLayoutMenu,
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
  fieldLayoutMenu: { fieldId: string; x: number; y: number } | null;
  fieldLayoutMenuStyle: { left: number; top: number } | null;
  closeFieldLayoutMenu: () => void;
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
        <CustomFormCreatePagePalettePanel
          controlSearch={controlSearch}
          controls={controls}
          controlsError={controlsError}
          filteredControls={filteredControls}
          controlUsageCounts={controlUsageCounts}
          isLoadingControls={isLoadingControls}
          appendFieldToCanvas={appendFieldToCanvas}
          setControlSearch={setControlSearch}
        />

        <CustomFormCreatePageCanvasPanel
          fields={fields}
          isCanvasOver={isCanvasOver}
          isCanvasTargeted={isCanvasTargeted}
          isCompactViewport={isCompactViewport}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          modifiers={modifiers}
          setCanvasRef={setCanvasRef}
          openPreview={openPreview}
          canvasFieldError={canvasFieldError}
          previewColumnCount={previewColumnCount}
          selectedFieldId={selectedFieldId}
          setSelectedFieldIdForFieldDrop={setSelectedFieldIdForFieldDrop}
          openFieldLayoutMenu={openFieldLayoutMenu}
          clearFieldLayoutPreset={clearFieldLayoutPreset}
          onRemoveField={onRemoveField}
          activeDragItem={activeDragItem}
          activeDragRect={activeDragRect}
          setIsClearConfirmOpen={setIsClearConfirmOpen}
          fieldLayoutMenu={fieldLayoutMenu}
          fieldLayoutMenuStyle={fieldLayoutMenuStyle}
          closeFieldLayoutMenu={closeFieldLayoutMenu}
        />
      </div>
    </DndContext>
  );
}
