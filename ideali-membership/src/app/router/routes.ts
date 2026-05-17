import { generatePath } from "react-router-dom";

export const APP_ROUTES = {
  root: "/",
  login: "/login",
  app: "/",
  membershipRegister: "/membership/:membershipTypeUniqueId/register",
  membershipRegisterCountdown: "/membership/:membershipTypeUniqueId/register/countdown",
  membership: "/organizer/membership/type",
  membershipDashboard: "/organizer/membership/type/dashboard",
  membershipTypes: "/organizer/membership/type/list",
  membershipMembers: "/organizer/membership/type/members",
  membershipMemberDetail: "/organizer/membership/type/members/:memberUniqueId/detail",
  membershipPendingApprovals: "/organizer/membership/type/pending-approvals",
  dndPlayground: "/organizer/dnd-playground",
  membershipWizard: "/organizer/membership/type/wizard",
  membershipWizardTitle: "/organizer/membership/type/wizard/title",
  membershipWizardTitleWithId: "/organizer/membership/type/wizard/:membershipTypeUniqueId/title",
  membershipWizardResume: "/organizer/membership/type/wizard/:membershipTypeUniqueId",
  membershipWizardDescription: "/organizer/membership/type/wizard/:membershipTypeUniqueId/description",
  membershipWizardColor: "/organizer/membership/type/wizard/:membershipTypeUniqueId/color",
  membershipWizardBanner: "/organizer/membership/type/wizard/:membershipTypeUniqueId/banner",
  membershipWizardPricing: "/organizer/membership/type/wizard/:membershipTypeUniqueId/pricing",
  membershipWizardDiscountCoupons: "/organizer/membership/type/wizard/:membershipTypeUniqueId/discount-coupons",
  membershipWizardPaymentAccount: "/organizer/membership/type/wizard/:membershipTypeUniqueId/payment-account",
  membershipWizardQuestions: "/organizer/membership/type/wizard/:membershipTypeUniqueId/questions",
  membershipWizardCustomForms: "/organizer/membership/type/wizard/:membershipTypeUniqueId/custom-forms",
  membershipWizardThankYouEmail: "/organizer/membership/type/wizard/:membershipTypeUniqueId/thank-you-email",
  membershipWizardAdvanceSettings: "/organizer/membership/type/wizard/:membershipTypeUniqueId/advance-settings",
  membershipWizardReview: "/organizer/membership/type/wizard/:membershipTypeUniqueId/review",
  customForms: "/organizer/custom-form/list",
  customFormsCreate: "/organizer/custom-form/create-form",
  customFormsEdit: "/organizer/custom-form/:customFormUniqueId/edit",
} as const;

export function buildMembershipWizardStepPath(
  path: (typeof APP_ROUTES)[keyof typeof APP_ROUTES],
  membershipTypeUniqueId?: string,
  stepNo?: number,
) {
  if (path === APP_ROUTES.membershipWizardTitle && membershipTypeUniqueId) {
    const resolvedTitlePath = generatePath(APP_ROUTES.membershipWizardTitleWithId as string, {
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

  const resolvedPath = generatePath(path as string, { membershipTypeUniqueId });
  return stepNo ? `${resolvedPath}?stepNo=${stepNo}` : resolvedPath;
}

export function buildMembershipRegisterPath(membershipTypeUniqueId: string) {
  return generatePath(APP_ROUTES.membershipRegister as string, { membershipTypeUniqueId });
}

export function buildMembershipRegisterCountdownPath(membershipTypeUniqueId: string) {
  return generatePath(APP_ROUTES.membershipRegisterCountdown as string, { membershipTypeUniqueId });
}

export function buildCustomFormEditPath(customFormUniqueId: string) {
  return generatePath(APP_ROUTES.customFormsEdit as string, { customFormUniqueId });
}

export function buildMembershipMemberDetailPath(memberUniqueId: string) {
  return generatePath(APP_ROUTES.membershipMemberDetail as string, { memberUniqueId });
}
