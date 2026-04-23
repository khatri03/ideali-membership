import { generatePath } from "react-router-dom";

export const APP_ROUTES = {
  root: "/",
  login: "/login",
  app: "/",
  membership: "/membership/type",
  membershipDashboard: "/membership/type/dashboard",
  membershipTypes: "/membership/type/list",
  membershipMembers: "/membership/type/members",
  membershipPendingApprovals: "/membership/type/pending-approvals",
  membershipWizard: "/membership/type/wizard",
  membershipWizardTitle: "/membership/type/wizard/title",
  membershipWizardTitleWithId: "/membership/type/wizard/:membershipTypeUniqueId/title",
  membershipWizardResume: "/membership/type/wizard/:membershipTypeUniqueId",
  membershipWizardDescription: "/membership/type/wizard/:membershipTypeUniqueId/description",
  membershipWizardColor: "/membership/type/wizard/:membershipTypeUniqueId/color",
  membershipWizardBanner: "/membership/type/wizard/:membershipTypeUniqueId/banner",
  membershipWizardPricing: "/membership/type/wizard/:membershipTypeUniqueId/pricing",
  membershipWizardPaymentAccount: "/membership/type/wizard/:membershipTypeUniqueId/payment-account",
  membershipWizardCustomForms: "/membership/type/wizard/:membershipTypeUniqueId/custom-forms",
  membershipWizardThankYouEmail: "/membership/type/wizard/:membershipTypeUniqueId/thank-you-email",
  membershipWizardAdvanceSettings: "/membership/type/wizard/:membershipTypeUniqueId/advance-settings",
  membershipWizardReview: "/membership/type/wizard/:membershipTypeUniqueId/review",
  customForms: "/organizer/custom-form/list",
  customFormsCreate: "/organizer/custom-form/create-form",
} as const;

export function buildMembershipWizardStepPath(
  path: (typeof APP_ROUTES)[keyof typeof APP_ROUTES],
  membershipTypeUniqueId?: string,
  stepNo?: number,
) {
  if (path === APP_ROUTES.membershipWizardTitle && membershipTypeUniqueId) {
    const resolvedTitlePath = generatePath(APP_ROUTES.membershipWizardTitleWithId, {
      membershipTypeUniqueId,
    });
    return stepNo ? `${resolvedTitlePath}?stepNo=${stepNo}` : resolvedTitlePath;
  }

  if (!path.includes(":membershipTypeUniqueId")) {
    return stepNo ? `${path}?stepNo=${stepNo}` : path;
  }

  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for wizard step navigation.");
  }

  const resolvedPath = generatePath(path, { membershipTypeUniqueId });
  return stepNo ? `${resolvedPath}?stepNo=${stepNo}` : resolvedPath;
}
