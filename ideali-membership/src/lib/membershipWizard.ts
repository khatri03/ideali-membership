import { getJson, postJson } from "./api";
import type {
  DiscountCouponListItem,
  DiscountCouponTypeValue,
  MembershipPaymentMethodOption,
  MembershipCustomQuestionDraft,
  MembershipCustomQuestionOptionDraft,
  MembershipDescriptionInfo,
  MembershipQuestionsInfo,
  MembershipDiscountCouponsInfo,
  MembershipAdvanceSettingsInfo,
  MembershipTypePlaceholderGroup,
  MembershipTypePlaceholderItem,
  MembershipTitleInfo,
  MembershipTypeListItem,
  OrganizerPaymentAccountSelectionItem,
} from "../types/membership";

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
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function isMembershipTypePlaceholderRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    "UniqueId" in record ||
    "uniqueId" in record ||
    "PlaceHolderText" in record ||
    "placeHolderText" in record
  );
}

function flattenMembershipTypePlaceholderRecords(value: unknown): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];

  function visit(node: unknown) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (isMembershipTypePlaceholderRecord(node)) {
      items.push(node);
      return;
    }

    if (typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(visit);
    }
  }

  visit(value);
  return items;
}

function formatMembershipTypePlaceholderGroupLabel(value: string) {
  const normalizedValue = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  if (!normalizedValue) {
    return "Variables";
  }

  return normalizedValue
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const wizardResponseCache = new Map<string, unknown>();
const wizardRequestCache = new Map<string, Promise<unknown>>();

async function getCachedWizardResponse<T>(cacheKey: string, loader: () => Promise<T>) {
  const cachedValue = wizardResponseCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue as T;
  }

  const cachedRequest = wizardRequestCache.get(cacheKey);
  if (cachedRequest) {
    return cachedRequest as Promise<T>;
  }

  const request = loader().then((value) => {
    wizardResponseCache.set(cacheKey, value);
    return value;
  });

  wizardRequestCache.set(cacheKey, request as Promise<unknown>);

  try {
    return await request;
  } finally {
    wizardRequestCache.delete(cacheKey);
  }
}

function invalidateWizardCache(cacheKey: string) {
  wizardResponseCache.delete(cacheKey);
  wizardRequestCache.delete(cacheKey);
}

function invalidateMembershipWizardProgressCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:progress:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardTitleCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:title:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardDescriptionCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:description:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardPricingCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:pricing:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardColorCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:color:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardBannerCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:banner:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardPaymentAccountCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:payment-account:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardQuestionsCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:questions:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardAdvanceSettingsCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:advance-settings:${membershipTypeUniqueId}`);
}

export function invalidateOrganizerPaymentAccountSelectionCache() {
  invalidateWizardCache("organizer:payment-account-selection-items");
}

export function invalidateOrganizerPaymentMethodsCache(paymentAccountUniqueId: string) {
  invalidateWizardCache(`organizer:payment-methods:${paymentAccountUniqueId}`);
}

export async function saveMembershipTitleStep(
  name: string,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  const basePath = membershipTypeUniqueId
    ? `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/title`
    : "/api/organizer/membership/type/wizard/title";

  const payload = await postJson<unknown>(
    `${basePath}?stepNumber=${stepNumber}`,
    { name },
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
    throw new Error("Unexpected membership title response.");
  }

  invalidateMembershipWizardTitleCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipTypes() {
  const payload = await getJson<unknown>("/api/organizer/membership/type/list");
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null;
  const items = (Array.isArray(responseData?.PageData)
    ? responseData?.PageData
    : Array.isArray(responseData?.Data)
      ? responseData?.Data
      : responseData) as Array<Record<string, unknown>>;

  return items
    .map((item): MembershipTypeListItem => ({
      text: readText(item.Text ?? item.text ?? item.Name ?? item.name),
      value: readText(item.Value ?? item.value ?? item.UniqueId ?? item.uniqueId),
      hasDiscountCoupons: readBoolean(item.HasDiscountCoupons ?? item.hasDiscountCoupons) ?? false,
      discountsEnabled: readBoolean(item.DiscountsEnabled ?? item.discountsEnabled) ?? false,
    }))
    .filter((item) => item.text && item.value);
}

export interface MembershipDiscountCouponBatchSaveItem {
  uniqueId?: string;
  code: string;
  discountType: DiscountCouponTypeValue;
  discountValue: number;
  maxDiscountAmount: number | null;
  totalCoupons: number;
  isActive: boolean;
}

export interface MembershipDiscountCouponBatchSaveRequest {
  discountsEnabled: boolean;
  coupons: MembershipDiscountCouponBatchSaveItem[];
  deletedCouponIds: string[];
}

function readDiscountCouponList(payload: unknown) {
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null | Array<unknown>;
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.PageData)
    ? responseData.PageData
    : Array.isArray(responseData?.Data)
      ? responseData.Data
      : [];

  return items
    .map((item): DiscountCouponListItem => ({
      uniqueId: readText(item.UniqueId ?? item.uniqueId),
      code: readText(item.Code ?? item.code),
      moduleType: readText(item.ModuleType ?? item.moduleType),
      discountType: readText(item.DiscountType ?? item.discountType) as DiscountCouponTypeValue,
      discountValue: readNumber(item.DiscountValue ?? item.discountValue) ?? 0,
      maxDiscountAmount: readNumber(item.MaxDiscountAmount ?? item.maxDiscountAmount) ?? null,
      totalCoupons: readNumber(item.TotalCoupons ?? item.totalCoupons) ?? null,
      usageCount: readNumber(item.UsageCount ?? item.usageCount) ?? 0,
      isActive: readBoolean(item.IsActive ?? item.isActive) ?? false,
    }))
    .filter((item) => item.uniqueId && item.code);
}

export async function getMembershipDiscountCoupons(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(
    `/api/organizer/discount/coupon/list?pageNo=1&pageSize=100&moduleType=Membership&moduleEntityUniqueId=${membershipTypeUniqueId}`,
  );

  return readDiscountCouponList(payload);
}

export async function getMembershipDiscountCouponsInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(
    `/api/organizer/membership/type/${membershipTypeUniqueId}/discount-coupons`,
  );
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const discountsEnabled =
    typeof responseData?.DiscountsEnabled === "boolean"
      ? responseData.DiscountsEnabled
      : typeof responseData?.discountsEnabled === "boolean"
        ? responseData.discountsEnabled
        : undefined;

  if (typeof discountsEnabled !== "boolean") {
    throw new Error("Unable to load membership discount state.");
  }

  const coupons = readDiscountCouponList(responseData?.Coupons ?? responseData?.coupons ?? []);

  return {
    discountsEnabled,
    coupons,
  } satisfies MembershipDiscountCouponsInfo;
}

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
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership advance settings response.");
    }

    return {
      uniqueId,
      registrationStartDateUtc: registrationStartDateUtc || null,
      registrationEndDateUtc: registrationEndDateUtc || null,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 10,
    } satisfies MembershipAdvanceSettingsInfo;
  });
}

export async function saveMembershipDiscountCoupons(
  membershipTypeUniqueId: string,
  request: MembershipDiscountCouponBatchSaveRequest,
) {
  return postJson("/api/organizer/discount/coupon/batch-save", {
    moduleType: "Membership",
    moduleEntityUniqueId: membershipTypeUniqueId,
    discountsEnabled: request.discountsEnabled,
    coupons: request.coupons,
    deletedCouponIds: request.deletedCouponIds,
  });
}

export async function saveMembershipAdvanceSettingsStep(
  request: {
    registrationStartDateUtc: string | null;
    registrationEndDateUtc: string | null;
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
  invalidateMembershipWizardProgressCache(resolvedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: resolvedMembershipTypeUniqueId,
    responseData,
  };
}

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

export async function getMembershipQuestionsInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:questions:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/questions`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const customFormUniqueIds = Array.isArray(
      responseData?.CustomFormUniqueIds ?? responseData?.customFormUniqueIds,
    )
      ? ((responseData?.CustomFormUniqueIds ?? responseData?.customFormUniqueIds) as unknown[])
      .map((item) => readText(item))
      .filter((item) => item.length > 0)
      : [];
    const customQuestions = Array.isArray(responseData?.CustomQuestions ?? responseData?.customQuestions)
      ? ((responseData?.CustomQuestions ?? responseData?.customQuestions) as unknown[])
          .map((item): MembershipCustomQuestionDraft | null => {
            const candidate = item as Record<string, unknown>;
            const options = Array.isArray(candidate.Options ?? candidate.options)
              ? ((candidate.Options ?? candidate.options) as unknown[])
                  .map((option): MembershipCustomQuestionOptionDraft => {
                    const optionCandidate = option as Record<string, unknown>;
                    return {
                      id: readText(optionCandidate.UniqueId ?? optionCandidate.uniqueId),
                      displayText: readText(optionCandidate.DisplayText ?? optionCandidate.displayText),
                      value: readText(optionCandidate.Value ?? optionCandidate.value),
                      isDefault: Boolean(optionCandidate.IsDefault ?? optionCandidate.isDefault),
                    };
                  })
                  .filter((option) => option.id)
              : [];

            const id = readText(candidate.UniqueId ?? candidate.uniqueId);
            const controlName = readText(candidate.ControlName ?? candidate.controlName);
            const controlType = readText(candidate.ControlType ?? candidate.controlType);

            if (!id || !controlName || !controlType) {
              return null;
            }

            return {
              id,
              controlId: Number(candidate.ControlId ?? candidate.controlId ?? 0),
              controlName,
              controlType,
              iconClass: readText(candidate.IconClass ?? candidate.iconClass),
              label: readText(candidate.Label ?? candidate.label),
              placeHolder: readText(candidate.PlaceHolder ?? candidate.placeHolder) || null,
              tooltip: readText(candidate.Tooltip ?? candidate.tooltip) || null,
              required: Boolean(candidate.Required ?? candidate.required),
              minLength: readText(candidate.MinLength ?? candidate.minLength) || null,
              maxLength: readText(candidate.MaxLength ?? candidate.maxLength) || null,
              defaultValue: readText(candidate.DefaultValue ?? candidate.defaultValue) || null,
              displayOrder: Number(candidate.DisplayOrder ?? candidate.displayOrder ?? 0),
              options,
            };
          })
          .filter((item): item is MembershipCustomQuestionDraft => item !== null)
      : [];
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership questions response.");
    }

    return {
      uniqueId,
      customFormUniqueIds,
      customQuestions,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 7,
    } satisfies MembershipQuestionsInfo;
  });
}

export async function getOrganizerPaymentAccountSelectionItems() {
  return getCachedWizardResponse("organizer:payment-account-selection-items", async () => {
    const payload = await getJson<unknown>("/api/organizer/payment-account/selection-items");
    const responseData = readResponseData(payload) as Array<Record<string, unknown>> | null;

    const items = (Array.isArray(responseData) ? responseData : []).map(
      (item): OrganizerPaymentAccountSelectionItem => ({
        uniqueId: readText(item.UniqueId ?? item.uniqueId),
        name: readText(item.Name ?? item.name),
        paymentMerchant: readText(item.PaymentMerchant ?? item.paymentMerchant),
        paymentCurrency: readText(item.PaymentCurrency ?? item.paymentCurrency),
        tapToPayEnabled: Boolean(item.TapToPayEnabled ?? item.tapToPayEnabled),
      }),
    );

    return items.filter((item) => item.uniqueId && item.name);
  });
}

export async function getMembershipPaymentMethods(paymentAccountUniqueId: string) {
  return getCachedWizardResponse(`organizer:payment-methods:${paymentAccountUniqueId}`, async () => {
    const payload = await getJson<unknown>(
      `/api/organizer/payment-account/${paymentAccountUniqueId}/payment-methods`,
    );
    const responseData = readResponseData(payload) as Array<Record<string, unknown>> | null;

    return (Array.isArray(responseData) ? responseData : [])
      .map(
        (item): MembershipPaymentMethodOption => ({
          text: readText(item.Text ?? item.text),
          value: Number(item.Value ?? item.value),
        }),
      )
      .filter((item) => item.text && Number.isFinite(item.value));
  });
}

export async function saveMembershipPaymentAccountStep(
  paymentAccountUniqueId: string,
  paymentMethods: number[],
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership payment account saving.");
  }

  if (!paymentAccountUniqueId) {
    throw new Error("Payment account is required.");
  }

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/payment-account?stepNumber=${stepNumber}`,
    { paymentAccountUniqueId, paymentMethods },
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
    throw new Error("Unexpected membership payment account response.");
  }

  invalidateMembershipWizardPaymentAccountCache(savedMembershipTypeUniqueId);
  invalidateOrganizerPaymentMethodsCache(paymentAccountUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipQuestionsStep(
  customFormUniqueIds: string[] | null,
  customQuestions: MembershipCustomQuestionDraft[] | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership questions saving.");
  }

  const requestBody = {
    customFormUniqueIds: customFormUniqueIds && customFormUniqueIds.length > 0 ? customFormUniqueIds : null,
    customQuestions:
      customQuestions && customQuestions.length > 0
        ? [...customQuestions]
            .sort((left, right) => left.displayOrder - right.displayOrder)
            .map((question) => ({
            uniqueId: question.id,
            controlId: question.controlId,
            controlName: question.controlName,
            controlType: question.controlType,
            iconClass: question.iconClass,
            label: question.label,
            placeHolder: question.placeHolder,
            tooltip: question.tooltip,
            required: question.required,
            minLength: question.minLength,
            maxLength: question.maxLength,
            defaultValue: question.defaultValue,
            displayOrder: question.displayOrder,
            options: question.options.map((option) => ({
              uniqueId: option.id,
              displayText: option.displayText,
              value: option.value,
              isDefault: option.isDefault,
            })),
          }))
        : null,
  };

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/questions?stepNumber=${stepNumber}`,
    requestBody,
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
    throw new Error("Unexpected membership questions response.");
  }

  invalidateMembershipWizardQuestionsCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
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
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipWizardProgress(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:progress:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/progress`);
    const responseData = readResponseData(payload);

    if (typeof responseData === "number") {
      return Number.isFinite(responseData) && responseData >= 0 ? responseData : 0;
    }

    if (responseData && typeof responseData === "object") {
      const record = responseData as Record<string, unknown>;
      const stepNumber =
        readNumber(record.StepNumber ?? record.stepNumber ?? record.StepNo ?? record.stepNo ?? record.Data) ??
        readNumber(record.data);

      if (typeof stepNumber === "number" && Number.isFinite(stepNumber) && stepNumber >= 0) {
        return stepNumber;
      }
    }

    return 0;
  });
}

export function invalidateMembershipWizardProgress(membershipTypeUniqueId: string) {
  invalidateMembershipWizardProgressCache(membershipTypeUniqueId);
}

