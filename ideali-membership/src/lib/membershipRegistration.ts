import { getJson, postFormData, postJson } from "./api";
import { readResponseData, readText, readNumber } from "./parseUtils";
import type {
  DiscountCouponValidationResult,
  MembershipRegistrationFormState,
  MembershipRegistrationCustomFormResponse,
  MembershipRegistrationCustomQuestionResponse,
  MembershipRegistrationInfo,
  MembershipRegistrationPaymentMethodDetail,
  MembershipRegistrationPaymentProduct,
  MembershipRegistrationStripeCredentials,
  MembershipRegistrationSubmitContext,
} from "../types/membershipRegistration";

const PAYMENT_PRODUCT_NAME_TO_ID: Record<string, number> = {
  CreditCard: 1,
  ElectronicCheck: 2,
  Cheque: 3,
  Ach: 4,
  Pad: 5,
  TapToPay: 6,
  WalletPay: 7,
};

let contactPrefixOptionsCache: Array<{ label: string; value: string }> | null = null;
let contactPrefixOptionsRequest: Promise<Array<{ label: string; value: string }>> | null = null;
let addressTypeOptionsCache: Array<{ label: string; value: string }> | null = null;
let addressTypeOptionsRequest: Promise<Array<{ label: string; value: string }>> | null = null;

function readScalar(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function readBoolean(value: unknown) {
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

function readPaymentProducts(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return {
          name: item.trim(),
          displayName: item.trim(),
        };
      }

      if (typeof item === "number" && Number.isFinite(item)) {
        const name = Object.entries(PAYMENT_PRODUCT_NAME_TO_ID).find(([, value]) => value === item)?.[0];
        return name
          ? {
              name,
              displayName: name,
            }
          : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = readText(record.Name ?? record.name);
      const displayName = readText(record.DisplayName ?? record.displayName) || name;

      return name
        ? {
            name,
            displayName,
          }
        : null;
    })
    .filter((item): item is MembershipRegistrationPaymentProduct => item !== null);
}

function readPresetTips(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const percent = readNumber(record.Percent ?? record.percent);
      if (percent === null) {
        return null;
      }

      return {
        percent,
        isDefault: readBoolean(record.IsDefault ?? record.isDefault),
      };
    })
    .filter((item): item is MembershipRegistrationInfo["presetTips"][number] => item !== null);
}

function appendFormDataValue(formData: FormData, key: string, value: unknown) {
  if (value === null || value === undefined) {
    return;
  }

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      formData.append(key, String(value));
    }
    return;
  }

  const text = String(value).trim();
  if (text) {
    formData.append(key, text);
  }
}

function appendAddressFormData(formData: FormData, prefix: string, address: Record<string, unknown> | null | undefined) {
  if (!address) {
    return;
  }

  appendFormDataValue(formData, `${prefix}.StreetLine1`, address.StreetLine1 ?? address.streetLine1);
  appendFormDataValue(formData, `${prefix}.StreetLine2`, address.StreetLine2 ?? address.streetLine2);
  appendFormDataValue(formData, `${prefix}.ZipCode`, address.ZipCode ?? address.zipCode);
}

function appendInvoiceItem(formData: FormData, index: number, item: Record<string, unknown>) {
  appendFormDataValue(formData, `InvoiceDetail.InvoiceItems[${index}].Description`, item.description ?? item.Description);
  appendFormDataValue(formData, `InvoiceDetail.InvoiceItems[${index}].Quantity`, item.quantity ?? item.Quantity);
  appendFormDataValue(formData, `InvoiceDetail.InvoiceItems[${index}].UnitPrice`, item.unitPrice ?? item.UnitPrice);
  appendFormDataValue(formData, `InvoiceDetail.InvoiceItems[${index}].ItemType`, item.itemType ?? item.ItemType);
}

function appendPaymentMethodDetail(
  formData: FormData,
  paymentMethodDetail: MembershipRegistrationPaymentMethodDetail | null,
) {
  if (!paymentMethodDetail) {
    return;
  }

  appendFormDataValue(
    formData,
    "InvoiceDetail.PaymentMethodDetail.PaymentMethodId",
    paymentMethodDetail.paymentMethodId,
  );
  appendFormDataValue(
    formData,
    "InvoiceDetail.PaymentMethodDetail.CardHolderName",
    paymentMethodDetail.cardHolderName ?? null,
  );
}

function appendCustomFormResponses(
  formData: FormData,
  responses: MembershipRegistrationCustomFormResponse[],
) {
  responses.forEach((response, index) => {
    appendFormDataValue(formData, `CustomFormResponses[${index}].FieldId`, response.fieldId);
    appendFormDataValue(formData, `CustomFormResponses[${index}].Value`, response.value);
  });
}

function appendCustomQuestionResponses(
  formData: FormData,
  responses: MembershipRegistrationCustomQuestionResponse[],
) {
  responses.forEach((response, index) => {
    appendFormDataValue(formData, `CustomQuestionResponses[${index}].QuestionUniqueId`, response.questionUniqueId);
    appendFormDataValue(formData, `CustomQuestionResponses[${index}].OptionUniqueId`, response.optionUniqueId ?? null);
    appendFormDataValue(formData, `CustomQuestionResponses[${index}].FileStorageId`, response.fileStorageId ?? null);
    appendFormDataValue(formData, `CustomQuestionResponses[${index}].Value`, response.value ?? null);
  });
}

export function resolvePaymentProductId(value: string) {
  return PAYMENT_PRODUCT_NAME_TO_ID[value] ?? null;
}

export async function fetchStripePublicCredentials(paymentAccountUniqueId: string) {
  const payload = await getJson<unknown>(`/api/public/stripe/${paymentAccountUniqueId}/credentials`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const publishableKey = readText(responseData?.PublishableKey ?? responseData?.publishableKey);
  const stripeAccount = readText(responseData?.StripeAccount ?? responseData?.stripeAccount);

  if (!publishableKey || !stripeAccount) {
    throw new Error("Unable to load Stripe credentials.");
  }

  return {
    publishableKey,
    stripeAccount,
  } satisfies MembershipRegistrationStripeCredentials;
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

function readCustomForms(value: unknown) {
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
            id: readNumber(fieldRecord.Id ?? fieldRecord.id) ?? 0,
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
            id: number;
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
        id: number;
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

function readCustomQuestions(value: unknown) {
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

export async function getMembershipRegistrationInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(`/api/membership/${membershipTypeUniqueId}/register`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const membershipDetailRecord = (responseData?.MembershipDetail ?? responseData?.membershipDetail) as
    | Record<string, unknown>
    | undefined;
  const paymentSettingsRecord = (responseData?.PaymentSettings ?? responseData?.paymentSettings) as
    | Record<string, unknown>
    | undefined;

  const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId) || membershipTypeUniqueId;
  const organizerName = readText(responseData?.OrganizerName ?? responseData?.organizerName);
  const registrationStartDateUtc = readText(
    responseData?.RegistrationStartDateUtc ?? responseData?.registrationStartDateUtc,
  );
  const registrationEndDateUtc = readText(
    responseData?.RegistrationEndDateUtc ?? responseData?.registrationEndDateUtc,
  );
  const registrationState = readText(responseData?.RegistrationState ?? responseData?.registrationState) || "Unavailable";
  const canRegister = readBoolean(responseData?.CanRegister ?? responseData?.canRegister);
  const discountsEnabled = readBoolean(
    responseData?.DiscountsEnabled ?? responseData?.discountsEnabled
      ?? membershipDetailRecord?.DiscountsEnabled ?? membershipDetailRecord?.discountsEnabled
  );
  const hasActiveCoupons = readBoolean(
    responseData?.HasActiveCoupons ?? responseData?.hasActiveCoupons
  );
  const membershipDetailUniqueId = readText(membershipDetailRecord?.UniqueId ?? membershipDetailRecord?.uniqueId) || uniqueId;
  const name = readText(membershipDetailRecord?.Name ?? membershipDetailRecord?.name);
  const description = readText(membershipDetailRecord?.Description ?? membershipDetailRecord?.description);
  const tenure = readScalar(membershipDetailRecord?.Tenure ?? membershipDetailRecord?.tenure);
  const expiresCalendarYear = readBoolean(
    membershipDetailRecord?.ExpiresCalendarYear ?? membershipDetailRecord?.expiresCalendarYear,
  );
  const customExpiryDate = readText(membershipDetailRecord?.CustomExpiryDate ?? membershipDetailRecord?.customExpiryDate);
  const annualExpiryMonth = readNumber(
    membershipDetailRecord?.AnnualExpiryMonth ?? membershipDetailRecord?.annualExpiryMonth,
  );
  const annualExpiryDay = readNumber(
    membershipDetailRecord?.AnnualExpiryDay ?? membershipDetailRecord?.annualExpiryDay,
  );
  const customExpiryDays = readNumber(
    membershipDetailRecord?.CustomExpiryDays ?? membershipDetailRecord?.customExpiryDays,
  );
  const isFree = readBoolean(membershipDetailRecord?.IsFree ?? membershipDetailRecord?.isFree);
  const membershipCharges = readNumber(
    membershipDetailRecord?.MembershipCharges ?? membershipDetailRecord?.membershipCharges,
  );
  const allowPartialPayment = readBoolean(
    membershipDetailRecord?.AllowPartialPayment ?? membershipDetailRecord?.allowPartialPayment,
  );
  const color = readText(membershipDetailRecord?.Color ?? membershipDetailRecord?.color);
  const customForms = readCustomForms(membershipDetailRecord?.CustomForms ?? membershipDetailRecord?.customForms);
  const customQuestions = readCustomQuestions(
    membershipDetailRecord?.CustomQuestions ?? membershipDetailRecord?.customQuestions,
  );

  const paymentAccountId = readNumber(
    paymentSettingsRecord?.PaymentAccountId ?? paymentSettingsRecord?.paymentAccountId,
  );
  const paymentAccountUniqueId = readText(
    paymentSettingsRecord?.PaymentAccountUniqueId ?? paymentSettingsRecord?.paymentAccountUniqueId,
  );
  const accountName = readText(paymentSettingsRecord?.AccountName ?? paymentSettingsRecord?.accountName);
  const merchantName = readScalar(paymentSettingsRecord?.MerchantName ?? paymentSettingsRecord?.merchantName) ?? "";
  const paymentCurrencyCode = readText(
    paymentSettingsRecord?.PaymentCurrencyCode ?? paymentSettingsRecord?.paymentCurrencyCode,
  );
  const paymentCurrencySymbol = readText(
    paymentSettingsRecord?.PaymentCurrencySymbol ?? paymentSettingsRecord?.paymentCurrencySymbol,
  );
  const paymentProducts = readPaymentProducts(
    paymentSettingsRecord?.PaymentProducts ?? paymentSettingsRecord?.paymentProducts,
  );
  const presetTips = readPresetTips(responseData?.PresetTips ?? responseData?.presetTips);

  if (!name) {
    throw new Error("Unexpected membership registration response.");
  }

  return {
    uniqueId,
    organizerName,
    registrationStartDateUtc: registrationStartDateUtc || null,
    registrationEndDateUtc: registrationEndDateUtc || null,
    registrationState: (registrationState as MembershipRegistrationInfo["registrationState"]) || "Unavailable",
    canRegister,
    discountsEnabled,
    hasActiveCoupons,
    membershipDetail: {
      uniqueId: membershipDetailUniqueId || uniqueId,
      name,
      description,
      organizerName,
      tenure,
      expiresCalendarYear,
      customExpiryDate: customExpiryDate || null,
      annualExpiryMonth,
      annualExpiryDay,
      customExpiryDays,
      isFree,
      membershipCharges,
      allowPartialPayment,
      discountsEnabled,
      color: color || null,
      customForms,
      customQuestions,
    },
    paymentSettings: {
      paymentAccountId,
      paymentAccountUniqueId: paymentAccountUniqueId || null,
      accountName,
      merchantName,
      paymentCurrencyCode: paymentCurrencyCode || null,
      paymentCurrencySymbol: paymentCurrencySymbol || null,
      paymentProducts,
    },
    presetTips,
    taxSettings: (responseData?.TaxSettings ?? responseData?.taxSettings ?? null) as Record<string, unknown> | null,
  } satisfies MembershipRegistrationInfo;
}

export async function submitMembershipRegistration(
  membershipTypeUniqueId: string,
  formState: MembershipRegistrationFormState,
  membershipCharges: number,
  paymentMethod: number | null,
  submissionContext: MembershipRegistrationSubmitContext,
) {
  const amount = Number.isFinite(membershipCharges) ? membershipCharges : 0;
  const tipTotal = (() => {
    const parsedTipAmount = Number(formState.tipAmount.replace(/,/g, "").trim());
    return Number.isFinite(parsedTipAmount) && parsedTipAmount > 0 ? parsedTipAmount : 0;
  })();
  const discountAmount = submissionContext.discountAmount ?? 0;
  const finalAmount = amount - discountAmount + tipTotal;
  const amountBreakdown = {
    membershipAmount: amount,
    discountAmount,
    finalAmount: amount - discountAmount,
    tipAmount: tipTotal,
    applicationFeeAmount: tipTotal,
    totalAmount: finalAmount,
  };
  const trimmedPrefix = formState.prefix.trim();
  const trimmedStreetLine1 = formState.streetLine1.trim();
  const trimmedStreetLine2 = formState.streetLine2.trim();
  const trimmedZipCode = formState.zipCode.trim();
  const trimmedCityName = formState.cityName.trim();
  const trimmedAddressType = formState.addressType.trim();
  const countryId = formState.countryId.trim();
  const stateId = formState.stateId.trim();
  const parsedCountryId = countryId && Number.isFinite(Number(countryId)) ? Number(countryId) : null;
  const parsedStateId = stateId && Number.isFinite(Number(stateId)) ? Number(stateId) : null;
  const formData = new FormData();
  appendFormDataValue(formData, "AvatarFile", formState.profilePhotoFile);

  appendFormDataValue(formData, "ContactInfo.Prefix", trimmedPrefix || null);
  appendFormDataValue(formData, "ContactInfo.FirstName", formState.firstName.trim());
  appendFormDataValue(formData, "ContactInfo.MiddleName", formState.middleName.trim());
  appendFormDataValue(formData, "ContactInfo.LastName", formState.lastName.trim());
  appendFormDataValue(formData, "ContactInfo.PrimaryEmail", formState.email.trim());
  appendFormDataValue(formData, "ContactInfo.CellPhone", formState.cellPhone.trim());
  appendAddressFormData(formData, "ContactInfo.Address", {
    StreetLine1: trimmedStreetLine1 || null,
    StreetLine2: trimmedStreetLine2 || null,
    ZipCode: trimmedZipCode || null,
  });

  appendFormDataValue(formData, "UserInfo.Email", formState.email.trim());
  appendFormDataValue(formData, "UserInfo.Password", formState.password);
  appendFormDataValue(formData, "UserInfo.ConfirmPassword", formState.confirmPassword);

  appendAddressFormData(formData, "AddressInfo", {
    StreetLine1: trimmedStreetLine1 || null,
    StreetLine2: trimmedStreetLine2 || null,
    ZipCode: trimmedZipCode || null,
  });
  appendFormDataValue(formData, "AddressInfo.AddressType", trimmedAddressType || null);
  appendFormDataValue(formData, "AddressInfo.CityName", trimmedCityName || null);
  appendFormDataValue(formData, "AddressInfo.CountryId", parsedCountryId);
  appendFormDataValue(formData, "AddressInfo.StateId", parsedStateId);

  appendFormDataValue(formData, "InvoiceDetail.InvoiceAmount", finalAmount);
  appendFormDataValue(formData, "InvoiceDetail.AmountBreakdown.MembershipAmount", amount);
  appendFormDataValue(formData, "InvoiceDetail.AmountBreakdown.DiscountAmount", discountAmount);
  appendFormDataValue(formData, "InvoiceDetail.AmountBreakdown.FinalAmount", amount - discountAmount);
  appendFormDataValue(formData, "InvoiceDetail.AmountBreakdown.TipAmount", tipTotal);
  appendFormDataValue(
    formData,
    "InvoiceDetail.AmountBreakdown.ApplicationFeeAmount",
    tipTotal,
  );
  appendFormDataValue(formData, "InvoiceDetail.AmountBreakdown.TotalAmount", finalAmount);
  appendFormDataValue(formData, "InvoiceDetail.PaymentMethod", paymentMethod);
  appendFormDataValue(formData, "InvoiceDetail.Notes", formState.notes.trim());
  appendFormDataValue(formData, "CouponUniqueId", submissionContext.couponUniqueId);
  appendPaymentMethodDetail(formData, submissionContext.paymentMethodDetail);
  appendCustomFormResponses(formData, submissionContext.customFormResponses);
  appendCustomQuestionResponses(formData, submissionContext.customQuestionResponses);

  const payloadPreview = {
    membershipTypeUniqueId,
    AvatarFile: formState.profilePhotoFile
      ? {
          name: formState.profilePhotoFile.name,
          type: formState.profilePhotoFile.type,
          size: formState.profilePhotoFile.size,
          lastModified: formState.profilePhotoFile.lastModified,
        }
      : null,
    ContactInfo: {
      Prefix: trimmedPrefix || null,
      FirstName: formState.firstName.trim(),
      MiddleName: formState.middleName.trim(),
      LastName: formState.lastName.trim(),
      PrimaryEmail: formState.email.trim(),
      CellPhone: formState.cellPhone.trim(),
      Address: {
        StreetLine1: trimmedStreetLine1 || null,
        StreetLine2: trimmedStreetLine2 || null,
        ZipCode: trimmedZipCode || null,
      },
    },
    UserInfo: {
      Email: formState.email.trim(),
      Password: formState.password,
      ConfirmPassword: formState.confirmPassword,
    },
    AddressInfo: {
      AddressType: trimmedAddressType || null,
      StreetLine1: trimmedStreetLine1 || null,
      StreetLine2: trimmedStreetLine2 || null,
      ZipCode: trimmedZipCode || null,
      CityName: trimmedCityName || null,
      CountryId: parsedCountryId,
      StateId: parsedStateId,
    },
    InvoiceDetail: {
      InvoiceAmount: finalAmount,
      AmountBreakdown: amountBreakdown,
      PaymentMethod: paymentMethod,
      Notes: formState.notes.trim(),
      PaymentMethodDetail: submissionContext.paymentMethodDetail,
      TaxDetail: null,
    },
    CustomFormResponses: submissionContext.customFormResponses,
    CustomQuestionResponses: submissionContext.customQuestionResponses,
  };

  const shouldLogToConsole = submissionContext.submissionPreferences.logToConsole;
  const shouldSubmitToApi = submissionContext.submissionPreferences.submitToApi;

  if (!shouldLogToConsole && !shouldSubmitToApi) {
    throw new Error("Select at least one submit option: log on console or submit to API.");
  }

  if (shouldLogToConsole) {
    console.groupCollapsed(
      `[Membership Registration] Outgoing payload for ${membershipTypeUniqueId}`,
    );
    console.log(payloadPreview);
    console.log(JSON.stringify(payloadPreview, null, 2));
    console.groupEnd();
  }

  if (!shouldSubmitToApi) {
    return {
      message: "Membership registration payload logged successfully.",
      responseData: payloadPreview,
    };
  }

  const responsePayload = await postFormData<unknown>(
    `/api/membership/${membershipTypeUniqueId}/register`,
    formData,
  );
  const responseData = readResponseData(responsePayload) as Record<string, unknown> | null;
  const message =
    readText(responseData?.Message ?? responseData?.message) ||
    "Membership registration submitted successfully.";

  return {
    message,
    responseData,
  };
}

export async function validateCoupon(
  membershipTypeUniqueId: string,
  couponCode: string,
  membershipCharges: number,
): Promise<DiscountCouponValidationResult> {
  const payload = await postJson<unknown>(`/api/membership/${membershipTypeUniqueId}/validate-coupon`, {
    couponCode: couponCode.trim(),
    membershipCharges,
  });

  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  return {
    isValid: readBoolean(responseData?.IsValid ?? responseData?.isValid),
    errorMessage: readText(responseData?.ErrorMessage ?? responseData?.errorMessage) || null,
    couponUniqueId: readText(responseData?.CouponUniqueId ?? responseData?.couponUniqueId) || null,
    code: readText(responseData?.Code ?? responseData?.code) || null,
    discountType: readText(responseData?.DiscountType ?? responseData?.discountType),
    discountValue: readNumber(responseData?.DiscountValue ?? responseData?.discountValue) ?? 0,
    maxDiscountAmount: readNumber(responseData?.MaxDiscountAmount ?? responseData?.maxDiscountAmount),
    discountAmount: readNumber(responseData?.DiscountAmount ?? responseData?.discountAmount) ?? 0,
    finalAmount: readNumber(responseData?.FinalAmount ?? responseData?.finalAmount) ?? membershipCharges,
  };
}
