import React from "react";

export const MembershipRegisterCountdownPage = React.lazy(() =>
  import("../../features/membership/pages/MembershipRegisterCountdownPage").then((m) => ({ default: m.MembershipRegisterCountdownPage })),
);
export const DashboardPage = React.lazy(() =>
  import("../../features/membership/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
export const MembershipTypesPage = React.lazy(() =>
  import("../../features/membership/pages/MembershipTypesPage").then((m) => ({ default: m.MembershipTypesPage })),
);
export const MembersPage = React.lazy(() =>
  import("../../features/membership/pages/MembersPage").then((m) => ({ default: m.MembersPage })),
);
export const MemberDetailPage = React.lazy(() =>
  import("../../features/membership/pages/MemberDetailPage").then((m) => ({ default: m.MemberDetailPage })),
);
export const MembershipInvoicesPage = React.lazy(() =>
  import("../../features/membership/pages/MembershipInvoicesPage").then((m) => ({ default: m.MembershipInvoicesPage })),
);
export const MembershipInvoiceDetailPage = React.lazy(() =>
  import("../../features/membership/pages/MembershipInvoiceDetailPage").then((m) => ({ default: m.MembershipInvoiceDetailPage })),
);
export const PollsPage = React.lazy(() =>
  import("../../features/polls/pages").then((m) => ({ default: m.PollsPage })),
);
export const PollCreatePage = React.lazy(() =>
  import("../../features/polls/pages").then((m) => ({ default: m.PollCreatePage })),
);
export const PollDetailPage = React.lazy(() =>
  import("../../features/polls/pages").then((m) => ({ default: m.PollDetailPage })),
);
export const PollVotePage = React.lazy(() =>
  import("../../features/polls/pages").then((m) => ({ default: m.PollVotePage })),
);
export const PollReviewsPage = React.lazy(() =>
  import("../../features/polls/pages").then((m) => ({ default: m.PollReviewsPage })),
);
export const CustomFormsPage = React.lazy(() =>
  import("../../pages/CustomFormsPage").then((m) => ({ default: m.CustomFormsPage })),
);
export const CustomFormCreatePage = React.lazy(() =>
  import("../../pages/CustomFormCreatePage").then((m) => ({ default: m.CustomFormCreatePage })),
);
export const DnDGridSortExamplePage = React.lazy(() =>
  import("../../pages/DnDGridSortExamplePage").then((m) => ({ default: m.DnDGridSortExamplePage })),
);
export const SimplePage = React.lazy(() =>
  import("../../pages/SimplePage").then((m) => ({ default: m.SimplePage })),
);

export const MembershipTitleStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipTitleStepPage").then((m) => ({ default: m.MembershipTitleStepPage })),
);
export const MembershipWizardResumePage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipWizardResumePage").then((m) => ({ default: m.MembershipWizardResumePage })),
);
export const MembershipDescriptionStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipDescriptionStepPage").then((m) => ({ default: m.MembershipDescriptionStepPage })),
);
export const MembershipColorStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipColorStepPage").then((m) => ({ default: m.MembershipColorStepPage })),
);
export const MembershipBannerStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipBannerStepPage").then((m) => ({ default: m.MembershipBannerStepPage })),
);
export const MembershipPaymentAccountStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipPaymentAccountStepPage").then((m) => ({ default: m.MembershipPaymentAccountStepPage })),
);
export const MembershipPricingStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipPricingStepPage").then((m) => ({ default: m.MembershipPricingStepPage })),
);
export const MembershipDiscountCouponsStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipDiscountCouponsStepPage").then((m) => ({ default: m.MembershipDiscountCouponsStepPage })),
);
export const MembershipQuestionsStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipQuestionsStepPage").then((m) => ({ default: m.MembershipQuestionsStepPage })),
);
export const MembershipThankYouEmailStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipThankYouEmailStepPage").then((m) => ({ default: m.MembershipThankYouEmailStepPage })),
);
export const MembershipAdvanceSettingsStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipAdvanceSettingsStepPage").then((m) => ({ default: m.MembershipAdvanceSettingsStepPage })),
);
export const MembershipReviewStepPage = React.lazy(() =>
  import("../../features/membership/wizard/pages/MembershipReviewStepPage").then((m) => ({ default: m.MembershipReviewStepPage })),
);
