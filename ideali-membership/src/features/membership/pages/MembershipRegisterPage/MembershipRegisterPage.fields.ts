import type { MembershipRegistrationFormState } from "../../../../types/membershipRegistration";

export const PAYMENT_PRODUCT_LABELS: Record<number, string> = {
  1: "Debit/Credit Card",
  5: "PAD-CAD",
  7: "Wallet Pay",
};

export const DEFAULT_MEMBERSHIP_REGISTER_FORM: MembershipRegistrationFormState = {
  profilePhotoFile: null,
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
  addressType: "",
  cityName: "",
  countryId: "",
  stateId: "",
  donationAmount: "",
  tipAmount: "",
  tipPresetPercent: "",
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

