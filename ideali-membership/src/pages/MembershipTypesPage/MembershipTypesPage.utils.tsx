import type { MembershipTypeListItem } from "../../types/membership";

export function showToast(message: string) {
  const existingToast = document.getElementById("membership-order-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "membership-order-toast";
  toast.className =
    "fixed right-6 top-6 z-[1300] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl";
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function formatCurrencyAmount(value: number, currencyCode: string | null, currencySymbol: string | null) {
  if (!value) {
    return "Free";
  }

  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const resolvedCurrencyPrefix = currencyCode?.trim()
    ? currencyCode.trim().toUpperCase()
    : currencySymbol?.trim() ?? "";

  return `${resolvedCurrencyPrefix}${amount}`;
}

export function formatSetupStateLabel(value: string) {
  if (!value) {
    return "Draft";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready To Go Live";
  }

  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function getSetupStatePillValue(value: string) {
  if (value === "Published") {
    return "Live";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "Ready For Review";
  }

  return formatSetupStateLabel(value);
}

export function getSetupStatePillTone(value: string): "neutral" | "success" | "warning" {
  if (value === "Published") {
    return "success";
  }

  if (value === "ReadyForReview" || value === "Ready For Review") {
    return "warning";
  }

  return "neutral";
}

export function getTenureLabel(value: string | null) {
  return value || "â€”";
}

export function isLifetimeTenure(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

export function formatUtcDateLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = monthLabels[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  if (!month) {
    return null;
  }

  return `${day}-${month}-${year}`;
}

export function getTenureDisplayLabel(item: MembershipTypeListItem) {
  return getTenureLabel(item.tenureText);
}

export function getTenureExpiryCaseLabel(item: MembershipTypeListItem) {
  if (item.tenureText === "Monthly") {
    return "Requires monthly renewal";
  }

  if (item.tenureText === "Annual") {
    if (item.annualExpiryMonth && item.annualExpiryDay) {
      const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabel = monthLabels[item.annualExpiryMonth - 1];

      if (monthLabel) {
        return `Renewal due on ${String(item.annualExpiryDay).padStart(2, "0")}-${monthLabel}`;
      }
    }

    return "Every Year";
  }

  if (isLifetimeTenure(item.tenureText)) {
    return "No Expiry";
  }

  if (item.tenureText === "Custom" && item.customExpiryDays) {
    return `${item.customExpiryDays} Days`;
  }

  return null;
}

export function renderTenureExpiryCaseLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const renewalPrefix = "Renewal due on ";
  if (label.startsWith(renewalPrefix)) {
    return (
      <>
        {renewalPrefix}
        <span className="font-semibold text-slate-700">{label.slice(renewalPrefix.length)}</span>
      </>
    );
  }

  return label;
}

export function getTenureWindowLabel(item: MembershipTypeListItem) {
  const startDate = item.registrationStartDateUtc ? new Date(item.registrationStartDateUtc) : null;
  const endDate = item.registrationEndDateUtc ? new Date(item.registrationEndDateUtc) : null;
  const now = Date.now();
  const startVisible = Boolean(startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() > now);
  const endVisible = Boolean(endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() > now);

  const startLabel = startVisible ? formatUtcDateLabel(item.registrationStartDateUtc) : null;
  const endLabel = endVisible ? formatUtcDateLabel(item.registrationEndDateUtc) : null;

  if (startLabel && endLabel) {
    return `From ${startLabel} to ${endLabel}`;
  }

  if (startLabel) {
    return `From ${startLabel}`;
  }

  if (endLabel) {
    return `Available Till ${endLabel}`;
  }

  return null;
}

export function canShowStatusMenu(setupState: string) {
  return setupState === "ReadyForReview" || setupState === "Published";
}

export function canShowMemberMenu(setupState: string) {
  return setupState === "Published";
}

export function canCopyRegistrationLink(item: MembershipTypeListItem) {
  if (item.setupState !== "Published" || !item.availableForSignUp) {
    return false;
  }

  const startDate = item.registrationStartDateUtc ? new Date(item.registrationStartDateUtc) : null;
  const endDate = item.registrationEndDateUtc ? new Date(item.registrationEndDateUtc) : null;
  const now = Date.now();

  if (startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() > now) {
    return false;
  }

  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() <= now) {
    return false;
  }

  return true;
}
