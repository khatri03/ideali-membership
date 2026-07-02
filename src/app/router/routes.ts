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
  membershipInvoices: "/organizer/membership/type/invoices",
  membershipInvoiceDetail: "/organizer/membership/type/invoices/:invoiceUniqueId/detail",
  membershipInvoiceView: "/organizer/membership/type/invoices/:invoiceUniqueId/view",
  membershipPolls: "/organizer/polls",
  membershipPollCreate: "/organizer/polls/create",
  membershipPollDetail: "/organizer/polls/:pollUniqueId/detail",
  membershipPollEdit: "/organizer/polls/:pollUniqueId/edit",
  membershipPollReviews: "/organizer/polls/:pollUniqueId/reviews",
  publicMembershipPollView: "/public/polls/:pollUniqueId",
  publicMembershipInvoiceView: "/public/membership-invoice/:invoiceUniqueId/view",
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

export function buildMembershipMembersPath(query?: {
  membershipStatuses?: string[];
  membershipTypeUniqueIds?: string[];
  pageNo?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();

  if (query?.membershipStatuses?.length) {
    query.membershipStatuses.forEach((membershipStatus) => {
      searchParams.append("membershipStatuses", membershipStatus);
    });
  }

  if (query?.membershipTypeUniqueIds?.length) {
    query.membershipTypeUniqueIds.forEach((membershipTypeUniqueId) => {
      searchParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
    });
  }

  if (query?.pageNo) {
    searchParams.set("pageNo", String(query.pageNo));
  }

  if (query?.pageSize) {
    searchParams.set("pageSize", String(query.pageSize));
  }

  const search = searchParams.toString();
  return search ? `${APP_ROUTES.membershipMembers}?${search}` : APP_ROUTES.membershipMembers;
}

export function buildMembershipInvoicesPath(query?: {
  searchTerm?: string;
  status?: string;
  membershipTypeUniqueIds?: string[];
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const searchParams = new URLSearchParams();

  if (query?.searchTerm?.trim()) {
    searchParams.set("searchTerm", query.searchTerm.trim());
  }

  if (query?.status?.trim()) {
    searchParams.set("status", query.status.trim());
  }

  if (query?.membershipTypeUniqueIds?.length) {
    query.membershipTypeUniqueIds.forEach((membershipTypeUniqueId) => {
      searchParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
    });
  }

  if (query?.pageNo) {
    searchParams.set("pageNo", String(query.pageNo));
  }

  if (query?.pageSize) {
    searchParams.set("pageSize", String(query.pageSize));
  }

  if (query?.sortBy?.trim()) {
    searchParams.set("sortBy", query.sortBy.trim());
  }

  if (query?.sortOrder) {
    searchParams.set("sortOrder", query.sortOrder);
  }

  const search = searchParams.toString();
  return search ? `${APP_ROUTES.membershipInvoices}?${search}` : APP_ROUTES.membershipInvoices;
}

export function buildMembershipInvoiceDetailPath(invoiceUniqueId: string) {
  return generatePath(APP_ROUTES.membershipInvoiceDetail as string, { invoiceUniqueId });
}

export function buildMembershipInvoiceViewPath(invoiceUniqueId: string) {
  return generatePath(APP_ROUTES.membershipInvoiceView as string, { invoiceUniqueId });
}

export function buildPublicMembershipInvoiceViewPath(invoiceUniqueId: string) {
  return generatePath(APP_ROUTES.publicMembershipInvoiceView as string, { invoiceUniqueId });
}

export function buildMembershipPollsPath() {
  return APP_ROUTES.membershipPolls;
}

export function buildMembershipPollCreatePath() {
  return APP_ROUTES.membershipPollCreate;
}

export function buildMembershipPollDetailPath(pollUniqueId: string) {
  return generatePath(APP_ROUTES.membershipPollDetail as string, { pollUniqueId });
}

export function buildMembershipPollEditPath(pollUniqueId: string) {
  return generatePath(APP_ROUTES.membershipPollEdit as string, { pollUniqueId });
}

export function buildMembershipPollReviewsPath(pollUniqueId: string) {
  return generatePath(APP_ROUTES.membershipPollReviews as string, { pollUniqueId });
}

export function buildPublicPollPath(pollUniqueId: string) {
  return generatePath(APP_ROUTES.publicMembershipPollView as string, { pollUniqueId });
}
