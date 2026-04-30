import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../types/membershipRegistration";

export function validateMembershipRegistrationForm(
  form: MembershipRegistrationFormState,
  info: MembershipRegistrationInfo | null,
) {
  const errors: Partial<Record<keyof MembershipRegistrationFormState, string>> = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!form.streetLine1.trim()) {
    errors.streetLine1 = "Street address is required.";
  }

  if (!form.zipCode.trim()) {
    errors.zipCode = "Zip code is required.";
  }

  const membershipDetail = info?.membershipDetail;
  const requiresPaymentMethod = Boolean(membershipDetail && !membershipDetail.isFree);
  const hasOnlineOptions = Boolean(info?.paymentSettings.paymentProducts.length);

  if (requiresPaymentMethod && hasOnlineOptions && !form.paymentMethod.trim()) {
    errors.paymentMethod = "Select a payment method.";
  }

  return errors;
}

