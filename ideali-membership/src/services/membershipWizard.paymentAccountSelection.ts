import { getJson, postJson } from "./api";
import {
  getCachedWizardResponse,
  invalidateMembershipWizardPaymentAccountCache,
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardReviewCache,
  invalidateOrganizerPaymentMethodsCache,
  readResponseData,
  readText,
} from "./membershipWizard.shared";
import type {
  MembershipPaymentMethodOption,
  OrganizerPaymentAccountSelectionItem,
} from "../types/membership";

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
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateOrganizerPaymentMethodsCache(paymentAccountUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}
