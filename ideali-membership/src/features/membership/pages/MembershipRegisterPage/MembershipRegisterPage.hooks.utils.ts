import { DEFAULT_MEMBERSHIP_REGISTER_FORM, MEMBERSHIP_REGISTER_PAGE_COPY, PAYMENT_PRODUCT_LABELS } from "./MembershipRegisterPage.fields";
import { resolvePaymentProductId } from "../../../../services/membershipRegistration";
import type { MembershipRegistrationInfo } from "../../../../types/membershipRegistration";

export function buildPaymentCurrencyPrefix(info: MembershipRegistrationInfo | null) {
  const currencySymbol = info?.paymentSettings.paymentCurrencySymbol?.trim();
  const currencyCode = info?.paymentSettings.paymentCurrencyCode?.trim();

  if (currencyCode) {
    return `${currencyCode.toUpperCase()} $`;
  }

  if (currencySymbol) {
    return currencySymbol;
  }

  return "";
}

export function formatAmount(amount: number, info: MembershipRegistrationInfo | null) {
  if (!amount) {
    return MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const prefix = buildPaymentCurrencyPrefix(info);
  return prefix ? `${prefix}${formattedAmount}` : formattedAmount;
}

export function getPaymentMethodOptions(info: MembershipRegistrationInfo | null) {
  const options = [...(info?.paymentSettings.paymentProducts ?? [])];

  return options
    .filter((item, index, array) => array.findIndex((candidate) => candidate.name === item.name) === index)
    .map((item) => {
      const value = resolvePaymentProductId(item.name);
      if (!value) {
        return null;
      }

      return {
        value,
        label: item.displayName || PAYMENT_PRODUCT_LABELS[value] || item.name,
      };
    })
    .filter((item): item is { value: number; label: string } => item !== null);
}

export function parseDonationAmount(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}


