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
import type { CustomFormControl, CustomFormFieldDraft, CustomFormOptionDraft } from "../../types/customForms";

export type ActiveDragItem =
  | { kind: "palette"; control: CustomFormControl }
  | { kind: "field"; field: CustomFormFieldDraft }
  | null;

export type ActiveDragRect = {
  width: number;
  height: number;
} | null;

export type PreviewValue = string | string[] | boolean | null;

const CONTROL_ICON_MAP: Record<string, LucideIcon> = {
  text: Type,
  email: Mail,
  number: Hash,
  date: CalendarDays,
  select: ChevronDown,
  checkbox: CheckSquare2,
  radio: CircleDot,
  textarea: AlignLeft,
  file: Paperclip,
  password: LockKeyhole,
  tel: Phone,
  phone: Phone,
  multiselect: ListChecks,
  country: Globe2,
  state: MapPinned,
  color: Palette,
  range: SlidersHorizontal,
  submit: Send,
};
export function clearDefaultOption(options: CustomFormOptionDraft[], optionId: string) {
  return options.map((option) => ({
    ...option,
    isDefault: option.id === optionId,
  }));
}

export function parseDelimitedDefaultValues(value: string | null | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function getSelectedOptionValues(field: CustomFormFieldDraft): string[] {
  const selectedByFlag = field.options.filter((option) => option.isDefault).map((option) => option.value);
  return selectedByFlag.length > 0 ? Array.from(new Set(selectedByFlag)) : parseDelimitedDefaultValues(field.defaultValue);
}

export function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function normalizeLayoutColumn(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return 1;
  }

  return Math.max(1, Math.min(4, Math.trunc(value ?? 1)));
}

export function normalizeFieldLayoutColumn(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(1, Math.min(4, Math.trunc(value)));
}

export function getPreviewColumnSpan(field: CustomFormFieldDraft, fallbackLayoutColumn: number) {
  const layoutColumn = normalizeLayoutColumn(field.layoutColumn ?? fallbackLayoutColumn);

  switch (layoutColumn) {
    case 1:
      return 12;
    case 2:
      return 6;
    case 3:
      return 4;
    case 4:
      return 3;
    default:
      return 12;
  }
}

export function getLayoutPresetLabel(layoutColumn: number) {
  return `1x${layoutColumn}`;
}

export function normalizeFields(fields: CustomFormFieldDraft[]) {
  return fields.map((field, index) => ({
    ...field,
    displayOrder: index + 1,
  }));
}

export function getControlIcon(controlType: string) {
  return CONTROL_ICON_MAP[controlType.trim().toLowerCase()] ?? CircleHelp;
}

export function getControlTooltip(control: CustomFormControl) {
  const details = [
    control.name,
    "Double-click to add",
  ].filter(Boolean);

  return details.join(" • ");
}

export function isTruthyValue(value: string) {
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

export function getCheckboxDefaultValue(value: string | null | undefined) {
  return isTruthyValue(value ?? "") ? "true" : "false";
}

export function normalizeAcceptedFileTypes(value: string[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function toggleAcceptedFileType(
  acceptedFileTypes: string[],
  fileType: string,
  checked: boolean,
) {
  const next = checked
    ? Array.from(new Set([...acceptedFileTypes, fileType]))
    : acceptedFileTypes.filter((value) => value !== fileType);

  console.log("[custom-form] acceptedFileTypes:", next.join(","));

  return next;
}

export function getDefaultOptionValue(field: CustomFormFieldDraft) {
  return (
    field.options.find((option) => option.isDefault)?.value ||
    field.options.find((option) => option.value === field.defaultValue)?.value ||
    field.defaultValue ||
    field.options[0]?.value ||
    ""
  );
}

export function getDefaultMultiSelectValues(field: CustomFormFieldDraft) {
  return getSelectedOptionValues(field);
}

export function getPreviewDefaultValue(field: CustomFormFieldDraft): PreviewValue {
  const controlType = field.controlType.toLowerCase();

  if (controlType === "checkbox") {
    return isTruthyValue(field.defaultValue);
  }

  if (controlType === "multiselect") {
    return getDefaultMultiSelectValues(field);
  }

  if (controlType === "country" || controlType === "state") {
    return field.defaultValue || "";
  }

  if (controlType === "file") {
    return null;
  }

  if (controlType === "select" || controlType === "radio") {
    return getDefaultOptionValue(field);
  }

  return field.defaultValue || "";
}

export function buildPreviewValues(fields: CustomFormFieldDraft[]): Record<string, PreviewValue> {
  return fields.reduce<Record<string, PreviewValue>>((accumulator, field) => {
    accumulator[field.id] = getPreviewDefaultValue(field);
    return accumulator;
  }, {});
}
