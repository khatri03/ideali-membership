import { APP_ROUTES } from "../../routes";

export interface MembershipWizardStep {
  label: string;
  description: string;
  to: (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
}

export const MEMBERSHIP_WIZARD_STEPS: MembershipWizardStep[] = [
  {
    label: "Membership Title",
    description: "Define the naming and identity of the membership plan.",
    to: APP_ROUTES.membershipWizardTitle,
  },
  {
    label: "Description",
    description: "Capture the membership summary and supporting copy.",
    to: APP_ROUTES.membershipWizardDescription,
  },
  {
    label: "Color",
    description: "Set the visual tone for the membership experience.",
    to: APP_ROUTES.membershipWizardColor,
  },
  {
    label: "Banner",
    description: "Upload or configure the banner presentation.",
    to: APP_ROUTES.membershipWizardBanner,
  },
  {
    label: "Pricing",
    description: "Choose pricing tiers and plan structure.",
    to: APP_ROUTES.membershipWizardPricing,
  },
  {
    label: "Custom Forms",
    description: "Attach the custom forms that members must complete.",
    to: APP_ROUTES.membershipWizardCustomForms,
  },
  {
    label: "Thank you Email",
    description: "Configure the confirmation email after completion.",
    to: APP_ROUTES.membershipWizardThankYouEmail,
  },
  {
    label: "Advance Settings",
    description: "Tune advanced behavior and operational settings.",
    to: APP_ROUTES.membershipWizardAdvanceSettings,
  },
  {
    label: "Review",
    description: "Review the full setup before publishing.",
    to: APP_ROUTES.membershipWizardReview,
  },
];
