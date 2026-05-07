import { getJson, postJson } from "./api";
import {
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardReviewCache,
  invalidateMembershipWizardTitleCache,
  readBoolean,
  readNumber,
  readResponseData,
  readText,
} from "./membershipWizard.shared";
import type {
  MembershipTitleInfo,
  MembershipTypeListItem,
  MembershipTypeOrderListItem,
} from "../types/membership";

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
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
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
      displayOrder: readNumber(item.DisplayOrder ?? item.displayOrder) ?? 0,
      hasDiscountCoupons: readBoolean(item.HasDiscountCoupons ?? item.hasDiscountCoupons) ?? false,
      discountsEnabled: readBoolean(item.DiscountsEnabled ?? item.discountsEnabled) ?? false,
      availableForSignUp: readBoolean(item.AvailableForSignUp ?? item.availableForSignUp) ?? false,
      setupState: readText(item.SetupState ?? item.setupState) || "Draft",
      isFree: readBoolean(item.IsFree ?? item.isFree) ?? false,
      membershipCharges: readNumber(item.MembershipCharges ?? item.membershipCharges) ?? 0,
      paymentMerchant: readText(item.PaymentMerchant ?? item.paymentMerchant) || null,
      paymentCurrencyCode: readText(item.PaymentCurrencyCode ?? item.paymentCurrencyCode) || null,
      paymentCurrencySymbol: readText(item.PaymentCurrencySymbol ?? item.paymentCurrencySymbol) || null,
      tenureText: readText(item.TenureText ?? item.tenureText) || null,
      registrationStartDateUtc: readText(item.RegistrationStartDateUtc ?? item.registrationStartDateUtc) || null,
      registrationEndDateUtc: readText(item.RegistrationEndDateUtc ?? item.registrationEndDateUtc) || null,
      customExpiryDays: readNumber(item.CustomExpiryDays ?? item.customExpiryDays) ?? null,
      annualExpiryMonth: readNumber(item.AnnualExpiryMonth ?? item.annualExpiryMonth) ?? null,
      annualExpiryDay: readNumber(item.AnnualExpiryDay ?? item.annualExpiryDay) ?? null,
    }))
    .filter((item) => item.text && item.value)
    .sort((left, right) => left.displayOrder - right.displayOrder || left.text.localeCompare(right.text));
}

export async function getMembershipTypeOrderList() {
  const payload = await getJson<unknown>("/api/organizer/membership/type/order-list");
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null;
  const items = (Array.isArray(responseData?.PageData)
    ? responseData?.PageData
    : Array.isArray(responseData?.Data)
      ? responseData?.Data
      : responseData) as Array<Record<string, unknown>>;

  return items
    .map((item): MembershipTypeOrderListItem => ({
      uniqueId: readText(item.UniqueId ?? item.uniqueId),
      name: readText(item.Name ?? item.name),
      displayOrder: readNumber(item.DisplayOrder ?? item.displayOrder) ?? 0,
    }))
    .filter((item) => item.uniqueId && item.name)
    .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
}

export async function saveMembershipTypeOrderList(membershipTypeUniqueIds: string[]) {
  const payload = await postJson<unknown>("/api/organizer/membership/type/order-list", {
    membershipTypeUniqueIds,
  });

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

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId || null,
    responseData,
  };
}
