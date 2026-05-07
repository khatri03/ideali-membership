import { useEffect, useRef, useState } from "react";
import { type Modifier } from "@dnd-kit/core";
import { useNavigate, useParams } from "react-router-dom";
import type { CustomFormControl } from "../types/customForms";
import { useCustomFormCreatePageEditor } from "./CustomFormCreatePage/CustomFormCreatePage.editor.hooks";
import { useCustomFormCreatePageActions } from "./CustomFormCreatePage/CustomFormCreatePage.actions.hooks";
import { useCustomFormCreatePageDrag } from "./CustomFormCreatePage/CustomFormCreatePage.drag.hooks";
import { useCustomFormCreatePageData } from "./CustomFormCreatePage/CustomFormCreatePage.hooks";
import { CustomFormCreatePageContent } from "./CustomFormCreatePage/CustomFormCreatePage.content";
import { useCompactViewport, type ActiveDragItem, type ActiveDragRect } from "./CustomFormCreatePage/index";

const constrainFieldDragToCanvas: Modifier = ({ active, activeNodeRect, containerNodeRect, transform }) => {
  const activeData = active?.data.current as
    | { source?: "palette"; control?: CustomFormControl }
    | { source?: "field" }
    | undefined;

  if (activeData?.source !== "field" || !activeNodeRect || !containerNodeRect) {
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

export function CustomFormCreatePage() {
  const { customFormUniqueId } = useParams<{ customFormUniqueId?: string }>();
  const isEditMode = Boolean(customFormUniqueId);
  const isCompactViewport = useCompactViewport();
  const [controlSearch, setControlSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const {
    controls,
    controlsError,
    draft,
    fields,
    isLoadingControls,
    isLoadingForm,
    loadError,
    setDraft,
    setFields,
  } = useCustomFormCreatePageData(customFormUniqueId);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);
  const [isCanvasTargeted, setIsCanvasTargeted] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeDragRect, setActiveDragRect] = useState<ActiveDragRect>(null);
  const [fieldLayoutMenu, setFieldLayoutMenu] = useState<{ fieldId: string; x: number; y: number } | null>(null);
  const [fieldToRemoveId, setFieldToRemoveId] = useState<string | null>(null);
  const [optionToRemoveId, setOptionToRemoveId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCreateValidation, setShowCreateValidation] = useState(false);
  const canvasDropRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedFieldId(null);
  }, [customFormUniqueId]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    if (activeDragId) {
      root.style.cursor = "grabbing";
      body.style.cursor = "grabbing";
      body.style.userSelect = "none";
    } else {
      root.style.cursor = "";
      body.style.cursor = "";
      body.style.userSelect = "";
    }

    return () => {
      root.style.cursor = "";
      body.style.cursor = "";
      body.style.userSelect = "";
    };
  }, [activeDragId]);

  useEffect(() => {
    if (!fieldLayoutMenu) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFieldLayoutMenu(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fieldLayoutMenu]);

  useEffect(() => {
    if (!fieldLayoutMenu) {
      return;
    }

    if (!fields.some((field) => field.id === fieldLayoutMenu.fieldId)) {
      setFieldLayoutMenu(null);
    }
  }, [fieldLayoutMenu, fields]);

  const previewColumnCount = Math.max(1, Math.min(4, Number(draft.layoutColumn) || 1));
  const {
    fieldToRemove,
    optionToRemove,
    canCreateForm,
    nameError,
    headerTextError,
    layoutColumnError,
    canvasFieldError,
    fieldLayoutMenuStyle,
    controlUsageCounts,
    fieldIdSet,
    filteredControls,
    setFieldLayoutPreset,
    clearFieldLayoutPreset,
    removeField,
    confirmRemoveField,
    cancelRemoveField,
    addFieldFromControl,
    appendFieldToCanvas,
    clearAllCanvasFields,
    confirmRemoveOption,
    cancelRemoveOption,
  } = useCustomFormCreatePageEditor({
    controls,
    draft,
    fields,
    selectedFieldId,
    selectedOptionId,
    fieldLayoutMenu,
    fieldToRemoveId,
    optionToRemoveId,
    controlSearch,
    showCreateValidation,
    previewColumnCount,
    setDraft,
    setFields,
    setFieldLayoutMenu,
    setFieldToRemoveId,
    setOptionToRemoveId,
    setSelectedFieldId,
    setSelectedOptionId,
    setIsClearConfirmOpen,
    setIsPreviewOpen,
  });

  const { closeFieldLayoutMenu, closePreview, handleSaveForm, openFieldLayoutMenu, openPreview } =
    useCustomFormCreatePageActions({
      customFormUniqueId,
      draft,
      fields,
      isEditMode,
      isLoadingForm,
      isSavingForm,
      canCreateForm,
      navigate,
      previewColumnCount,
      setFieldLayoutMenu,
      setIsPreviewOpen,
      setIsSavingForm,
      setSaveError,
      setShowCreateValidation,
    });

  const { sensors, setCanvasRef, isCanvasOver, onDragStart, onDragMove, onDragOver, onDragCancel, onDragEnd } =
    useCustomFormCreatePageDrag({
      canvasDropRef,
      fields,
      onAddFieldFromControl: addFieldFromControl,
      setActiveDragId,
      setActiveDragItem,
      setActiveDragRect,
      setIsCanvasTargeted,
      setFields,
    });

  return (
    <CustomFormCreatePageContent
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
      modifiers={[constrainFieldDragToCanvas]}
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
      controlSearch={controlSearch}
      setSelectedFieldId={setSelectedFieldId}
      selectedFieldId={selectedFieldId}
      activeDragItem={activeDragItem}
      activeDragRect={activeDragRect}
      sensors={sensors}
      previewColumnCount={previewColumnCount}
      setIsCanvasTargeted={setIsCanvasTargeted}
      onRemoveField={removeField}
      closePreview={closePreview}
      isPreviewOpen={isPreviewOpen}
      setFieldLayoutPreset={setFieldLayoutPreset}
      fieldLayoutMenu={fieldLayoutMenu}
      fieldLayoutMenuStyle={fieldLayoutMenuStyle}
      closeFieldLayoutMenu={closeFieldLayoutMenu}
      fieldToRemove={fieldToRemove}
      optionToRemove={optionToRemove}
      cancelRemoveField={cancelRemoveField}
      confirmRemoveField={confirmRemoveField}
      cancelRemoveOption={cancelRemoveOption}
      confirmRemoveOption={confirmRemoveOption}
      clearAllCanvasFields={clearAllCanvasFields}
    />
  );
}
