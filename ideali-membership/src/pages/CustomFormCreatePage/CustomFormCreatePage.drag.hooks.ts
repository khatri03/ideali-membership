import { useRef, type RefObject, type Dispatch, type SetStateAction } from "react";
import { useDroppable, useSensor, useSensors, PointerSensor, type DragCancelEvent, type DragEndEvent, type DragMoveEvent, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { CustomFormControl, CustomFormFieldDraft } from "../../types/customForms";
import { measureDragSourceRect, normalizeFields } from "./index";

const CANVAS_ID = "custom-form-canvas";

export function useCustomFormCreatePageDrag({
  canvasDropRef,
  fields,
  onAddFieldFromControl,
  setActiveDragId,
  setActiveDragItem,
  setActiveDragRect,
  setIsCanvasTargeted,
  setFields,
}: {
  canvasDropRef: RefObject<HTMLDivElement | null>;
  fields: CustomFormFieldDraft[];
  onAddFieldFromControl: (control: CustomFormControl, index?: number) => void;
  setActiveDragId: Dispatch<SetStateAction<string | null>>;
  setActiveDragItem: Dispatch<SetStateAction<{ kind: "palette"; control: CustomFormControl } | { kind: "field"; field: CustomFormFieldDraft } | null>>;
  setActiveDragRect: Dispatch<SetStateAction<{ width: number; height: number } | null>>;
  setIsCanvasTargeted: Dispatch<SetStateAction<boolean>>;
  setFields: Dispatch<SetStateAction<CustomFormFieldDraft[]>>;
}) {
  const lastDropTargetIdRef = useRef<string | null>(null);
  const dragFieldOrderSnapshotRef = useRef<CustomFormFieldDraft[] | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
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

    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      setFields((current) => normalizeFields(arrayMove(current, oldIndex, newIndex)));
    }
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
        onAddFieldFromControl(activeData.control, fields.length);
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

  return {
    sensors,
    setCanvasRef,
    isCanvasOver,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragCancel,
    onDragEnd,
  };
}
