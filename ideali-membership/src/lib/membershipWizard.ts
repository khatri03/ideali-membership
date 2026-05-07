import { getJson } from "./api";
import {
  getCachedWizardResponse,
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardTitleCache,
  invalidateMembershipWizardDescriptionCache,
  invalidateMembershipWizardPricingCache,
  invalidateMembershipWizardColorCache,
  invalidateMembershipWizardBannerCache,
  invalidateMembershipWizardPaymentAccountCache,
  invalidateMembershipWizardQuestionsCache,
  invalidateMembershipWizardAdvanceSettingsCache,
  invalidateMembershipWizardReviewCache,
  invalidateOrganizerPaymentAccountSelectionCache,
  invalidateOrganizerPaymentMethodsCache,
  readNumber,
  readResponseData,
} from "./membershipWizard.shared";

export {
  saveMembershipTitleStep,
  getMembershipTypes,
  getMembershipTypeOrderList,
  saveMembershipTypeOrderList,
} from "./membershipWizard.coreLists";

export {
  invalidateMembershipWizardTitleCache,
  invalidateMembershipWizardDescriptionCache,
  invalidateMembershipWizardPricingCache,
  invalidateMembershipWizardColorCache,
  invalidateMembershipWizardBannerCache,
  invalidateMembershipWizardPaymentAccountCache,
  invalidateMembershipWizardQuestionsCache,
  invalidateMembershipWizardAdvanceSettingsCache,
  invalidateMembershipWizardReviewCache,
  invalidateOrganizerPaymentAccountSelectionCache,
  invalidateOrganizerPaymentMethodsCache,
  invalidateMembershipWizardProgressCache,
} from "./membershipWizard.shared";

export { getMembershipDiscountCoupons, getMembershipDiscountCouponsInfo, saveMembershipDiscountCoupons } from "./membershipWizard.discountCoupons";
export { getOrganizerPaymentAccountSelectionItems, getMembershipPaymentMethods, saveMembershipPaymentAccountStep } from "./membershipWizard.paymentAccountSelection";
export { getMembershipAdvanceSettingsInfo, getMembershipReviewInfo, saveMembershipAdvanceSettingsStep, saveMembershipReviewStep } from "./membershipWizard.reviewSteps";
export {
  getMembershipTitleInfo,
  getMembershipDescriptionInfo,
  getMembershipTypePlaceholders,
  getMembershipPricingInfo,
  saveMembershipPricingStep,
  saveMembershipDescriptionStep,
  getMembershipColorInfo,
  saveMembershipColorStep,
  getMembershipBannerInfo,
  saveMembershipBannerStep,
  getMembershipPaymentAccountInfo,
} from "./membershipWizard.stepData";
export { getMembershipQuestionsInfo, saveMembershipQuestionsStep } from "./membershipWizard.questions";

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
