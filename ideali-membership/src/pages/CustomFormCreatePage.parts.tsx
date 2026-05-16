import { useEffect, useState, type RefObject } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleHelp, type LucideIcon } from "lucide-react";
import { CountrySelectInput } from "../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../components/inputs/MultiSelectInput/MultiSelectInput";
import { StateSelectInput } from "../components/inputs/StateSelectInput/StateSelectInput";
import { PasswordInput } from "../components/inputs/PasswordInput/PasswordInput";
import type { CustomFormControl, CustomFormFieldDraft } from "../types/customForms";
import {
  CONTROL_ICON_MAP,
  buildPreviewValues,
  getDefaultMultiSelectValues,
  getDefaultOptionValue,
  getLayoutPresetLabel,
  getPreviewColumnSpan,
  getPreviewDefaultValue,
  isTruthyValue,
  type ActiveDragItem,
  type ActiveDragRect,
  type PreviewValue,
} from "./CustomFormCreatePage.helpers";

export function ControlPaletteItem({
  control,
  count,
  onDoubleClick,
  icon: Icon,
  tooltip,
}: {
  control: CustomFormControl;
  count: number;
  onDoubleClick: (control: CustomFormControl) => void;
  icon: LucideIcon;
  tooltip: string;
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
      title={tooltip}
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
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700 cursor-grab hover:cursor-grab select-none touch-none"
      title={label}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
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
    ...(isDragging ? { transition } : style),
    gridColumn: isCompactViewport ? "1 / -1" : `span ${span} / span ${span}`,
  };

  if (isDragging) {
    return (
      <article
        ref={setNodeRef}
        data-field-id={field.id}
        className="rounded-3xl border-2 border-dashed border-cyan-300 bg-cyan-50/40 p-4 pointer-events-none"
        style={combinedStyle}
        aria-hidden="true"
      />
    );
  }

  return (
    <article
      ref={setNodeRef}
      data-field-id={field.id}
      className={[
        "rounded-3xl border bg-white p-4 shadow-sm transition cursor-default hover:cursor-default",
        selected ? "border-cyan-400 ring-2 ring-cyan-100" : "border-slate-200",
      ].join(" ")}
      style={combinedStyle}
      onClick={() => onSelect(field.id)}
      title="Click to select"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {showDragHandle ? (
            <button
              type="button"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 cursor-grab hover:cursor-grab active:cursor-grabbing select-none touch-none"
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
            title={`Change Layout (${getLayoutPresetLabel(layoutColumn)})`}
            aria-label={`Change layout, current ${getLayoutPresetLabel(layoutColumn)}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenLayoutMenu(field.id, {
                x: rect.right,
                y: rect.bottom + 8,
              });
            }}
          >
            <span className="text-[10px] font-bold tracking-[0.08em]">{getLayoutPresetLabel(layoutColumn)}</span>
          </button>
          {field.layoutColumn !== null ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClearLayout(field.id);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-100 hover:text-rose-700"
              aria-label="Remove layout override"
              title="Remove layout override"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 5 15 15" />
                <path d="M15 5 5 15" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(field.id);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-100 hover:text-rose-700"
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

export function FieldCanvasPreview({ field }: { field: CustomFormFieldDraft }) {
  const controlType = field.controlType.toLowerCase();
  const placeholder = field.placeholder || field.label;
  const defaultOptionValue = getDefaultOptionValue(field);
  const [previewMultiSelectValue, setPreviewMultiSelectValue] = useState(() => getDefaultMultiSelectValues(field));
  const [previewCountryValue, setPreviewCountryValue] = useState(() => field.defaultValue || "");

  useEffect(() => {
    if (controlType === "multiselect") {
      setPreviewMultiSelectValue(getDefaultMultiSelectValues(field));
    }
  }, [controlType, field.defaultValue, field.options, field.id]);

  useEffect(() => {
    if (controlType === "country") {
      setPreviewCountryValue(field.defaultValue || "");
    }
  }, [controlType, field.defaultValue, field.id]);

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "tel":
      return (
        <input
          type={controlType}
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "password":
      return (
        <PasswordInput
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "textarea":
      return (
        <textarea
          rows={4}
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "select":
      return (
        <select
          value={defaultOptionValue}
          disabled
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        >
          <option value="" disabled>
            {placeholder || "Select one"}
          </option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <MultiSelectInput
          value={previewMultiSelectValue}
          onChange={setPreviewMultiSelectValue}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={field.placeholder || "Select one or more"}
        />
      );
    case "country":
      return (
        <CountrySelectInput
          value={previewCountryValue}
          onChange={setPreviewCountryValue}
          placeholder={field.placeholder || "Select country"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "state":
      return (
        <StateSelectInput
          countryId={null}
          value={field.defaultValue}
          onChange={() => undefined}
          placeholder={field.placeholder || "Select state"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={isTruthyValue(field.defaultValue)} readOnly className="h-4 w-4 accent-cyan-600" />
          <span className="text-sm font-semibold text-slate-800">{field.label}</span>
        </label>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="radio"
                name={field.id}
                checked={getDefaultOptionValue(field) === option.value}
                readOnly
                className="h-4 w-4 accent-cyan-600"
              />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      );
    case "file":
      return (
        <input
          type="file"
          accept={field.acceptedFileTypes.length > 0 ? field.acceptedFileTypes.join(",") : undefined}
          readOnly
          className="block w-full text-sm text-slate-500"
        />
      );
    case "range":
      return <input type="range" value={field.defaultValue || undefined} readOnly className="w-full accent-cyan-600" />;
    case "color":
      return <input type="color" value={field.defaultValue || "#0ea5e9"} readOnly className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1" />;
    case "submit":
      return (
        <button
          type="button"
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
  }
}

export function PreviewFieldLabel({ field }: { field: CustomFormFieldDraft }) {
  if (field.controlType.toLowerCase() === "checkbox") {
    return null;
  }

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

export function PreviewFieldRenderer({
  field,
  value,
  onChange,
  countryId,
}: {
  field: CustomFormFieldDraft;
  value: PreviewValue;
  onChange: (value: PreviewValue) => void;
  countryId?: string | null;
}) {
  const controlType = field.controlType.toLowerCase();
  const placeholder = field.placeholder || field.label;
  const defaultOptionValue = getDefaultOptionValue(field);
  const multiSelectValue = Array.isArray(value) ? value : getDefaultMultiSelectValues(field);

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "tel":
      return (
        <input
          type={controlType}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "password":
      return (
        <PasswordInput
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "textarea":
      return (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        >
          <option value="">{field.placeholder || "Select one"}</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={(nextValue) => onChange(nextValue)}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={field.placeholder || "Select one or more"}
        />
      );
    case "country":
      return (
        <CountrySelectInput
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={field.placeholder || "Select country"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "state":
      return (
        <StateSelectInput
          countryId={countryId}
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={field.placeholder || "Select state"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={typeof value === "boolean" ? value : isTruthyValue(field.defaultValue)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-cyan-600"
          />
          <span className="text-sm font-medium text-slate-800">{field.label}</span>
        </label>
      );
    case "radio":
      return (
        <div className="space-y-3">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="radio"
                name={`preview-${field.id}`}
                checked={typeof value === "string" ? value === option.value : defaultOptionValue === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-cyan-600"
              />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      );
    case "file":
      return (
        <input
          type="file"
          accept={field.acceptedFileTypes.length > 0 ? field.acceptedFileTypes.join(",") : undefined}
          onChange={() => onChange(null)}
          className="block w-full text-sm text-slate-500"
        />
      );
    case "range":
      return (
        <input
          type="range"
          value={typeof value === "string" ? value : field.defaultValue || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full accent-cyan-600"
        />
      );
    case "color":
      return (
        <input
          type="color"
          value={typeof value === "string" ? value : field.defaultValue || "#0ea5e9"}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
        />
      );
    case "submit":
      return (
        <button
          type="button"
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
  }
}

export function FormPreviewField({
  field,
  span,
  isCompactViewport,
  value,
  onChange,
  countryId,
}: {
  field: CustomFormFieldDraft;
  span: number;
  isCompactViewport: boolean;
  value: PreviewValue;
  onChange: (value: PreviewValue) => void;
  countryId?: string | null;
}) {
  return (
    <div
      className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-4"
      style={{ gridColumn: isCompactViewport ? "1 / -1" : `span ${span} / span ${span}` }}
    >
      <div className="space-y-3">
        <PreviewFieldLabel field={field} />
        <PreviewFieldRenderer field={field} value={value} onChange={onChange} countryId={countryId} />
        {field.tooltip ? <p className="text-xs text-slate-500">{field.tooltip}</p> : null}
      </div>
    </div>
  );
}

export function PreviewFormCanvas({
  fields,
  spanCount,
  isCompactViewport,
}: {
  fields: CustomFormFieldDraft[];
  spanCount: number;
  isCompactViewport: boolean;
}) {
  const [previewValues, setPreviewValues] = useState<Record<string, PreviewValue>>(() => buildPreviewValues(fields));

  useEffect(() => {
    setPreviewValues(buildPreviewValues(fields));
  }, [fields]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
      {fields.map((field) => {
        const countryField = fields
          .filter((candidate) => candidate.displayOrder < field.displayOrder)
          .filter((candidate) => candidate.controlType.toLowerCase() === "country")
          .pop();

        const countryId =
          countryField && typeof previewValues[countryField.id] === "string"
            ? (previewValues[countryField.id] as string)
            : null;

        return (
          <FormPreviewField
            key={field.id}
            field={field}
            span={getPreviewColumnSpan(field, spanCount)}
            isCompactViewport={isCompactViewport}
            value={previewValues[field.id] ?? getPreviewDefaultValue(field)}
            countryId={countryId}
            onChange={(nextValue) =>
              setPreviewValues((current) => ({
                ...current,
                [field.id]: nextValue,
              }))
            }
          />
        );
      })}
    </div>
  );
}

export function FieldPreview({
  title,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  error,
  inputRef,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{title}</span>
        {required ? (
          <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
            *
          </span>
        ) : null}
      </span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100",
          error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200",
        ].join(" ")}
      />
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

export function SelectFieldPreview({
  title,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{title}</span>
        {required ? (
          <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
            *
          </span>
        ) : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
        <ControlIcon icon={CONTROL_ICON_MAP[item.control.controlType.trim().toLowerCase()] ?? CircleHelp} label={item.control.name} />
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
