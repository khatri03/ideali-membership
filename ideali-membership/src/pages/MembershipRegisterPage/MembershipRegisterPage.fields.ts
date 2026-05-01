import type { MembershipRegistrationFormState } from "../../types/membershipRegistration";

export const PAYMENT_PRODUCT_LABELS: Record<number, string> = {
  1: "Debit / Credit Card",
  2: "Electronic Check",
  3: "Cheque",
  4: "ACH - USD",
  5: "PAD - CAD",
  6: "Tap to Pay",
  7: "Wallet Pay",
};

export const DEFAULT_MEMBERSHIP_REGISTER_FORM: MembershipRegistrationFormState = {
  prefix: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  cellPhone: "",
  streetLine1: "",
  streetLine2: "",
  zipCode: "",
  paymentMethod: "",
  notes: "",
};

export const MEMBERSHIP_REGISTER_PAGE_COPY = {
  eyebrow: "Public membership registration",
  title: "Join the membership in a few steps.",
  subtitle:
    "Review the plan, share your details, and complete the enrollment request using the payment method connected to this membership type.",
  priceFreeLabel: "Free",
  paymentFallbackLabel: "Cheque / offline payment",
  unavailableTitle: "Registration is not available yet.",
  unavailableBody:
    "This membership is not open for public registration right now. Please check back later or contact the organizer for help.",
  openingSoonTitle: "Registration opens in",
  openingSoonBody: "",
  openTitle: "Registration is open",
  openBody: "This membership is ready for public registration.",
};
