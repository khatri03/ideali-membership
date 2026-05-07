import { getJson, postFormData, postJson } from "./api";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationPaymentProduct,
  MembershipRegistrationStripeCredentials,
  MembershipRegistrationSubmitRequest,
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

function readText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

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

async function uploadMembershipProfilePhoto(membershipTypeUniqueId: string, file: File | null) {
  if (!file) {
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  const payload = await postFormData<unknown>(`/api/membership/${membershipTypeUniqueId}/profile-photo`, formData);
  return readNumber(readResponseData(payload));
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
  const donationCampaignUniqueId = readText(
    membershipDetailRecord?.DonationCampaignUniqueId ?? membershipDetailRecord?.donationCampaignUniqueId,
  );
  const donationCampaignName = readText(
    membershipDetailRecord?.DonationCampaignName ?? membershipDetailRecord?.donationCampaignName,
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
      donationCampaignUniqueId: donationCampaignUniqueId || null,
      donationCampaignName: donationCampaignName || null,
      isFree,
      membershipCharges,
      allowPartialPayment,
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
  donationAmount: number,
  donationCampaignName: string | null,
) {
  const amount = Number.isFinite(membershipCharges) ? membershipCharges : 0;
  const donationTotal = Number.isFinite(donationAmount) && donationAmount > 0 ? donationAmount : 0;
  const tipTotal = (() => {
    const parsedTipAmount = Number(formState.tipAmount.replace(/,/g, "").trim());
    return Number.isFinite(parsedTipAmount) && parsedTipAmount > 0 ? parsedTipAmount : 0;
  })();
  const campaignLabel = donationCampaignName?.trim() || "campaign";
  const profilePhotoFileStorageId = await uploadMembershipProfilePhoto(
    membershipTypeUniqueId,
    formState.profilePhotoFile,
  );
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
  const invoiceItems = [
    {
      description: "Membership registration",
      quantity: 1,
      unitPrice: amount,
      itemType: 1,
    },
  ];

  if (donationTotal > 0) {
    invoiceItems.push({
      description: `Donation to ${campaignLabel}`,
      quantity: 1,
      unitPrice: donationTotal,
      itemType: 1,
    });
  }

  if (tipTotal > 0) {
    invoiceItems.push({
      description: "Tip",
      quantity: 1,
      unitPrice: tipTotal,
      itemType: 1,
    });
  }

  const requestBody: MembershipRegistrationSubmitRequest = {
    contactInfo: {
      prefix: trimmedPrefix || null,
      firstName: formState.firstName.trim(),
      middleName: formState.middleName.trim(),
      lastName: formState.lastName.trim(),
      primaryEmail: formState.email.trim(),
      cellPhone: formState.cellPhone.trim(),
      address: {
        addressType: trimmedAddressType || null,
        streetLine1: trimmedStreetLine1 || null,
        streetLine2: trimmedStreetLine2 || null,
        zipCode: trimmedZipCode || null,
        cityName: trimmedCityName || null,
        countryId: parsedCountryId,
        stateId: parsedStateId,
      },
    },
    userInfo: {
      email: formState.email.trim(),
      profilePhotoFileStorageId,
      password: formState.password,
      confirmPassword: formState.confirmPassword,
    },
    addressInfo: {
      addressType: trimmedAddressType || null,
      streetLine1: trimmedStreetLine1 || null,
      streetLine2: trimmedStreetLine2 || null,
      zipCode: trimmedZipCode || null,
      cityName: trimmedCityName || null,
      countryId: parsedCountryId,
      stateId: parsedStateId,
    },
    invoiceDetail: {
      invoiceAmount: amount + donationTotal + tipTotal,
      amountPaid: amount + donationTotal + tipTotal,
      paymentMethod,
      notes: formState.notes.trim(),
      paymentMethodDetail: null,
      module: 5,
      invoiceType: 1,
      taxDetail: null,
      discountDetail: null,
      invoiceItems,
    },
    discountDetail: null,
  };

  const payload = await postJson<unknown>(`/api/membership/${membershipTypeUniqueId}/register`, requestBody);
  const responseData = readResponseData(payload);

  const message = typeof responseData === "string"
    ? responseData
    : responseData && typeof responseData === "object"
      ? readText((responseData as Record<string, unknown>).Message ?? (responseData as Record<string, unknown>).message)
      : "";

  return {
    message: message || "Membership registration submitted successfully.",
    responseData,
  };
}
