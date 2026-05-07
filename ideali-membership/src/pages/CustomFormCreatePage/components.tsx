import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  AlignLeft,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  CircleDot,
  CircleHelp,
  Globe2,
  Hash,
  LockKeyhole,
  Mail,
  MapPinned,
  Paperclip,
  Palette,
  Phone,
  Send,
  SlidersHorizontal,
  type LucideIcon,
  Type,
  ListChecks,
} from "lucide-react";
import type { CustomFormControl, CustomFormFieldDraft } from "../../types/customForms";
import {
  getControlIcon,
  getControlTooltip,
  getLayoutPresetLabel,
  toSentenceCase,
  type ActiveDragItem,
  type ActiveDragRect,
} from "./utils";
import { FieldCanvasPreview } from "./preview";

export function ControlPaletteItem({
  control,
  count,
  onDoubleClick,
}: {
  control: CustomFormControl;
  count: number;
  onDoubleClick: (control: CustomFormControl) => void;
}) {
  const Icon = getControlIcon(control.controlType);

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
        "cursor-pointer hover:cursor-pointer hover:border-cyan-300 hover:shadow-md select-none touch-none",
        isDragging ? "scale-[0.98] opacity-60 cursor-grabbing" : "",
      ].join(" ")}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-sm font-bold text-cyan-700 cursor-pointer hover:cursor-pointer select-none touch-none">
        <Icon className="h-5 w-5" aria-hidden="true" />
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

export function ControlIcon({
  controlType,
  label,
}: {
  controlType: string;
  label: string;
}) {
  const Icon = getControlIcon(controlType);

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{toSentenceCase(label)}</span>
    </div>
  );
}

export function SortableFieldCard({
  field,
  span,
  layoutColumn,
  isCompactViewport,
  selected,
  onSelect,
  onOpenLayoutMenu,
  onClearLayout,
  onRemove,
  showDragHandle,
}: {
  field: CustomFormFieldDraft;
  span: number;
  layoutColumn: number;
  isCompactViewport: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpenLayoutMenu: (fieldId: string, position: { x: number; y: number }) => void;
  onClearLayout: (fieldId: string) => void;
  onRemove: (id: string) => void;
  showDragHandle: boolean;
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
  const combinedStyle = {
    ...(isDragging ? { transition, opacity: 0 } : style),
    gridColumn: isCompactViewport ? "1 / -1" : `span ${span} / span ${span}`,
  };

  return (
    <article
      ref={setNodeRef}
      data-field-id={field.id}
      className={[
        "rounded-3xl border bg-white p-4 shadow-sm transition cursor-default hover:cursor-default",
        selected ? "border-cyan-400 ring-2 ring-cyan-100" : "border-slate-200",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      style={combinedStyle}
      onClick={() => onSelect(field.id)}
      title="Click to select"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{field.label}</h3>
            <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
              {getLayoutPresetLabel(layoutColumn)}
              {field.layoutColumn === null ? null : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClearLayout(field.id);
                  }}
                  className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-[10px] font-bold leading-none text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                  aria-label="Remove layout override"
                  title="Remove layout override"
                >
                  x
                </button>
              )}
            </span>
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

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {showDragHandle ? (
            <button
              type="button"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 cursor-grab hover:cursor-grab active:cursor-grabbing select-none touch-none"
              {...attributes}
              {...listeners}
              onClick={(event) => event.stopPropagation()}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="6" cy="5" r="1.2" />
                <circle cx="14" cy="5" r="1.2" />
                <circle cx="6" cy="10" r="1.2" />
                <circle cx="14" cy="10" r="1.2" />
                <circle cx="6" cy="15" r="1.2" />
                <circle cx="14" cy="15" r="1.2" />
              </svg>
            </button>
          ) : null}

          <button
            type="button"
            title="Change Layout"
            aria-label="Change Layout"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenLayoutMenu(field.id, {
                x: rect.right,
                y: rect.bottom + 8,
              });
            }}
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
              <rect x="3.5" y="5" width="17" height="4.5" rx="1.2" />
              <rect x="3.5" y="10.75" width="11.5" height="4.5" rx="1.2" />
              <rect x="3.5" y="16.5" width="8.25" height="4.5" rx="1.2" />
            </svg>
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

export function DragGhost({ item, rect }: { item: ActiveDragItem; rect: ActiveDragRect }) {
  if (!item) {
    return null;
  }

  const style = rect
    ? {
        width: rect.width,
        height: rect.height,
      }
    : undefined;

  if (item.kind === "palette") {
    return (
      <div
        className="flex cursor-grabbing items-center gap-3 rounded-2xl border border-cyan-200 bg-white px-3 py-3 shadow-2xl shadow-slate-900/10"
        style={style}
      >
        <ControlIcon controlType={item.control.controlType} label={item.control.name} />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {item.control.name}
        </p>
      </div>
    );
  }

  return (
    <div
      className="cursor-grabbing rounded-3xl border border-cyan-200 bg-white p-4 shadow-2xl shadow-slate-900/10"
      style={style}
    >
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

export function measureDragSourceRect(sourceId: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const element = document.querySelector<HTMLElement>(`[data-field-id="${sourceId}"]`);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

export function ToggleField({
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
