import { getJson, postJson } from "./api";
import type {
  CustomFormControl,
  CustomFormDraft,
  CustomFormFieldDraft,
  CustomFormOptionDraft,
  CustomFormPreview,
  CustomFormSummary,
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

function asOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

export async function fetchCustomForms() {
  const payload = await getJson<unknown>("/api/organizer/custom-form/list");
  const data = getResponseData(payload);

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item): CustomFormSummary => {
      const candidate = item as Record<string, unknown>;
      return {
        id: asNumber(candidate.Id ?? candidate.id),
        uniqueId: asString(candidate.UniqueId ?? candidate.uniqueId),
        name: asString(candidate.Name ?? candidate.name),
        headerText: asString(candidate.HeaderText ?? candidate.headerText),
        description: asString(candidate.Description ?? candidate.description) || null,
      };
    })
    .filter((item) => item.uniqueId && item.name);
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

export async function fetchCustomFormPreview(customFormUniqueId: string) {
  const payload = await getJson<unknown>(`/api/organizer/custom-form/${customFormUniqueId}`);
  const data = getResponseData(payload) as Record<string, unknown> | null;

  if (!data) {
    throw new Error("Unexpected custom form response.");
  }

  const fields = Array.isArray(data.Fields ?? data.fields)
    ? ((data.Fields ?? data.fields) as unknown[]).map((field) => {
        const candidate = field as Record<string, unknown>;
        const controlCandidate = (candidate.FormControl ?? candidate.formControl) as Record<string, unknown> | null;
        const options = Array.isArray(candidate.Options ?? candidate.options)
          ? ((candidate.Options ?? candidate.options) as unknown[]).map((option) => {
              const optionCandidate = option as Record<string, unknown>;

              return {
                id: asNumber(optionCandidate.Id ?? optionCandidate.id),
                value: asString(optionCandidate.Value ?? optionCandidate.value),
                displayText: asString(optionCandidate.DisplayText ?? optionCandidate.displayText),
              };
            })
          : [];

        return {
          id: asNumber(candidate.Id ?? candidate.id),
          uniqueId: asString(candidate.UniqueId ?? candidate.uniqueId),
          formId: asNumber(candidate.FormId ?? candidate.formId),
          formControlTypeId: asNumber(candidate.FormControlTypeId ?? candidate.formControlTypeId),
          controlUniqueId: asString(candidate.ControlUniqueId ?? candidate.controlUniqueId) || null,
          displayOrder: asNumber(candidate.DisplayOrder ?? candidate.displayOrder),
          controlLabel: asString(candidate.ControlLabel ?? candidate.controlLabel),
          placeHolder: asString(candidate.PlaceHolder ?? candidate.placeHolder) || null,
          tooltip: asString(candidate.Tooltip ?? candidate.tooltip) || null,
          isMandatory: asBoolean(candidate.IsMandatory ?? candidate.isMandatory),
          requiredMessage: asString(candidate.RequiredMessage ?? candidate.requiredMessage) || null,
          minLength: asOptionalNumber(candidate.MinLength ?? candidate.minLength),
          maxLength: asOptionalNumber(candidate.MaxLength ?? candidate.maxLength),
          defaultValue: asString(candidate.DefaultValue ?? candidate.defaultValue) || null,
          options,
          formControl: controlCandidate
            ? {
                id: asNumber(controlCandidate.Id ?? controlCandidate.id),
                name: asString(controlCandidate.Name ?? controlCandidate.name),
                canBeRequired: asBoolean(controlCandidate.CanBeRequired ?? controlCandidate.canBeRequired),
                canHaveMaxLength: asBoolean(controlCandidate.CanHaveMaxLength ?? controlCandidate.canHaveMaxLength),
                canHaveMinLength: asBoolean(controlCandidate.CanHaveMinLength ?? controlCandidate.canHaveMinLength),
                canHavePlaceHolder: asBoolean(controlCandidate.CanHavePlaceHolder ?? controlCandidate.canHavePlaceHolder),
                controlType: asString(controlCandidate.ControlType ?? controlCandidate.controlType),
                defaultLabel: asString(controlCandidate.DefaultLabel ?? controlCandidate.defaultLabel),
                hasOptions: asBoolean(controlCandidate.HasOptions ?? controlCandidate.hasOptions),
                iconClass: asString(controlCandidate.IconClass ?? controlCandidate.iconClass),
              }
            : null,
        };
      })
    : [];

  return {
    uniqueId: asString(data.UniqueId ?? data.uniqueId),
    name: asString(data.Name ?? data.name),
    headerText: asString(data.HeaderText ?? data.headerText),
    description: asString(data.Description ?? data.description) || null,
    layoutColumn: Math.max(1, Math.min(4, asNumber(data.LayoutColumn ?? data.layoutColumn) || 1)),
    fields,
  } satisfies CustomFormPreview;
}

interface CustomFormOptionPayload {
  Value: string;
  DisplayText: string;
  IsDefault: boolean;
}

interface CustomFormFieldPayload {
  UniqueId: string;
  ControlUniqueId: string;
  FormControlTypeId: number;
  DisplayOrder: number;
  ControlLabel: string;
  PlaceHolder: string | null;
  Tooltip: string | null;
  IsMandatory: boolean;
  RequiredMessage: string | null;
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
    UniqueId: field.uniqueId,
    ControlUniqueId: field.controlUniqueId,
    FormControlTypeId: field.controlId,
    DisplayOrder: field.displayOrder,
    ControlLabel: field.label,
    PlaceHolder: asNullableString(field.placeholder),
    Tooltip: asNullableString(field.tooltip),
    IsMandatory: field.required,
    RequiredMessage: asNullableString(field.requiredMessage),
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

export async function updateCustomForm(
  customFormUniqueId: string,
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

  const response = await fetch(`/api/organizer/custom-form/${customFormUniqueId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as { message?: string; error?: string } | null)?.message
      ?? (data as { message?: string; error?: string } | null)?.error
      ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  const responseData = getResponseData(data);

  if (typeof responseData === "number") {
    return responseData;
  }

  if (typeof responseData === "string" && responseData.length > 0 && !Number.isNaN(Number(responseData))) {
    return Number(responseData);
  }

  return 0;
}
