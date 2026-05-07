import type { Dispatch, SetStateAction } from "react";
import type {
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  Modifier,
} from "@dnd-kit/core";
import type { CustomFormControl, CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";
import type { ActiveDragItem, ActiveDragRect } from "./index";
import { CustomFormCreatePageBuilder } from "./CustomFormCreatePage.builder";
import { CustomFormCreatePageDialogs } from "./CustomFormCreatePage.dialogs";
import { CustomFormCreatePageHeader } from "./CustomFormCreatePage.header";

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
      <CustomFormCreatePageHeader
        isEditMode={isEditMode}
        loadError={loadError}
        saveError={saveError}
        isSavingForm={isSavingForm}
        isLoadingForm={isLoadingForm}
        handleSaveForm={handleSaveForm}
        draft={draft}
        setDraft={setDraft}
        nameError={nameError}
        headerTextError={headerTextError}
        layoutColumnError={layoutColumnError}
      />

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
        fieldLayoutMenu={fieldLayoutMenu}
        fieldLayoutMenuStyle={fieldLayoutMenuStyle}
        closeFieldLayoutMenu={closeFieldLayoutMenu}
      />

      <CustomFormCreatePageDialogs
        draft={draft}
        fields={fields}
        isCompactViewport={isCompactViewport}
        previewColumnCount={previewColumnCount}
        isPreviewOpen={isPreviewOpen}
        closePreview={closePreview}
        fieldLayoutMenu={fieldLayoutMenu}
        fieldLayoutMenuStyle={fieldLayoutMenuStyle}
        closeFieldLayoutMenu={closeFieldLayoutMenu}
        setFieldLayoutPreset={setFieldLayoutPreset}
        isClearConfirmOpen={isClearConfirmOpen}
        setIsClearConfirmOpen={setIsClearConfirmOpen}
        clearAllCanvasFields={clearAllCanvasFields}
        fieldToRemove={fieldToRemove}
        cancelRemoveField={cancelRemoveField}
        confirmRemoveField={confirmRemoveField}
        optionToRemove={optionToRemove}
        cancelRemoveOption={cancelRemoveOption}
        confirmRemoveOption={confirmRemoveOption}
      />
    </section>
  );
}
