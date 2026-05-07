import { getJson, postFormData } from "./api";
import type { MembershipRegistrationStripeCredentials } from "../types/membershipRegistration";

const PAYMENT_PRODUCT_NAME_TO_ID: Record<string, number> = {
  CreditCard: 1,
  ElectronicCheck: 2,
  Cheque: 3,
  Ach: 4,
  Pad: 5,
  TapToPay: 6,
  WalletPay: 7,
};

export function resolvePaymentProductId(name: string) {
  return PAYMENT_PRODUCT_NAME_TO_ID[name] ?? null;
}

let contactPrefixOptionsCache: Array<{ label: string; value: string }> | null = null;
let contactPrefixOptionsRequest: Promise<Array<{ label: string; value: string }>> | null = null;
let addressTypeOptionsCache: Array<{ label: string; value: string }> | null = null;
let addressTypeOptionsRequest: Promise<Array<{ label: string; value: string }>> | null = null;

export function readResponseData(payload: unknown) {
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

export function readText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readScalar(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

export function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

export async function uploadMembershipProfilePhoto(membershipTypeUniqueId: string, file: File | null) {
  if (!file) {
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  const payload = await postFormData<unknown>(`/api/membership/${membershipTypeUniqueId}/profile-photo`, formData);
  return readNumber(readResponseData(payload));
}

export function readPaymentProducts(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          name: item,
          displayName: item,
        };
      }

      if (typeof item === "number" && Number.isFinite(item)) {
        const name = Object.keys(PAYMENT_PRODUCT_NAME_TO_ID).find((key) => PAYMENT_PRODUCT_NAME_TO_ID[key] === item) ?? String(item);
        return {
          name,
          displayName: name,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const name = readText((item as { name?: unknown; Name?: unknown }).name ?? (item as { name?: unknown; Name?: unknown }).Name);
      const displayName = readText(
        (item as { displayName?: unknown; DisplayName?: unknown }).displayName ??
          (item as { displayName?: unknown; DisplayName?: unknown }).DisplayName
      );

      if (!name) {
        return null;
      }

      return {
        name,
        displayName: displayName || name,
      };
    })
    .filter(
      (item): item is {
        name: string;
        displayName: string;
      } => item !== null
    );
}

export function readStripeCredentials(value: unknown): MembershipRegistrationStripeCredentials | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const publishableKey = readText(candidate.PublishableKey ?? candidate.publishableKey);
  const stripeAccount = readText(candidate.StripeAccount ?? candidate.stripeAccount);

  if (!publishableKey || !stripeAccount) {
    return null;
  }

  return {
    publishableKey,
    stripeAccount,
  };
}

export async function fetchContactPrefixOptions() {
  if (contactPrefixOptionsCache) {
    return contactPrefixOptionsCache;
  }

  if (contactPrefixOptionsRequest) {
    return contactPrefixOptionsRequest;
  }

  contactPrefixOptionsRequest = (async () => {
    const payload = await getJson<unknown>("/api/admin/list-items/contact-prefixes");
    const data = readResponseData(payload);

    if (!Array.isArray(data)) {
      return [];
    }

    const options = data
      .map((item) => {
        if (typeof item === "string") {
          const value = item.trim();
          return value ? { value, label: value } : null;
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const value =
          candidate.Value ??
          candidate.value ??
          candidate.Id ??
          candidate.id ??
          candidate.Code ??
          candidate.code ??
          candidate.Enum ??
          candidate.enum ??
          candidate.Prefix ??
          candidate.prefix ??
          candidate.Name ??
          candidate.name;
        const label =
          candidate.Text ??
          candidate.text ??
          candidate.DisplayText ??
          candidate.displayText ??
          candidate.Label ??
          candidate.label ??
          candidate.prefix_name ??
          candidate.prefixName ??
          candidate.Name ??
          candidate.name ??
          value;

        const resolvedValue = value == null ? "" : String(value).trim();
        const resolvedLabel = label == null ? "" : String(label).trim();

        return resolvedValue && resolvedLabel ? { value: resolvedValue, label: resolvedLabel } : null;
      })
      .filter((item): item is { label: string; value: string } => item !== null);

    contactPrefixOptionsCache = options;
    return options;
  })();

  try {
    return await contactPrefixOptionsRequest;
  } finally {
    contactPrefixOptionsRequest = null;
  }
}

export async function fetchAddressTypeOptions() {
  if (addressTypeOptionsCache) {
    return addressTypeOptionsCache;
  }

  if (addressTypeOptionsRequest) {
    return addressTypeOptionsRequest;
  }

  addressTypeOptionsRequest = (async () => {
    const payload = await getJson<unknown>("/api/admin/list-items/address-types");
    const data = readResponseData(payload);

    if (!Array.isArray(data)) {
      return [];
    }

    const options = data
      .map((item) => {
        if (typeof item === "string") {
          const value = item.trim();
          return value ? { value, label: value } : null;
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const value =
          candidate.Value ??
          candidate.value ??
          candidate.Id ??
          candidate.id ??
          candidate.Code ??
          candidate.code ??
          candidate.Enum ??
          candidate.enum ??
          candidate.Type ??
          candidate.type ??
          candidate.Name ??
          candidate.name;
        const label =
          candidate.Text ??
          candidate.text ??
          candidate.DisplayText ??
          candidate.displayText ??
          candidate.Label ??
          candidate.label ??
          candidate.Name ??
          candidate.name ??
          value;

        const resolvedValue = value == null ? "" : String(value).trim();
        const resolvedLabel = label == null ? "" : String(label).trim();

        return resolvedValue && resolvedLabel ? { value: resolvedValue, label: resolvedLabel } : null;
      })
      .filter((item): item is { label: string; value: string } => item !== null);

    addressTypeOptionsCache = options;
    return options;
  })();

  try {
    return await addressTypeOptionsRequest;
  } finally {
    addressTypeOptionsRequest = null;
  }
}

export function readCustomForms(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const fields = Array.isArray(record.Fields ?? record.fields) ? (record.Fields ?? record.fields) as unknown[] : [];
      const parsedFields = fields
        .map((field) => {
          if (!field || typeof field !== "object") {
            return null;
          }

          const fieldRecord = field as Record<string, unknown>;
          const options = Array.isArray(fieldRecord.Options ?? fieldRecord.options)
            ? ((fieldRecord.Options ?? fieldRecord.options) as unknown[])
                .map((option) => {
                  if (!option || typeof option !== "object") {
                    return null;
                  }

                  const optionRecord = option as Record<string, unknown>;

                  return {
                    uniqueId: readText(optionRecord.UniqueId ?? optionRecord.uniqueId),
                    displayText: readText(optionRecord.DisplayText ?? optionRecord.displayText),
                    value: readText(optionRecord.Value ?? optionRecord.value),
                    isDefault: readBoolean(optionRecord.IsDefault ?? optionRecord.isDefault),
                  };
                })
                .filter(
                  (
                    option,
                  ): option is {
                    uniqueId: string;
                    displayText: string;
                    value: string;
                    isDefault: boolean;
                  } => option !== null,
                )
            : [];

          return {
            uniqueId: readText(fieldRecord.UniqueId ?? fieldRecord.uniqueId),
            formId: readNumber(fieldRecord.FormId ?? fieldRecord.formId) ?? 0,
            formControlTypeId: readNumber(fieldRecord.FormControlTypeId ?? fieldRecord.formControlTypeId) ?? 0,
            controlUniqueId: readText(fieldRecord.ControlUniqueId ?? fieldRecord.controlUniqueId) || null,
            displayOrder: readNumber(fieldRecord.DisplayOrder ?? fieldRecord.displayOrder) ?? 0,
            layoutColumn: (() => {
              const fieldLayoutColumn = readNumber(fieldRecord.LayoutColumn ?? fieldRecord.layoutColumn);
              return fieldLayoutColumn === null ? null : Math.max(1, Math.min(4, fieldLayoutColumn));
            })(),
            controlLabel: readText(fieldRecord.ControlLabel ?? fieldRecord.controlLabel),
            placeHolder: readText(fieldRecord.PlaceHolder ?? fieldRecord.placeHolder) || null,
            tooltip: readText(fieldRecord.Tooltip ?? fieldRecord.tooltip) || null,
            isMandatory: readBoolean(fieldRecord.IsMandatory ?? fieldRecord.isMandatory),
            requiredMessage: readText(fieldRecord.RequiredMessage ?? fieldRecord.requiredMessage) || null,
            acceptedFileTypes: readText(fieldRecord.AcceptedFileTypes ?? fieldRecord.acceptedFileTypes) || null,
            minLength: readNumber(fieldRecord.MinLength ?? fieldRecord.minLength),
            maxLength: readNumber(fieldRecord.MaxLength ?? fieldRecord.maxLength),
            defaultValue: readText(fieldRecord.DefaultValue ?? fieldRecord.defaultValue) || null,
            options,
          };
        })
        .filter(
          (
            field,
          ): field is {
            uniqueId: string;
            formId: number;
            formControlTypeId: number;
            controlUniqueId: string | null;
            displayOrder: number;
            layoutColumn: number | null;
            controlLabel: string;
            placeHolder: string | null;
            tooltip: string | null;
            isMandatory: boolean;
            requiredMessage: string | null;
            acceptedFileTypes: string | null;
            minLength: number | null;
            maxLength: number | null;
            defaultValue: string | null;
            options: Array<{
              uniqueId: string;
              displayText: string;
              value: string;
              isDefault: boolean;
            }>;
          } => field !== null,
        );

      return {
        uniqueId: readText(record.UniqueId ?? record.uniqueId),
        name: readText(record.Name ?? record.name),
        description: readText(record.Description ?? record.description),
        headerText: readText(record.HeaderText ?? record.headerText),
        layoutColumn: (() => {
          const layoutColumn = readNumber(record.LayoutColumn ?? record.layoutColumn);
          return layoutColumn === null ? null : Math.max(1, Math.min(4, layoutColumn));
        })(),
        fieldCount: parsedFields.length,
        fields: parsedFields,
      };
    })
    .filter((item): item is {
      uniqueId: string;
      name: string;
      description: string;
      headerText: string;
      layoutColumn: number | null;
      fieldCount: number;
      fields: Array<{
        uniqueId: string;
        formId: number;
        formControlTypeId: number;
        controlUniqueId: string | null;
        displayOrder: number;
        layoutColumn: number | null;
        controlLabel: string;
        placeHolder: string | null;
        tooltip: string | null;
        isMandatory: boolean;
        requiredMessage: string | null;
        acceptedFileTypes: string | null;
        minLength: number | null;
        maxLength: number | null;
        defaultValue: string | null;
        options: Array<{
          uniqueId: string;
          displayText: string;
          value: string;
          isDefault: boolean;
        }>;
      }>;
    } => item !== null);
}

export function readCustomQuestions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const options = Array.isArray(record.Options ?? record.options)
        ? ((record.Options ?? record.options) as unknown[])
            .map((option) => {
              if (!option || typeof option !== "object") {
                return null;
              }

              const optionRecord = option as Record<string, unknown>;

              return {
                uniqueId: readText(optionRecord.UniqueId ?? optionRecord.uniqueId),
                displayText: readText(optionRecord.DisplayText ?? optionRecord.displayText),
                value: readText(optionRecord.Value ?? optionRecord.value),
                isDefault: readBoolean(optionRecord.IsDefault ?? optionRecord.isDefault),
              };
            })
            .filter(
              (option): option is {
                uniqueId: string;
                displayText: string;
                value: string;
                isDefault: boolean;
              } => option !== null,
            )
        : [];

      return {
        uniqueId: readText(record.UniqueId ?? record.uniqueId),
        controlId: readNumber(record.ControlId ?? record.controlId) ?? 0,
        controlName: readText(record.ControlName ?? record.controlName),
        controlType: readText(record.ControlType ?? record.controlType),
        iconClass: readText(record.IconClass ?? record.iconClass),
        label: readText(record.Label ?? record.label),
        placeHolder: readText(record.PlaceHolder ?? record.placeHolder) || null,
        tooltip: readText(record.Tooltip ?? record.tooltip) || null,
        required: readBoolean(record.Required ?? record.required),
        requiredMessage: readText(record.RequiredMessage ?? record.requiredMessage) || null,
        acceptedFileTypes: readText(record.AcceptedFileTypes ?? record.acceptedFileTypes) || null,
        minLength: readText(record.MinLength ?? record.minLength) || null,
        maxLength: readText(record.MaxLength ?? record.maxLength) || null,
        defaultValue: readText(record.DefaultValue ?? record.defaultValue) || null,
        displayOrder: readNumber(record.DisplayOrder ?? record.displayOrder) ?? 0,
        options,
      };
    })
    .filter(
      (item): item is {
        uniqueId: string;
        controlId: number;
        controlName: string;
        controlType: string;
        iconClass: string;
        label: string;
        placeHolder: string | null;
        tooltip: string | null;
        required: boolean;
        requiredMessage: string | null;
        acceptedFileTypes: string | null;
        minLength: string | null;
        maxLength: string | null;
        defaultValue: string | null;
        displayOrder: number;
        options: Array<{
          uniqueId: string;
          displayText: string;
          value: string;
          isDefault: boolean;
        }>;
      } => item !== null,
    );
}


