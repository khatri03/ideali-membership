import { getJson, postJson } from "./api";
import {
  formatMembershipTypePlaceholderGroupLabel,
  flattenMembershipTypePlaceholderRecords,
  getCachedWizardResponse,
  invalidateMembershipWizardBannerCache,
  invalidateMembershipWizardColorCache,
  invalidateMembershipWizardDescriptionCache,
  invalidateMembershipWizardPricingCache,
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardReviewCache,
  readBoolean,
  readNumber,
  readResponseData,
  readStringArray,
  readText,
} from "./membershipWizard.shared";
import type {
  MembershipAdvanceSettingsInfo,
  MembershipDescriptionInfo,
  MembershipReviewInfo,
  MembershipReviewPaymentAccountInfo,
  MembershipTypePlaceholderGroup,
  MembershipTypePlaceholderItem,
  MembershipTitleInfo,
} from "../types/membership";

export async function getMembershipTitleInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:title:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/title`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const name = readText(responseData?.Name ?? responseData?.name);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId || !name) {
      throw new Error("Unexpected membership title response.");
    }

    return {
      uniqueId,
      name,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 1,
    } satisfies MembershipTitleInfo;
  });
}

export async function getMembershipDescriptionInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:description:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/description`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const description = readText(responseData?.Description ?? responseData?.description);
    const emailSubject = readText(responseData?.EmailSubject ?? responseData?.emailSubject);
    const emailTemplate = readText(responseData?.EmailTemplate ?? responseData?.emailTemplate);
    const notifyOrganizer = readBoolean(responseData?.NotifyOrganizer ?? responseData?.notifyOrganizer) ?? false;
    const otherNotificationEmails = readText(
      responseData?.OtherNotificationEmails ?? responseData?.otherNotificationEmails,
    );
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership description response.");
    }

    return {
      uniqueId,
      description,
      emailSubject,
      emailTemplate,
      notifyOrganizer,
      otherNotificationEmails,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 2,
    } satisfies MembershipDescriptionInfo;
  });
}

export async function getMembershipTypePlaceholders() {
  const payload = await getJson<unknown>("/api/organizer/membership/type/email-template/place-holders");
  const responseData = readResponseData(payload);
  const groups: MembershipTypePlaceholderGroup[] = [];

  if (Array.isArray(responseData)) {
    const items = flattenMembershipTypePlaceholderRecords(responseData)
      .map(
        (item): MembershipTypePlaceholderItem => ({
          id: readNumber(item.Id ?? item.id),
          uniqueId: readText(item.UniqueId ?? item.uniqueId),
          displayText: readText(item.DisplayText ?? item.displayText),
          placeHolderText: readText(item.PlaceHolderText ?? item.placeHolderText),
        }),
      )
      .filter((item) => item.uniqueId && item.placeHolderText);

    if (items.length > 0) {
      groups.push({
        label: "Variables",
        items,
      });
    }
  } else if (responseData && typeof responseData === "object") {
    for (const [groupKey, groupValue] of Object.entries(responseData as Record<string, unknown>)) {
      const items = flattenMembershipTypePlaceholderRecords(groupValue)
        .map(
          (item): MembershipTypePlaceholderItem => ({
            id: readNumber(item.Id ?? item.id),
            uniqueId: readText(item.UniqueId ?? item.uniqueId),
            displayText: readText(item.DisplayText ?? item.displayText),
            placeHolderText: readText(item.PlaceHolderText ?? item.placeHolderText),
          }),
        )
        .filter((item) => item.uniqueId && item.placeHolderText);

      if (items.length > 0) {
        groups.push({
          label: formatMembershipTypePlaceholderGroupLabel(groupKey),
          items,
        });
      }
    }
  }

  return groups;
}

export async function getMembershipPricingInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:pricing:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/pricing`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const tenureValue = readNumber(responseData?.Tenure ?? responseData?.tenure);
    const membershipChargesValue = readNumber(
      responseData?.MembershipCharges ?? responseData?.membershipCharges,
    );
    const annualExpiryMonthValue = readNumber(
      responseData?.AnnualExpiryMonth ?? responseData?.annualExpiryMonth,
    );
    const annualExpiryDayValue = readNumber(responseData?.AnnualExpiryDay ?? responseData?.annualExpiryDay);
    const customExpiryDaysValue = readNumber(responseData?.CustomExpiryDays ?? responseData?.customExpiryDays);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership pricing response.");
    }

    return {
      uniqueId,
      membershipCharges:
        typeof membershipChargesValue === "number" && Number.isFinite(membershipChargesValue)
          ? membershipChargesValue
          : null,
      pricing:
        typeof tenureValue === "number" && Number.isFinite(tenureValue)
          ? tenureValue
          : null,
      annualExpiryMonth:
        typeof annualExpiryMonthValue === "number" && Number.isFinite(annualExpiryMonthValue)
          ? annualExpiryMonthValue
          : null,
      annualExpiryDay:
        typeof annualExpiryDayValue === "number" && Number.isFinite(annualExpiryDayValue)
          ? annualExpiryDayValue
          : null,
      customExpiryDays:
        typeof customExpiryDaysValue === "number" && Number.isFinite(customExpiryDaysValue)
          ? customExpiryDaysValue
          : null,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 5,
    };
  });
}

export async function saveMembershipPricingStep(
  pricing: number | null,
  membershipCharges: number | null,
  customExpiryMonth: number | null,
  customExpiryDay: number | null,
  customExpiryDays: number | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership pricing saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/pricing?stepNumber=${stepNumber}`,
    {
      tenure: pricing,
      membershipCharges,
      annualExpiryMonth: customExpiryMonth,
      annualExpiryDay: customExpiryDay,
      customExpiryDays,
    },
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

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership pricing response.");
  }

  invalidateMembershipWizardPricingCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipDescriptionStep(
  request: {
    description: string | null;
    emailSubject: string | null;
    emailTemplate: string | null;
    notifyOrganizer: boolean;
    otherNotificationEmails: string | null;
  },
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership description saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/description?stepNumber=${stepNumber}`,
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

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership description response.");
  }

  invalidateMembershipWizardDescriptionCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipColorInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:color:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/color`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const color = readText(responseData?.Color ?? responseData?.color);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership color response.");
    }

    return {
      uniqueId,
      color: color || "",
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 3,
    };
  });
}

export async function getMembershipBannerInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:banner:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/banner`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const bannerUrl = readText(responseData?.BannerUrl ?? responseData?.bannerUrl);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership banner response.");
    }

    return {
      uniqueId,
      bannerUrl: bannerUrl || "",
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 4,
    };
  });
}

export async function getMembershipPaymentAccountInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:payment-account:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/payment-account`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const paymentAccountUniqueId = readText(
      responseData?.PaymentAccountUniqueId ?? responseData?.paymentAccountUniqueId,
    );
    const paymentMethods = Array.isArray(responseData?.PaymentMethods ?? responseData?.paymentMethods)
      ? ((responseData?.PaymentMethods ?? responseData?.paymentMethods) as unknown[])
          .map((item) => readNumber(item))
          .filter((item): item is number => typeof item === "number")
      : [];
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership payment account response.");
    }

    return {
      uniqueId,
      paymentAccountUniqueId: paymentAccountUniqueId || "",
      paymentMethods,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 5,
    };
  });
}

export async function saveMembershipBannerStep(
  bannerUrl: string | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership banner saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/banner?stepNumber=${stepNumber}`,
    { bannerUrl },
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

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership banner response.");
  }

  invalidateMembershipWizardBannerCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipColorStep(
  color: string | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership color saving.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/color?stepNumber=${stepNumber}`,
    { color },
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

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership color response.");
  }

  invalidateMembershipWizardColorCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}
