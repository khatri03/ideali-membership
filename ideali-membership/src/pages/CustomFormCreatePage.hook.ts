import { useEffect, useMemo, useRef, useState } from "react";
import {
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCustomForm,
  fetchCustomFormControls,
  fetchCustomFormPreview,
  updateCustomForm,
} from "../lib/customForms";
import type {
  CustomFormControl,
  CustomFormDraft,
  CustomFormFieldDraft,
} from "../types/customForms";
import { APP_ROUTES } from "../routes";
import {
  CANVAS_ID,
  buildEmptyDraft,
  clearDefaultOption,
  createFieldDraft,
  createOptionId,
  getPreviewColumnSpan,
  getRowBoundsForIndex,
  mapPreviewFieldToDraft,
  normalizeFields,
  normalizeLayoutColumn,
  useCompactViewport,
  type ActiveDragItem,
  type ActiveDragRect,
} from "./CustomFormCreatePage.helpers";
import { measureDragSourceRect } from "./CustomFormCreatePage.parts";

export function useCustomFormCreatePage() {
  const { customFormUniqueId } = useParams<{ customFormUniqueId?: string }>();
  const isEditMode = Boolean(customFormUniqueId);
  const isCompactViewport = useCompactViewport();
  const [controls, setControls] = useState<CustomFormControl[]>([]);
  const [isLoadingControls, setIsLoadingControls] = useState(true);
  const [controlsError, setControlsError] = useState<string | null>(null);
  const [controlSearch, setControlSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomFormDraft>(buildEmptyDraft());
  const [fields, setFields] = useState<CustomFormFieldDraft[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);
  const [isCanvasTargeted, setIsCanvasTargeted] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeDragRect, setActiveDragRect] = useState<ActiveDragRect>(null);
  const [fieldLayoutMenu, setFieldLayoutMenu] = useState<{
    fieldId: string;
    x: number;
    y: number;
  } | null>(null);
  const [fieldToRemoveId, setFieldToRemoveId] = useState<string | null>(null);
  const [optionToRemoveId, setOptionToRemoveId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateValidation, setShowCreateValidation] = useState(false);
  const lastDropTargetIdRef = useRef<string | null>(null);
  const dragFieldOrderSnapshotRef = useRef<CustomFormFieldDraft[] | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null);
  const canvasDropRef = useRef<HTMLDivElement | null>(null);
  const inspectorLabelRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadControls() {
      setIsLoadingControls(true);
      setControlsError(null);

      try {
        const response = await fetchCustomFormControls();
        if (!cancelled) {
          setControls(response);
        }
      } catch (error) {
        if (!cancelled) {
          setControlsError(error instanceof Error ? error.message : "Unable to load controls.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingControls(false);
        }
      }
    }

    void loadControls();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!customFormUniqueId) {
      setIsLoadingForm(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function loadCustomForm(formUniqueId: string) {
      setIsLoadingForm(true);
      setLoadError(null);

      try {
        const preview = await fetchCustomFormPreview(formUniqueId);
        if (cancelled) {
          return;
        }

        setDraft({
          name: preview.name,
          headerText: preview.headerText,
          description: preview.description ?? "",
          layoutColumn: preview.layoutColumn ?? 2,
        });
        setFields(preview.fields.map((field) => mapPreviewFieldToDraft(field)));
        setSelectedFieldId(null);
      } catch (formError) {
        if (!cancelled) {
          setLoadError(formError instanceof Error ? formError.message : "Unable to load custom form.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingForm(false);
        }
      }
    }

    void loadCustomForm(customFormUniqueId);

    return () => {
      cancelled = true;
    };
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

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );

  useEffect(() => {
    if (!selectedFieldId) {
      return;
    }

    const focusHandle = window.requestAnimationFrame(() => {
      inspectorLabelRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusHandle);
  }, [selectedFieldId]);

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

  const createFormIssues = useMemo(() => {
    const issues: string[] = [];

    if (!draft.name.trim()) {
      issues.push("Name");
    }

    if (!draft.headerText.trim()) {
      issues.push("Header Text");
    }

    return issues;
  }, [draft.headerText, draft.name]);

  const canCreateForm = createFormIssues.length === 0;
  const nameError = showCreateValidation && !draft.name.trim() ? "Name is required." : "";
  const headerTextError =
    showCreateValidation && !draft.headerText.trim() ? "Header Text is required." : "";
  const layoutColumnError =
    showCreateValidation && (!Number.isInteger(draft.layoutColumn) || draft.layoutColumn < 1)
      ? "Layout Columns is required."
      : "";
  const canvasFieldError = showCreateValidation && fields.length === 0
    ? "Add at least one field to the canvas."
    : "";

  const selectedControl = useMemo(
    () => controls.find((control) => control.id === selectedField?.controlId) ?? null,
    [controls, selectedField?.controlId],
  );

  const fieldToRemove = useMemo(
    () => fields.find((field) => field.id === fieldToRemoveId) ?? null,
    [fieldToRemoveId, fields],
  );

  const optionToRemove = useMemo(() => {
    if (!selectedField || !optionToRemoveId) {
      return null;
    }

    return selectedField.options.find((option) => option.id === optionToRemoveId) ?? null;
  }, [optionToRemoveId, selectedField]);

  const selectedOption = useMemo(() => {
    if (!selectedField || !selectedOptionId) {
      return (
        selectedField?.options.find((option) => option.isDefault) ??
        selectedField?.options.find((option) => option.value === selectedField.defaultValue) ??
        selectedField?.options[0] ??
        null
      );
    }

    return (
      selectedField.options.find((option) => option.id === selectedOptionId) ??
      selectedField.options.find((option) => option.isDefault) ??
      selectedField.options[0] ??
      null
    );
  }, [selectedField, selectedOptionId]);

  const previewColumnCount = Math.max(1, Math.min(4, Number(draft.layoutColumn) || 2));

  const fieldLayoutMenuStyle = useMemo(() => {
    if (!fieldLayoutMenu || typeof window === "undefined") {
      return null;
    }

    const estimatedWidth = 172;
    const estimatedHeight = 228;

    return {
      left: Math.max(16, Math.min(fieldLayoutMenu.x, window.innerWidth - estimatedWidth - 16)),
      top: Math.max(16, Math.min(fieldLayoutMenu.y, window.innerHeight - estimatedHeight - 16)),
    };
  }, [fieldLayoutMenu]);

  const controlUsageCounts = useMemo(() => {
    const counts = new Map<number, number>();

    for (const field of fields) {
      counts.set(field.controlId, (counts.get(field.controlId) ?? 0) + 1);
    }

    return counts;
  }, [fields]);

  const filteredControls = useMemo(() => {
    const query = controlSearch.trim().toLowerCase();

    if (!query) {
      return controls;
    }

    return controls.filter((control) => {
      const haystack = [
        control.name,
        control.defaultLabel,
        control.controlType,
        control.iconClass,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [controlSearch, controls]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const canvasRestrictModifier = useMemo<Modifier>(
    () =>
      ({ active, transform, draggingNodeRect }) => {
        const activeData = active?.data.current as { source?: string } | undefined;
        if (activeData?.source !== "field") return transform;
        const canvas = canvasDropRef.current;
        if (!canvas || !draggingNodeRect) return transform;
        const rect = canvas.getBoundingClientRect();
        const minX = rect.left - draggingNodeRect.left;
        const maxX = rect.right - draggingNodeRect.right;
        const minY = rect.top - draggingNodeRect.top;
        const maxY = rect.bottom - draggingNodeRect.bottom;
        return {
          ...transform,
          x: Math.min(Math.max(transform.x, minX), maxX),
          y: Math.min(Math.max(transform.y, minY), maxY),
        };
      },
    [],
  );

  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: CANVAS_ID,
  });

  function isPointInsideCanvas(point: { x: number; y: number } | null) {
    if (!point || !canvasDropRef.current) {
      return false;
    }

    const rect = canvasDropRef.current.getBoundingClientRect();
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }

  function updateSelectedField(updater: (field: CustomFormFieldDraft) => CustomFormFieldDraft) {
    if (!selectedFieldId) {
      return;
    }

    setFields((current) =>
      current.map((field) => (field.id === selectedFieldId ? updater(field) : field)),
    );
  }

  function setFieldLayoutPreset(fieldId: string, layoutColumn: number) {
    setFields((current) =>
      normalizeFields(
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                layoutColumn,
              }
            : field,
        ),
      ),
    );
    setSelectedFieldId(fieldId);
    setFieldLayoutMenu(null);
  }

  function clearFieldLayoutPreset(fieldId: string) {
    setFields((current) =>
      normalizeFields(
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                layoutColumn: null,
              }
            : field,
        ),
      ),
    );
    setSelectedFieldId(fieldId);
    setFieldLayoutMenu((current) => (current?.fieldId === fieldId ? null : current));
  }

  function deleteField(fieldId: string) {
    setFields((current) => {
      const next = current.filter((field) => field.id !== fieldId);
      return normalizeFields(next);
    });
    setFieldLayoutMenu((current) => (current?.fieldId === fieldId ? null : current));

    setSelectedFieldId((current) => {
      if (current !== fieldId) {
        return current;
      }

      return fields.find((field) => field.id !== fieldId)?.id ?? null;
    });
  }

  function removeField(fieldId: string) {
    setFieldToRemoveId(fieldId);
    setFieldLayoutMenu(null);
  }

  function confirmRemoveField() {
    if (!fieldToRemoveId) {
      return;
    }

    deleteField(fieldToRemoveId);
    setFieldToRemoveId(null);
    setOptionToRemoveId(null);
    setSelectedOptionId(null);
  }

  function cancelRemoveField() {
    setFieldToRemoveId(null);
  }

  function addFieldFromControl(control: CustomFormControl, index?: number) {
    const nextField = createFieldDraft(control, fields.length + 1);
    setFields((current) => {
      const next = [...current];
      const insertAt = typeof index === "number" && index >= 0 ? index : next.length;
      next.splice(insertAt, 0, nextField);
      return normalizeFields(next);
    });
    setSelectedFieldId(nextField.id);
  }

  function appendFieldToCanvas(control: CustomFormControl) {
    addFieldFromControl(control, fields.length);
  }

  function clearAllCanvasFields() {
    setFields([]);
    setSelectedFieldId(null);
    setFieldLayoutMenu(null);
    setIsClearConfirmOpen(false);
    setFieldToRemoveId(null);
    setOptionToRemoveId(null);
    setIsPreviewOpen(false);
  }

  function closePreview() {
    setIsPreviewOpen(false);
  }

  function openFieldLayoutMenu(fieldId: string, position: { x: number; y: number }) {
    setFieldLayoutMenu({
      fieldId,
      x: position.x,
      y: position.y,
    });
  }

  function closeFieldLayoutMenu() {
    setFieldLayoutMenu(null);
  }

  function openPreview() {
    if (fields.length === 0) {
      return;
    }

    setIsPreviewOpen(true);
  }

  async function handleSaveForm() {
    if (isSavingForm || isLoadingForm) {
      return;
    }

    if (!canCreateForm) {
      setShowCreateValidation(true);
      setSaveError(null);
      return;
    }

    setIsSavingForm(true);
    setSaveError(null);
    setShowCreateValidation(false);

    try {
      const formId = isEditMode && customFormUniqueId
        ? await updateCustomForm(customFormUniqueId, draft, fields)
        : await createCustomForm(draft, fields);
      if (formId > 0) {
        navigate(APP_ROUTES.customForms, { replace: true });
        return;
      }

      setSaveError(isEditMode ? "We couldn't update the form. Please try again." : "We couldn't create the form. Please try again.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : isEditMode ? "Failed to update the form." : "Failed to create the form.");
    } finally {
      setIsSavingForm(false);
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
    setActiveDragRect(null);
    lastDropTargetIdRef.current = null;
    setIsCanvasTargeted(false);
    const activatorEvent = event.activatorEvent as PointerEvent | MouseEvent | undefined;
    if (typeof activatorEvent?.clientX === "number" && typeof activatorEvent?.clientY === "number") {
      dragStartPointRef.current = { x: activatorEvent.clientX, y: activatorEvent.clientY };
      lastPointerPointRef.current = { x: activatorEvent.clientX, y: activatorEvent.clientY };
    } else {
      dragStartPointRef.current = null;
      lastPointerPointRef.current = null;
    }
    const activeData = event.active.data.current as
      | { source?: "palette"; control?: CustomFormControl }
      | { source?: "field" }
      | undefined;

    if (activeData?.source === "palette" && activeData.control) {
      setActiveDragItem({ kind: "palette", control: activeData.control });
      dragFieldOrderSnapshotRef.current = null;
      return;
    }

    if (activeData?.source === "field") {
      dragFieldOrderSnapshotRef.current = fields;
      const measuredRect = measureDragSourceRect(String(event.active.id));
      setActiveDragRect(
        measuredRect ?? {
          width: event.active.rect.current.initial?.width ?? 0,
          height: event.active.rect.current.initial?.height ?? 0,
        },
      );
      const field = fields.find((current) => current.id === event.active.id);
      setActiveDragItem(field ? { kind: "field", field } : null);
      return;
    }

    setActiveDragItem(null);
    dragFieldOrderSnapshotRef.current = null;
  }

  function onDragMove(event: DragMoveEvent) {
    if (!dragStartPointRef.current) {
      return;
    }

    const nextPoint = {
      x: dragStartPointRef.current.x + event.delta.x,
      y: dragStartPointRef.current.y + event.delta.y,
    };

    lastPointerPointRef.current = nextPoint;
    setIsCanvasTargeted(isPointInsideCanvas(nextPoint));
  }

  function onDragOver(event: DragOverEvent) {
    const targetId = event.over?.id ? String(event.over.id) : null;
    if (targetId && targetId === CANVAS_ID) {
      lastDropTargetIdRef.current = targetId;
    }

    const activeData = event.active.data.current as
      | { source?: "palette"; control?: CustomFormControl }
      | { source?: "field" }
      | undefined;

    if (activeData?.source !== "field" || !event.over || event.over.id === event.active.id) {
      return;
    }

    const overId = String(event.over.id);
    if (overId === CANVAS_ID) {
      return;
    }

    const oldIndex = fields.findIndex((field) => field.id === event.active.id);
    const newIndex = fields.findIndex((field) => field.id === overId);

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const activeField = fields[oldIndex];
    const activeSpan = activeField ? getPreviewColumnSpan(activeField, draft.layoutColumn) : 0;
    let adjustedNewIndex = newIndex;

    if (activeSpan === 12) {
      const rowBounds = getRowBoundsForIndex(fields, newIndex, draft.layoutColumn);
      adjustedNewIndex = oldIndex < newIndex ? rowBounds.end : rowBounds.start;
    }

    setFields((current) => normalizeFields(arrayMove(current, oldIndex, adjustedNewIndex)));
  }

  function onDragCancel(_event: DragCancelEvent) {
    if (dragFieldOrderSnapshotRef.current) {
      setFields(normalizeFields(dragFieldOrderSnapshotRef.current));
    }
    dragFieldOrderSnapshotRef.current = null;
    setActiveDragId(null);
    setActiveDragItem(null);
    setActiveDragRect(null);
    setIsCanvasTargeted(false);
    lastDropTargetIdRef.current = null;
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const pointerInsideCanvas = isPointInsideCanvas(lastPointerPointRef.current);

    setActiveDragId(null);
    setActiveDragItem(null);
    setActiveDragRect(null);
    setIsCanvasTargeted(false);
    lastDropTargetIdRef.current = null;
    dragStartPointRef.current = null;
    lastPointerPointRef.current = null;

    const activeData = active.data.current as
      | { source?: "palette"; control?: CustomFormControl }
      | { source?: "field" }
      | undefined;

    if (activeData?.source === "palette" && activeData.control) {
      if (pointerInsideCanvas) {
        addFieldFromControl(activeData.control, fields.length);
      }
      return;
    }

    if (activeData?.source === "field" && !over) {
      if (dragFieldOrderSnapshotRef.current) {
        setFields(normalizeFields(dragFieldOrderSnapshotRef.current));
      }
      dragFieldOrderSnapshotRef.current = null;
      return;
    }

    dragFieldOrderSnapshotRef.current = null;
  }

  function addOption() {
    updateSelectedField((field) => ({
      ...field,
      options: [
        ...field.options,
        {
          id: createOptionId(),
          displayText: `Option ${field.options.length + 1}`,
          value: `option-${field.options.length + 1}`,
          isDefault: field.options.length === 0,
        },
      ],
    }));
  }

  function updateOption(optionId: string, key: "displayText" | "value", value: string) {
    updateSelectedField((field) => ({
      ...field,
      options: field.options.map((option) =>
        option.id === optionId ? { ...option, [key]: value } : option,
      ),
    }));
  }

  function setDefaultOption(optionId: string) {
    updateSelectedField((field) => {
      if (field.controlType.toLowerCase() === "multiselect") {
        const nextOptions = field.options.map((option) =>
          option.id === optionId ? { ...option, isDefault: !option.isDefault } : option,
        );
        const nextDefaultValues = nextOptions.filter((option) => option.isDefault).map((option) => option.value);

        return {
          ...field,
          defaultValue: nextDefaultValues.join(", "),
          options: nextOptions,
        };
      }

      const nextOptions = clearDefaultOption(field.options, optionId);
      const nextDefault = nextOptions.find((option) => option.id === optionId);

      return {
        ...field,
        defaultValue: nextDefault?.value || "",
        options: nextOptions,
      };
    });
    setSelectedOptionId(optionId);
  }

  function removeOption(optionId: string) {
    setOptionToRemoveId(optionId);
  }

  function confirmRemoveOption() {
    if (!optionToRemoveId) {
      return;
    }

    updateSelectedField((field) => ({
      ...field,
      options: (() => {
        const next = field.options.filter((option) => option.id !== optionToRemoveId);

        if (field.controlType.toLowerCase() !== "multiselect" && next.length > 0 && !next.some((option) => option.isDefault)) {
          const firstOption = next[0];
          if (firstOption) {
            next[0] = { ...firstOption, isDefault: true };
          }
        }

        return next;
      })(),
      defaultValue: (() => {
        const next = field.options.filter((option) => option.id !== optionToRemoveId);

        if (next.length === 0) {
          return "";
        }

        if (field.controlType.toLowerCase() === "multiselect") {
          return next
            .filter((option) => option.isDefault)
            .map((option) => option.value)
            .join(", ");
        }

        const nextDefault = next.find((option) => option.isDefault) ?? next[0];
        return nextDefault?.value || "";
      })(),
    }));

    setSelectedOptionId((current) => (current === optionToRemoveId ? null : current));
    setOptionToRemoveId(null);
  }

  function cancelRemoveOption() {
    setOptionToRemoveId(null);
  }

  function selectOption(optionId: string) {
    setSelectedOptionId(optionId);
  }

  return {
    controls,
    isLoadingControls,
    controlsError,
    controlSearch,
    setControlSearch,
    draft,
    setDraft,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    activeDragItem,
    isCanvasTargeted,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    isPreviewOpen,
    activeDragRect,
    fieldLayoutMenu,
    fieldLayoutMenuStyle,
    isSavingForm,
    isLoadingForm,
    loadError,
    saveError,
    isEditMode,
    isCompactViewport,
    selectedField,
    selectedControl,
    fieldToRemove,
    optionToRemove,
    selectedOption,
    previewColumnCount,
    controlUsageCounts,
    filteredControls,
    nameError,
    headerTextError,
    layoutColumnError,
    canvasFieldError,
    sensors,
    canvasRestrictModifier,
    setCanvasRef,
    isCanvasOver,
    canvasDropRef,
    inspectorLabelRef,
    handleSaveForm,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragEnd,
    onDragCancel,
    appendFieldToCanvas,
    openPreview,
    closePreview,
    openFieldLayoutMenu,
    closeFieldLayoutMenu,
    setFieldLayoutPreset,
    clearFieldLayoutPreset,
    removeField,
    confirmRemoveField,
    cancelRemoveField,
    addOption,
    selectOption,
    setDefaultOption,
    removeOption,
    confirmRemoveOption,
    cancelRemoveOption,
    clearAllCanvasFields,
    updateSelectedField,
    updateOption,
  };
}
