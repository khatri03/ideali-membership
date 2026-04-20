import { getJson } from "./api";
import type { CustomFormControl } from "../types/customForms";

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
