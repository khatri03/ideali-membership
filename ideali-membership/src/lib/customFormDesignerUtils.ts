import type { CustomFormControl, CustomFormFieldDraft, CustomFormOptionDraft } from "../types/customForms";

export function normalizeLayoutColumn(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? NaN)) {
    return 1;
  }
  return Math.max(1, Math.min(4, Math.trunc(value ?? 1)));
}

export function normalizeFieldLayoutColumn(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(1, Math.min(4, Math.trunc(value)));
}

export function getPreviewColumnSpan(field: Pick<CustomFormFieldDraft, "layoutColumn">, fallbackLayoutColumn: number): number {
  const layoutColumn = normalizeLayoutColumn(field.layoutColumn ?? fallbackLayoutColumn);
  switch (layoutColumn) {
    case 1: return 12;
    case 2: return 6;
    case 3: return 4;
    case 4: return 3;
    default: return 12;
  }
}

export function getLayoutPresetLabel(layoutColumn: number): string {
  return `1x${layoutColumn}`;
}

export function normalizeFields(fields: CustomFormFieldDraft[]): CustomFormFieldDraft[] {
  return fields.map((field, index) => ({
    ...field,
    displayOrder: index + 1,
  }));
}

export function isTruthyValue(value: string): boolean {
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

export function getCheckboxDefaultValue(value: string | null | undefined): string {
  return isTruthyValue(value ?? "") ? "true" : "false";
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

export function getSelectedOptionValues(field: Pick<CustomFormFieldDraft, "options" | "defaultValue">): string[] {
  const selectedByFlag = field.options.filter((o) => o.isDefault).map((o) => o.value);
  return selectedByFlag.length > 0 ? Array.from(new Set(selectedByFlag)) : parseDelimitedDefaultValues(field.defaultValue);
}

export function clearDefaultOption(options: CustomFormOptionDraft[], optionId: string): CustomFormOptionDraft[] {
  return options.map((option) => ({
    ...option,
    isDefault: option.id === optionId,
  }));
}

export function getDefaultOptionValue(field: Pick<CustomFormFieldDraft, "options" | "defaultValue">): string {
  return (
    field.options.find((o) => o.isDefault)?.value ||
    field.options.find((o) => o.value === field.defaultValue)?.value ||
    field.defaultValue ||
    field.options[0]?.value ||
    ""
  );
}

export function normalizeAcceptedFileTypes(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

export function toggleAcceptedFileType(acceptedFileTypes: string[], fileType: string, checked: boolean): string[] {
  return checked
    ? Array.from(new Set([...acceptedFileTypes, fileType]))
    : acceptedFileTypes.filter((v) => v !== fileType);
}

export function toSentenceCase(value: string | null | undefined): string {
  const trimmed = value?.trim() || "";
  if (!trimmed) return "Field";
  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function createFieldDraft(control: CustomFormControl, displayOrder: number): CustomFormFieldDraft {
  const hasOptions = control.hasOptions;
  const defaultOptionValue = hasOptions ? "option-1" : "";
  const defaultValue = control.controlType.toLowerCase() === "checkbox" ? "false" : defaultOptionValue;
  const label = control.defaultLabel || control.name;

  return {
    id: crypto.randomUUID(),
    uniqueId: crypto.randomUUID(),
    controlUniqueId: crypto.randomUUID(),
    controlId: control.id,
    controlName: control.name,
    controlType: control.controlType,
    iconClass: control.iconClass,
    label,
    placeholder: "",
    tooltip: "",
    required: false,
    requiredMessage: `${toSentenceCase(label)} is required.`,
    acceptedFileTypes: [],
    minLength: "",
    maxLength: "",
    defaultValue,
    displayOrder,
    layoutColumn: null,
    options: hasOptions
      ? [{ id: crypto.randomUUID(), displayText: "Option 1", value: defaultOptionValue, isDefault: true }]
      : [],
  };
}

type PreviewValue = string | string[] | boolean | null;

export function getPreviewDefaultValue(field: Pick<CustomFormFieldDraft, "controlType" | "defaultValue" | "options" | "acceptedFileTypes">): PreviewValue {
  const controlType = field.controlType.toLowerCase();
  if (controlType === "checkbox") return isTruthyValue(field.defaultValue);
  if (controlType === "multiselect") return getSelectedOptionValues(field);
  if (controlType === "country" || controlType === "state") return field.defaultValue || "";
  if (controlType === "file") return null;
  if (controlType === "select" || controlType === "radio") return getDefaultOptionValue(field);
  return field.defaultValue || "";
}

export function buildPreviewValues(fields: CustomFormFieldDraft[]): Record<string, PreviewValue> {
  return fields.reduce<Record<string, PreviewValue>>((acc, field) => {
    acc[field.id] = getPreviewDefaultValue(field);
    return acc;
  }, {});
}

export function getRowBoundsForIndex(
  fieldList: CustomFormFieldDraft[],
  targetIndex: number,
  formLayoutColumn: number,
): { start: number; end: number } {
  let col = 0;
  let rowStart = 0;

  for (let i = 0; i < fieldList.length; i++) {
    const field = fieldList[i];
    if (!field) continue;
    const span = getPreviewColumnSpan(field, formLayoutColumn);

    if (i > 0 && col + span > 12) {
      if (targetIndex < i) {
        return { start: rowStart, end: i - 1 };
      }
      rowStart = i;
      col = span;
    } else {
      col += span;
    }
  }

  return { start: rowStart, end: fieldList.length - 1 };
}
