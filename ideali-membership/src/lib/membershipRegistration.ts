import { getJson, postJson } from "./api";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
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
  return typeof value === "boolean" ? value : false;
}

function readPaymentProducts(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string" && item in PAYMENT_PRODUCT_NAME_TO_ID) {
        return PAYMENT_PRODUCT_NAME_TO_ID[item];
      }

      const numberValue = typeof item === "number" ? item : Number(item);
      return Number.isFinite(numberValue) ? numberValue : null;
    })
    .filter((item): item is number => item !== null);
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
        layoutColumn: readNumber(record.LayoutColumn ?? record.layoutColumn),
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
      accountName,
      merchantName,
      paymentCurrencyCode: paymentCurrencyCode || null,
      paymentCurrencySymbol: paymentCurrencySymbol || null,
      paymentProducts,
    },
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
  const campaignLabel = donationCampaignName?.trim() || "campaign";
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

  const requestBody: MembershipRegistrationSubmitRequest = {
    contactInfo: {
      prefix: formState.prefix.trim() ? formState.prefix.trim() : null,
      firstName: formState.firstName.trim(),
      middleName: formState.middleName.trim(),
      lastName: formState.lastName.trim(),
      primaryEmail: formState.email.trim(),
      cellPhone: formState.cellPhone.trim(),
      address: {
        streetLine1: formState.streetLine1.trim(),
        streetLine2: formState.streetLine2.trim(),
        zipCode: formState.zipCode.trim(),
      },
    },
    userInfo: {
      email: formState.email.trim(),
      password: formState.password,
      confirmPassword: formState.confirmPassword,
    },
    addressInfo: {
      streetLine1: formState.streetLine1.trim(),
      streetLine2: formState.streetLine2.trim(),
      zipCode: formState.zipCode.trim(),
    },
    invoiceDetail: {
      invoiceAmount: amount + donationTotal,
      amountPaid: amount + donationTotal,
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
