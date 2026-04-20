import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  type DragCancelEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { fetchCustomFormControls } from "../lib/customForms";
import type {
  CustomFormControl,
  CustomFormDraft,
  CustomFormFieldDraft,
  CustomFormOptionDraft,
} from "../types/customForms";
import { APP_ROUTES } from "../routes";

const CANVAS_ID = "custom-form-canvas";
const constrainFieldDragToCanvas: Modifier = ({
  active,
  activeNodeRect,
  containerNodeRect,
  transform,
}) => {
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

type ActiveDragItem =
  | { kind: "palette"; control: CustomFormControl }
  | { kind: "field"; field: CustomFormFieldDraft }
  | null;

const CONTROL_ICON_MAP: Record<string, string> = {
  "fas fa-font": "Aa",
  "fas fa-envelope": "@",
  "fas fa-hashtag": "#",
  "fas fa-calendar": "31",
  "fas fa-caret-down": "v",
  "fas fa-check-square": "[]",
  "fas fa-dot-circle": "o",
  "fas fa-align-left": "|||",
  "fas fa-paperclip": "+",
  "fas fa-lock": "*",
  "fas fa-palette": "~",
  "fas fa-sliders-h": "=",
  "fas fa-paper-plane": ">",
  "fas fa-square-phone": "T",
};

function createFieldId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOptionId() {
  return `option-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFields(fields: CustomFormFieldDraft[]) {
  return fields.map((field, index) => ({
    ...field,
    displayOrder: index + 1,
  }));
}

function createFieldDraft(control: CustomFormControl, displayOrder: number): CustomFormFieldDraft {
  return {
    id: createFieldId(),
    controlId: control.id,
    controlName: control.name,
    controlType: control.controlType,
    iconClass: control.iconClass,
    label: control.defaultLabel || control.name,
    placeholder: "",
    tooltip: "",
    required: false,
    minLength: "",
    maxLength: "",
    defaultValue: "",
    displayOrder,
    options: control.hasOptions
      ? [
          {
            id: createOptionId(),
            displayText: "Option 1",
            value: "option-1",
          },
        ]
      : [],
  };
}

function readResponseData(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if ("Data" in payload) {
    return (payload as { Data?: unknown }).Data;
  }

  if ("data" in payload) {
    return (payload as { data?: unknown }).data;
  }

  return payload;
}

function getControlGlyph(iconClass: string, controlType: string, label: string) {
  return (
    CONTROL_ICON_MAP[iconClass] ??
    CONTROL_ICON_MAP[`fas fa-${controlType}`] ??
    label.slice(0, 1).toUpperCase()
  );
}

function getControlTooltip(control: CustomFormControl) {
  const details = [
    control.name,
    "Double-click to add",
  ].filter(Boolean);

  return details.join(" • ");
}

function ControlPaletteItem({
  control,
  count,
  onDoubleClick,
}: {
  control: CustomFormControl;
  count: number;
  onDoubleClick: (control: CustomFormControl) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${control.id}`,
    data: {
      source: "palette",
      control,
    },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onDoubleClick={() => onDoubleClick(control)}
      title={getControlTooltip(control)}
      {...listeners}
      {...attributes}
      style={isDragging ? undefined : style}
      className={[
        "group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition",
        "cursor-grab hover:cursor-grab hover:border-cyan-300 hover:shadow-md select-none touch-none",
        isDragging ? "scale-[0.98] opacity-60 cursor-grabbing" : "",
      ].join(" ")}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-sm font-bold text-cyan-700 cursor-grab hover:cursor-grab select-none touch-none">
        {getControlGlyph(control.iconClass, control.controlType, control.name)}
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
        {control.name}
      </p>
      <span
        className={[
          "ml-auto inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
          count > 0 ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-400",
        ].join(" ")}
        title={`${count} field${count === 1 ? "" : "s"} on canvas`}
      >
        {count}
      </span>
    </button>
  );
}

function ControlIcon({
  iconClass,
  controlType,
  label,
}: {
  iconClass: string;
  controlType: string;
  label: string;
}) {
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700 cursor-grab hover:cursor-grab select-none touch-none"
      title={label}
      aria-hidden="true"
    >
      <span className="text-sm font-bold">
        {getControlGlyph(iconClass, controlType, label)}
      </span>
    </div>
  );
}

function SortableFieldCard({
  field,
  selected,
  onSelect,
  onRemove,
}: {
  field: CustomFormFieldDraft;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: {
      source: "field",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={isDragging ? { transition, opacity: 0 } : style}
      className={[
        "rounded-3xl border bg-white p-4 shadow-sm transition",
        selected ? "border-cyan-400 ring-2 ring-cyan-100" : "border-slate-200",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      onClick={() => onSelect(field.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{field.label}</h3>
            {field.required ? (
              <span
                className="text-sm font-bold leading-none text-rose-600"
                aria-label="Required"
                title="Required"
              >
                *
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 cursor-grab active:cursor-grabbing select-none touch-none"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <span aria-hidden="true" className="text-sm font-bold leading-none">
              ::
            </span>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(field.id);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-100 hover:text-rose-700"
            title="Remove field"
            aria-label="Remove field"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
              <path d="M19 6l-1 12.2A1.8 1.8 0 0 1 16.2 20H7.8A1.8 1.8 0 0 1 6 18.2L5 6" />
              <path d="M10 11v5" />
              <path d="M14 11v5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <FieldCanvasPreview field={field} />
      </div>
    </article>
  );
}

function FieldCanvasPreview({ field }: { field: CustomFormFieldDraft }) {
  const controlType = field.controlType.toLowerCase();

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "password":
    case "tel":
      return (
        <input
          type={controlType}
          disabled
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "textarea":
      return (
        <textarea
          disabled
          rows={4}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "select":
      return (
        <select
          disabled
          value=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        >
          <option value="" disabled>
            Select one
          </option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" disabled className="h-4 w-4 accent-cyan-600" />
          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
        </label>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input type="radio" disabled name={field.id} className="h-4 w-4 accent-cyan-600" />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      );
    case "file":
      return <input type="file" disabled className="block w-full text-sm text-slate-500" />;
    case "range":
      return <input type="range" disabled className="w-full accent-cyan-600" />;
    case "color":
      return <input type="color" disabled value="#0ea5e9" className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1" />;
    case "submit":
      return (
        <button
          type="button"
          disabled
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          disabled
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
  }
}

function PreviewFieldLabel({ field }: { field: CustomFormFieldDraft }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-800">{field.label}</span>
      {field.required ? (
        <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
          *
        </span>
      ) : null}
    </div>
  );
}

function PreviewFieldRenderer({ field }: { field: CustomFormFieldDraft }) {
  const controlType = field.controlType.toLowerCase();

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "password":
    case "tel":
      return (
        <input
          type={controlType}
          disabled
          placeholder={field.placeholder || field.label}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm"
        />
      );
    case "textarea":
      return (
        <textarea
          disabled
          rows={4}
          placeholder={field.placeholder || field.label}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm"
        />
      );
    case "select":
      return (
        <select
          disabled
          value=""
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm"
        >
          <option value="" disabled>
            {field.placeholder || "Select one"}
          </option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" disabled className="h-4 w-4 accent-cyan-600" />
          <span className="text-sm font-medium text-slate-800">{field.label}</span>
        </label>
      );
    case "radio":
      return (
        <div className="space-y-3">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input type="radio" disabled name={`preview-${field.id}`} className="h-4 w-4 accent-cyan-600" />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      );
    case "file":
      return <input type="file" disabled className="block w-full text-sm text-slate-500" />;
    case "range":
      return <input type="range" disabled className="w-full accent-cyan-600" />;
    case "color":
      return <input type="color" disabled value="#0ea5e9" className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1" />;
    case "submit":
      return (
        <button
          type="button"
          disabled
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          disabled
          placeholder={field.placeholder || field.label}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm"
        />
      );
  }
}

function FormPreviewField({ field }: { field: CustomFormFieldDraft }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <PreviewFieldLabel field={field} />
      <PreviewFieldRenderer field={field} />
      {field.tooltip ? <p className="mt-2 text-xs text-slate-500">{field.tooltip}</p> : null}
    </div>
  );
}

function FieldPreview({
  title,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{title}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      />
    </label>
  );
}

function DragGhost({ item }: { item: ActiveDragItem }) {
  if (!item) {
    return null;
  }

  if (item.kind === "palette") {
    return (
      <div className="flex w-72 cursor-grabbing items-center gap-3 rounded-2xl border border-cyan-200 bg-white px-3 py-3 shadow-2xl shadow-slate-900/10">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-sm font-bold text-cyan-700">
          {getControlGlyph(item.control.iconClass, item.control.controlType, item.control.name)}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {item.control.name}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-[20rem] cursor-grabbing rounded-3xl border border-cyan-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{item.field.label}</h3>
            {item.field.required ? (
              <span
                className="text-sm font-bold leading-none text-rose-600"
                aria-label="Required"
                title="Required"
              >
                *
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
          Remove
        </div>
      </div>

      <div className="mt-4">
        <FieldCanvasPreview field={item.field} />
      </div>
    </div>
  );
}

function ToggleField({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-600"
      />
    </label>
  );
}

export function CustomFormCreatePage() {
  const [controls, setControls] = useState<CustomFormControl[]>([]);
  const [isLoadingControls, setIsLoadingControls] = useState(true);
  const [controlsError, setControlsError] = useState<string | null>(null);
  const [controlSearch, setControlSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomFormDraft>({
    name: "",
    headerText: "",
    description: "",
    layoutColumn: 2,
  });
  const [fields, setFields] = useState<CustomFormFieldDraft[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem>(null);
  const [isCanvasTargeted, setIsCanvasTargeted] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fieldToRemoveId, setFieldToRemoveId] = useState<string | null>(null);
  const lastDropTargetIdRef = useRef<string | null>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPointRef = useRef<{ x: number; y: number } | null>(null);
  const canvasDropRef = useRef<HTMLDivElement | null>(null);

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

  const selectedControl = useMemo(
    () => controls.find((control) => control.id === selectedField?.controlId) ?? null,
    [controls, selectedField?.controlId],
  );

  const fieldToRemove = useMemo(
    () => fields.find((field) => field.id === fieldToRemoveId) ?? null,
    [fieldToRemoveId, fields],
  );

  const controlUsageCounts = useMemo(() => {
    const counts = new Map<number, number>();

    for (const field of fields) {
      counts.set(field.controlId, (counts.get(field.controlId) ?? 0) + 1);
    }

    return counts;
  }, [fields]);

  const fieldIdSet = useMemo(() => new Set(fields.map((field) => field.id)), [fields]);

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

  function deleteField(fieldId: string) {
    setFields((current) => {
      const next = current.filter((field) => field.id !== fieldId);
      return normalizeFields(next);
    });

    setSelectedFieldId((current) => {
      if (current !== fieldId) {
        return current;
      }

      return fields.find((field) => field.id !== fieldId)?.id ?? null;
    });
  }

  function removeField(fieldId: string) {
    setFieldToRemoveId(fieldId);
  }

  function confirmRemoveField() {
    if (!fieldToRemoveId) {
      return;
    }

    deleteField(fieldToRemoveId);
    setFieldToRemoveId(null);
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
    setIsClearConfirmOpen(false);
    setFieldToRemoveId(null);
    setIsPreviewOpen(false);
  }

  function closePreview() {
    setIsPreviewOpen(false);
  }

  function openPreview() {
    if (fields.length === 0) {
      return;
    }

    setIsPreviewOpen(true);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
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
      return;
    }

    if (activeData?.source === "field") {
      const field = fields.find((current) => current.id === event.active.id);
      setActiveDragItem(field ? { kind: "field", field } : null);
      return;
    }

    setActiveDragItem(null);
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
  }

  function onDragCancel(_event: DragCancelEvent) {
    setActiveDragId(null);
    setActiveDragItem(null);
    setIsCanvasTargeted(false);
    lastDropTargetIdRef.current = null;
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const pointerInsideCanvas = isPointInsideCanvas(lastPointerPointRef.current);

    setActiveDragId(null);
    setActiveDragItem(null);
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

    if (activeData?.source === "field") {
      if (!over) {
        return;
      }

      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === String(over.id));

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setFields((current) => normalizeFields(arrayMove(current, oldIndex, newIndex)));
      }
    }
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

  function removeOption(optionId: string) {
    updateSelectedField((field) => ({
      ...field,
      options: field.options.filter((option) => option.id !== optionId),
    }));
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Custom Forms
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Build a new custom form
            </h1>
            <p className="mt-3 text-slate-600">
              Drag field types from the palette, arrange them on the canvas, and tune the
              constraints in the inspector.
            </p>
          </div>

          <Link
            to={APP_ROUTES.customForms}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to forms
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldPreview
            title="Name"
            value={draft.name}
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Membership enrollment form"
          />
          <FieldPreview
            title="Header Text"
            value={draft.headerText}
            onChange={(value) => setDraft((current) => ({ ...current, headerText: value }))}
            placeholder="Tell us a little about you"
          />
          <FieldPreview
            title="Description"
            value={draft.description}
            onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
            placeholder="Optional supporting copy"
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Layout Columns</span>
            <select
              value={draft.layoutColumn}
              onChange={(event) =>
                setDraft((current) => ({ ...current, layoutColumn: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} column{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[constrainFieldDragToCanvas]}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
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

              <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
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

            <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50/80 p-5">
              <p className="text-sm font-semibold text-slate-900">Builder note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start with the core controls first. We can progressively add advanced settings,
                validation rules, and persistence after the structure is stable.
              </p>
            </div>
          </aside>
          <DragOverlay dropAnimation={null}>
            <DragGhost item={activeDragItem} />
          </DragOverlay>

          <main
            ref={setCanvasRef}
            className={[
              "flex max-h-[calc(100vh-14rem)] min-h-0 flex-col rounded-[2rem] border bg-white/90 p-5 shadow-sm transition overflow-hidden",
              isCanvasOver || isCanvasTargeted
                ? "border-cyan-400 ring-4 ring-cyan-100"
                : "border-slate-200",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Form canvas</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Drop controls here and drag to reorder them.
                </p>
              </div>
              <div className="flex items-center gap-2">
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

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <div
                ref={canvasDropRef}
                className={[
                  "min-h-[420px] rounded-[2rem] border border-dashed bg-slate-50 p-4 transition",
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
                    <div className="space-y-4">
                      {fields.map((field) => (
                        <SortableFieldCard
                          key={field.id}
                          field={field}
                          selected={field.id === selectedFieldId}
                          onSelect={setSelectedFieldId}
                          onRemove={removeField}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[380px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 text-center">
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

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Field inspector</h2>
              {selectedField ? (
                <div className="mt-4 space-y-4">
                  <FieldPreview
                    title="Label"
                    value={selectedField.label}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        label: value,
                      }))
                    }
                  />
                  {selectedControl?.canHavePlaceHolder ? (
                    <FieldPreview
                      title="Placeholder"
                      value={selectedField.placeholder}
                      onChange={(value) =>
                        updateSelectedField((field) => ({
                          ...field,
                          placeholder: value,
                        }))
                      }
                      placeholder="Shown inside the input"
                    />
                  ) : null}
                  <FieldPreview
                    title="Tooltip"
                    value={selectedField.tooltip}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        tooltip: value,
                      }))
                    }
                    placeholder="Optional helper text"
                  />
                  <FieldPreview
                    title="Default value"
                    value={selectedField.defaultValue}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        defaultValue: value,
                      }))
                    }
                  />

                  <ToggleField
                    title="Required"
                    checked={selectedField.required}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        required: value,
                      }))
                    }
                  />

                  {controls.find((control) => control.id === selectedField.controlId)?.canHaveMinLength ? (
                    <div className="grid grid-cols-2 gap-3">
                      <FieldPreview
                        title="Min length"
                        value={selectedField.minLength}
                        onChange={(value) =>
                          updateSelectedField((field) => ({
                            ...field,
                            minLength: value,
                          }))
                        }
                        type="number"
                      />
                      <FieldPreview
                        title="Max length"
                        value={selectedField.maxLength}
                        onChange={(value) =>
                          updateSelectedField((field) => ({
                            ...field,
                            maxLength: value,
                          }))
                        }
                        type="number"
                      />
                    </div>
                  ) : null}

                  {controls.find((control) => control.id === selectedField.controlId)?.hasOptions ? (
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Options</p>
                          <p className="text-xs text-slate-500">For select, radio, and checkbox controls.</p>
                        </div>
                        <button
                          type="button"
                          onClick={addOption}
                          className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
                        >
                          Add option
                        </button>
                      </div>

                      <div className="space-y-3">
                        {selectedField.options.map((option, index) => (
                          <div
                            key={option.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Option {index + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeOption(option.id)}
                                className="text-xs font-medium text-rose-600 transition hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="mt-3 grid gap-3">
                              <FieldPreview
                                title="Display text"
                                value={option.displayText}
                                onChange={(value) => updateOption(option.id, "displayText", value)}
                              />
                              <FieldPreview
                                title="Value"
                                value={option.value}
                                onChange={(value) => updateOption(option.id, "value", value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  Select a field on the canvas to configure its label, tooltip, and validation
                  rules.
                </div>
              )}
            </div>

          </aside>
        </div>
      </DndContext>

      {fieldToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
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

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {draft.name || "Untitled form"}
                </h3>
                {draft.headerText ? (
                  <p className="mt-1 text-sm text-slate-600">{draft.headerText}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
              <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                {draft.description ? (
                  <p className="mb-6 text-sm leading-6 text-slate-600">{draft.description}</p>
                ) : null}

                <div className="space-y-5">
                  {fields.length > 0 ? (
                    fields.map((field) => <FormPreviewField key={field.id} field={field} />)
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
        </div>
      ) : null}

      {isClearConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
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
