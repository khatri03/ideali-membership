import type { MembershipReviewInfo } from "../../../types/membership";

export function formatCurrencyAmount(amount: number, isFree: boolean, currencyCode?: string | null) {
  if (isFree || amount === 0) {
    return "Free";
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencySymbol(currencyCode?: string | null) {
  switch (currencyCode?.trim().toUpperCase()) {
    case "USD":
      return "$";
    case "CAD":
      return "C$";
    default:
      return "";
  }
}

export function formatTenureLabel(review: MembershipReviewInfo) {
  const tenureMap: Record<number, string> = {
    1: "Monthly",
    2: "Annual",
    3: "Life Time",
    4: "Custom",
  };

  return review.tenure ? tenureMap[review.tenure] ?? "No" : "No";
}

export function formatShortExpiryLabel(month?: number | null, day?: number | null) {
  if (!month || !day) {
    return null;
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = monthLabels[month - 1];

  if (!monthLabel) {
    return null;
  }

  return `${String(day).padStart(2, "0")}-${monthLabel}`;
}

export function formatSetupStateLabel(setupState: string) {
  const normalized = setupState.trim();
  if (!normalized) {
    return "Draft";
  }

  return normalized
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}
