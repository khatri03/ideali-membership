import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../types/membershipRegistration";

export function validateMembershipRegistrationForm(
  form: MembershipRegistrationFormState,
  info: MembershipRegistrationInfo | null,
) {
  const errors: Partial<Record<keyof MembershipRegistrationFormState, string>> = {};

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.addressType.trim()) {
    errors.addressType = "Address type is required.";
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
    errors.streetLine1 = "Street line 1 is required.";
  }

  if (form.donationAmount.trim()) {
    const parsedDonationAmount = Number(form.donationAmount.replace(/,/g, ""));
    if (!Number.isFinite(parsedDonationAmount) || parsedDonationAmount < 0) {
      errors.donationAmount = "Enter a valid donation amount.";
    }
  }

  if (form.tipAmount.trim()) {
    const parsedTipAmount = Number(form.tipAmount.replace(/,/g, ""));
    if (!Number.isFinite(parsedTipAmount) || parsedTipAmount < 0) {
      errors.tipAmount = "Enter a valid tip amount.";
    }
  }

  const membershipDetail = info?.membershipDetail;
  const donationAmount = form.donationAmount.trim() ? Number(form.donationAmount.replace(/,/g, "")) : 0;
  const requiresPaymentMethod = Boolean(membershipDetail && (!membershipDetail.isFree || donationAmount > 0));

  if (requiresPaymentMethod && !form.paymentMethod.trim()) {
    errors.paymentMethod = "Select a payment method.";
  }

  return errors;
}
