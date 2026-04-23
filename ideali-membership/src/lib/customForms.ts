import { getJson, postJson } from "./api";
import type {
  CustomFormControl,
  CustomFormDraft,
  CustomFormFieldDraft,
  CustomFormOptionDraft,
} from "../types/customForms";

function getResponseData(payload: unknown) {
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

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function fetchCustomFormListItems() {
  const payload = await getJson<unknown>("/api/organizer/custom-form/list-items");
  const data = getResponseData(payload);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const candidate = item as Record<string, unknown>;
    return {
      text: asString(candidate.Text ?? candidate.text),
      value: asString(candidate.Value ?? candidate.value),
    };
  }).filter((item) => item.text && item.value);
}

export async function fetchCustomFormControls() {
  const payload = await getJson<unknown>("/api/organizer/custom-form/controls");
  const data = getResponseData(payload);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((control): CustomFormControl => {
    const candidate = control as Record<string, unknown>;
    return {
      id: asNumber(candidate.Id ?? candidate.id),
      name: asString(candidate.Name ?? candidate.name),
      controlType: asString(candidate.ControlType ?? candidate.controlType),
      iconClass: asString(candidate.IconClass ?? candidate.iconClass),
      defaultLabel: asString(candidate.DefaultLabel ?? candidate.defaultLabel),
      canBeRequired: asBoolean(candidate.CanBeRequired ?? candidate.canBeRequired),
      hasOptions: asBoolean(candidate.HasOptions ?? candidate.hasOptions),
      canHavePlaceHolder: asBoolean(candidate.CanHavePlaceHolder ?? candidate.canHavePlaceHolder),
      canHaveMinLength: asBoolean(candidate.CanHaveMinLength ?? candidate.canHaveMinLength),
      canHaveMaxLength: asBoolean(candidate.CanHaveMaxLength ?? candidate.canHaveMaxLength),
    };
  });
}

interface CustomFormOptionPayload {
  Value: string;
  DisplayText: string;
  IsDefault: boolean;
}

interface CustomFormFieldPayload {
  FormControlTypeId: number;
  DisplayOrder: number;
  ControlLabel: string;
  PlaceHolder: string | null;
  Tooltip: string | null;
  IsMandatory: boolean;
  MinLength: number | null;
  MaxLength: number | null;
  DefaultValue: string | null;
  Options: CustomFormOptionPayload[];
}

interface CustomFormPayload {
  Name: string;
  HeaderText: string;
  Description: string | null;
  LayoutColumn: number;
  Fields: CustomFormFieldPayload[];
}

function asNullableString(value: string) {
  return value.trim().length > 0 ? value : null;
}

function asNullableNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapFieldOptions(options: CustomFormOptionDraft[]) {
  return options.map((option) => ({
    Value: option.value,
    DisplayText: option.displayText,
    IsDefault: option.isDefault,
  }));
}

function mapFields(fields: CustomFormFieldDraft[]): CustomFormFieldPayload[] {
  return fields.map((field) => ({
    FormControlTypeId: field.controlId,
    DisplayOrder: field.displayOrder,
    ControlLabel: field.label,
    PlaceHolder: asNullableString(field.placeholder),
    Tooltip: asNullableString(field.tooltip),
    IsMandatory: field.required,
    MinLength: asNullableNumber(field.minLength),
    MaxLength: asNullableNumber(field.maxLength),
    DefaultValue: asNullableString(field.defaultValue),
    Options: mapFieldOptions(field.options),
  }));
}

export async function createCustomForm(
  draft: CustomFormDraft,
  fields: CustomFormFieldDraft[],
) {
  const payload: CustomFormPayload = {
    Name: draft.name.trim(),
    HeaderText: draft.headerText.trim(),
    Description: asNullableString(draft.description),
    LayoutColumn: draft.layoutColumn,
    Fields: mapFields(fields),
  };

  const response = await postJson<unknown>("/api/organizer/custom-form/create-form", payload);
  const data = getResponseData(response);

  if (typeof data === "number") {
    return data;
  }

  if (typeof data === "string" && data.length > 0 && !Number.isNaN(Number(data))) {
    return Number(data);
  }

  return 0;
}
