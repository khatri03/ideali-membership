import { getJson, postJson } from "./api";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationSubmitRequest,
} from "../types/membershipRegistration";
import {
  fetchAddressTypeOptions,
  fetchContactPrefixOptions,
  readBoolean,
  readCustomForms,
  readCustomQuestions,
  readNumber,
  readPaymentProducts,
  readResponseData,
  readText,
  readScalar,
  readStripeCredentials,
  resolvePaymentProductId,
  uploadMembershipProfilePhoto,
} from "./membershipRegistration.parsers";
export { resolvePaymentProductId, fetchAddressTypeOptions, fetchContactPrefixOptions } from "./membershipRegistration.parsers";
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
  const presetTipsSource = responseData?.PresetTips ?? responseData?.presetTips;
  const presetTips = Array.isArray(presetTipsSource)
    ? presetTipsSource
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const tipRecord = item as Record<string, unknown>;
      return {
        percent: readNumber(tipRecord.Percent ?? tipRecord.percent) ?? 0,
        isDefault: readBoolean(tipRecord.IsDefault ?? tipRecord.isDefault),
      };
    })
    .filter((item): item is { percent: number; isDefault: boolean } => item !== null)
    : [];

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

export async function fetchStripePublicCredentials(paymentAccountUniqueId: string) {
  const payload = await getJson<unknown>(`/api/public/stripe/${paymentAccountUniqueId}/credentials`);
  const responseData = readResponseData(payload);
  const credentials = readStripeCredentials(responseData);

  if (!credentials) {
    throw new Error("Unable to load Stripe credentials.");
  }

  return credentials;
}

export async function submitMembershipRegistration(
  membershipTypeUniqueId: string,
  formState: MembershipRegistrationFormState,
  membershipCharges: number,
  paymentMethod: number | null,
  donationAmount: number,
  tipAmount: number,
  donationCampaignName: string | null,
) {
  const amount = Number.isFinite(membershipCharges) ? membershipCharges : 0;
  const donationTotal = Number.isFinite(donationAmount) && donationAmount > 0 ? donationAmount : 0;
  const tipTotal = Number.isFinite(tipAmount) && tipAmount > 0 ? tipAmount : 0;
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

