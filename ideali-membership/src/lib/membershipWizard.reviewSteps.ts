import { getJson, postJson } from "./api";
import {
  getCachedWizardResponse,
  invalidateMembershipWizardAdvanceSettingsCache,
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardReviewCache,
  readBoolean,
  readNumber,
  readResponseData,
  readText,
} from "./membershipWizard.shared";
import type {
  MembershipAdvanceSettingsInfo,
  MembershipReviewInfo,
  MembershipReviewPaymentAccountInfo,
} from "../types/membership";

export async function getMembershipAdvanceSettingsInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:advance-settings:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(
      `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/advance-settings`,
    );
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const registrationStartDateUtc = readText(
      responseData?.RegistrationStartDateUtc ?? responseData?.registrationStartDateUtc,
    );
    const registrationEndDateUtc = readText(
      responseData?.RegistrationEndDateUtc ?? responseData?.registrationEndDateUtc,
    );
    const requiresApproval =
      readBoolean(responseData?.RequiresApproval ?? responseData?.requiresApproval) ?? false;
    const donationCampaignUniqueId = readText(
      responseData?.DonationCampaignUniqueId ?? responseData?.donationCampaignUniqueId,
    );
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership advance settings response.");
    }

    return {
      uniqueId,
      registrationStartDateUtc: registrationStartDateUtc || null,
      registrationEndDateUtc: registrationEndDateUtc || null,
      requiresApproval,
      donationCampaignUniqueId: donationCampaignUniqueId || null,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 10,
    } satisfies MembershipAdvanceSettingsInfo;
  });
}

export async function getMembershipReviewInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:review:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(
      `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/review-data`,
    );
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const name = readText(responseData?.Name ?? responseData?.name);
    const color = readText(responseData?.Color ?? responseData?.color);
    const paymentAccountRecord = (responseData?.PaymentAccount ?? responseData?.paymentAccount) as
      | Record<string, unknown>
      | null
      | undefined;
    const paymentAccount: MembershipReviewPaymentAccountInfo | null = paymentAccountRecord
      ? {
          name: readText(paymentAccountRecord.Name ?? paymentAccountRecord.name),
          merchant: readText(paymentAccountRecord.Merchant ?? paymentAccountRecord.merchant),
          currency: readText(paymentAccountRecord.Currency ?? paymentAccountRecord.currency),
        }
      : null;
    const isFree = readBoolean(responseData?.IsFree ?? responseData?.isFree) ?? false;
    const membershipCharges = readNumber(responseData?.MembershipCharges ?? responseData?.membershipCharges) ?? 0;
    const tenure = readNumber(responseData?.Tenure ?? responseData?.tenure);
    const annualExpiryMonth = readNumber(responseData?.AnnualExpiryMonth ?? responseData?.annualExpiryMonth);
    const annualExpiryDay = readNumber(responseData?.AnnualExpiryDay ?? responseData?.annualExpiryDay);
    const customExpiryDays = readNumber(responseData?.CustomExpiryDays ?? responseData?.customExpiryDays);
    const discountsEnabled = readBoolean(responseData?.DiscountsEnabled ?? responseData?.discountsEnabled) ?? false;
    const hasQuestions = readBoolean(responseData?.HasQuestions ?? responseData?.hasQuestions) ?? false;
    const requiresApproval = readBoolean(responseData?.RequiresApproval ?? responseData?.requiresApproval) ?? false;
    const registrationStartDateUtc = readText(
      responseData?.RegistrationStartDateUtc ?? responseData?.registrationStartDateUtc,
    );
    const registrationEndDateUtc = readText(
      responseData?.RegistrationEndDateUtc ?? responseData?.registrationEndDateUtc,
    );
    const publishedAtUtc = readText(responseData?.PublishedAtUtc ?? responseData?.publishedAtUtc);
    const donationCampaignUniqueId = readText(
      responseData?.DonationCampaignUniqueId ?? responseData?.donationCampaignUniqueId,
    );
    const donationCampaignName = readText(
      responseData?.DonationCampaignName ?? responseData?.donationCampaignName,
    );
    const setupState = readText(responseData?.SetupState ?? responseData?.setupState) || "Draft";
    const availableForSignUp =
      readBoolean(responseData?.AvailableForSignUp ?? responseData?.availableForSignUp) ?? false;
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId || !name) {
      throw new Error("Unexpected membership review response.");
    }

    return {
      uniqueId,
      name,
      color: color || null,
      paymentAccount:
        paymentAccount && (paymentAccount.name || paymentAccount.merchant || paymentAccount.currency)
          ? paymentAccount
          : null,
      isFree,
      membershipCharges,
      tenure:
        typeof tenure === "number" && Number.isFinite(tenure)
          ? tenure
          : null,
      annualExpiryMonth:
        typeof annualExpiryMonth === "number" && Number.isFinite(annualExpiryMonth)
          ? annualExpiryMonth
          : null,
      annualExpiryDay:
        typeof annualExpiryDay === "number" && Number.isFinite(annualExpiryDay)
          ? annualExpiryDay
          : null,
      customExpiryDays:
        typeof customExpiryDays === "number" && Number.isFinite(customExpiryDays)
          ? customExpiryDays
          : null,
      discountsEnabled,
      hasQuestions,
      requiresApproval,
      registrationStartDateUtc: registrationStartDateUtc || null,
      registrationEndDateUtc: registrationEndDateUtc || null,
      publishedAtUtc: publishedAtUtc || null,
      donationCampaignUniqueId: donationCampaignUniqueId || null,
      donationCampaignName: donationCampaignName || null,
      setupState,
      availableForSignUp,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 11,
    } satisfies MembershipReviewInfo;
  });
}

export async function saveMembershipAdvanceSettingsStep(
  request: {
    registrationStartDateUtc: string | null;
    registrationEndDateUtc: string | null;
    requiresApproval: boolean;
    donationCampaignUniqueId: string | null;
  },
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership advance settings saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/advance-settings?stepNumber=${stepNumber}`,
    request,
  );

  const responseData = readResponseData(payload);
  const savedMembershipTypeUniqueId =
    readText(responseData) ||
    readText(
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>).UniqueId ??
            (responseData as Record<string, unknown>).uniqueId ??
            (responseData as Record<string, unknown>).MembershipTypeUniqueId ??
            (responseData as Record<string, unknown>).membershipTypeUniqueId
        : "",
    );

  if (!savedMembershipTypeUniqueId && !membershipTypeUniqueId) {
    throw new Error("Unexpected membership advance settings response.");
  }

  const resolvedMembershipTypeUniqueId = savedMembershipTypeUniqueId || membershipTypeUniqueId;

  invalidateMembershipWizardAdvanceSettingsCache(resolvedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(resolvedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(resolvedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: resolvedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipReviewStep(
  request: { availableForSignUp: boolean },
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership review saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/review-data?stepNumber=${stepNumber}`,
    request,
  );

  const responseData = readResponseData(payload);
  const savedMembershipTypeUniqueId =
    readText(responseData) ||
    readText(
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>).UniqueId ??
            (responseData as Record<string, unknown>).uniqueId ??
            (responseData as Record<string, unknown>).MembershipTypeUniqueId ??
            (responseData as Record<string, unknown>).membershipTypeUniqueId
        : "",
    );

  if (!savedMembershipTypeUniqueId && !membershipTypeUniqueId) {
    throw new Error("Unexpected membership review response.");
  }

  const resolvedMembershipTypeUniqueId = savedMembershipTypeUniqueId || membershipTypeUniqueId;

  invalidateMembershipWizardReviewCache(resolvedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(resolvedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: resolvedMembershipTypeUniqueId,
    responseData,
  };
}
