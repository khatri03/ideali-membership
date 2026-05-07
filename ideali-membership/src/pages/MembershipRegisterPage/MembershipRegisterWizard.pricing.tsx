import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import { MembershipDescriptionPanel, type MembershipTheme } from "./MembershipRegisterWizard.shared";
import type { MembershipRegistrationFormState, MembershipRegistrationInfo } from "../../types/membershipRegistration";

function parseDonationAmount(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCurrencyPrefix(info: MembershipRegistrationInfo) {
  const currencySymbol = info.paymentSettings.paymentCurrencySymbol?.trim();
  const currencyCode = info.paymentSettings.paymentCurrencyCode?.trim();

  if (currencyCode) {
    return `${currencyCode.toUpperCase()} $`;
  }

  if (currencySymbol) {
    return currencySymbol;
  }

  return "";
}

function formatShortExpiryLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatMonthDayLabel(month: number | null, day: number | null) {
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

function formatRenewalDueLabel(month: number | null, day: number | null) {
  const monthDayLabel = formatMonthDayLabel(month, day);

  if (!monthDayLabel) {
    return null;
  }

  return `Renewal due on\u00A0${monthDayLabel}`;
}

function renderRenewalDueLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const renewalPrefix = "Renewal due on\u00A0";
  if (label.startsWith(renewalPrefix)) {
    return (
      <>
        {renewalPrefix}
        <span className="font-semibold">{label.slice(renewalPrefix.length)}</span>
      </>
    );
  }

  return label;
}

function formatTenureLabel(value: string | number | null) {
  const tenureMap: Record<number, string> = {
    1: "Monthly",
    2: "Annual",
    3: "Life Time",
    4: "Custom",
  };

  if (typeof value === "number") {
    return tenureMap[value] ?? "Membership";
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "Membership";
}

function isLifetimeTenure(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "lifetime" || normalized === "life time";
}

function formatTenureWithExpiryLabel(info: MembershipRegistrationInfo) {
  const tenureLabel = formatTenureLabel(info.membershipDetail.tenure);
  const annualExpiryLabel = formatRenewalDueLabel(
    info.membershipDetail.annualExpiryMonth,
    info.membershipDetail.annualExpiryDay,
  );
  const customExpiryLabel =
    info.membershipDetail.tenure === "Custom" || info.membershipDetail.tenure === 4
      ? info.membershipDetail.customExpiryDays
        ? `${info.membershipDetail.customExpiryDays} Days`
        : formatShortExpiryLabel(info.membershipDetail.customExpiryDate)
      : null;

  if (tenureLabel === "Monthly") {
    return { tenureLabel, expiryLabel: "Requires monthly renewal" };
  }

  if (tenureLabel === "Annual") {
    return { tenureLabel, expiryLabel: annualExpiryLabel ?? "Every Year" };
  }

  if (isLifetimeTenure(tenureLabel)) {
    return { tenureLabel, expiryLabel: "No Expiry" };
  }

  if (tenureLabel === "Custom") {
    return { tenureLabel, expiryLabel: customExpiryLabel ?? "No Expiry" };
  }

  return { tenureLabel, expiryLabel: annualExpiryLabel ?? customExpiryLabel ?? null };
}

type PricingStepProps = {
  info: MembershipRegistrationInfo;
  formattedMembershipCharges: string;
  theme: MembershipTheme;
  membershipDescription: string;
  form: MembershipRegistrationFormState;
  setField: MembershipRegisterPageViewModel["setField"];
  formatDonationAmountInput: (value: string) => string;
  normalizeDonationAmountInput: (value: string) => string;
};

export function PricingStep({
  info,
  formattedMembershipCharges,
  theme,
  membershipDescription,
  form,
  setField,
  formatDonationAmountInput,
  normalizeDonationAmountInput,
}: PricingStepProps) {
  const tenureInfo = formatTenureWithExpiryLabel(info);
  const donationCampaignName = info.membershipDetail.donationCampaignName?.trim();
  const donationCampaignAmount = parseDonationAmount(form.donationAmount);
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const totalAmount = membershipAmount + donationCampaignAmount;
  const totalAmountLabel =
    totalAmount > 0
      ? `${currencyPrefix}${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalAmount)}`
      : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_7fr] xl:gap-6">
      <MembershipDescriptionPanel description={membershipDescription} theme={theme} />

      <div className="space-y-5 rounded-3xl p-4 sm:p-5" style={{ background: theme.cardBackground }}>
        <div className="space-y-3 lg:flex lg:items-start lg:justify-between lg:gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: theme.titleColor }}>
                {info.membershipDetail.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-base font-semibold leading-6" style={{ color: theme.bodyColor }}>
                {info.organizerName ? (
                  <span>
                    by <span className="font-extrabold uppercase">{info.organizerName}</span>
                  </span>
                ) : null}

                {tenureInfo.expiryLabel ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold leading-5"
                    style={{
                      color: theme.level1,
                      borderColor: theme.level1,
                      background: theme.cardBackground,
                    }}
                  >
                    {renderRenewalDueLabel(tenureInfo.expiryLabel)}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="text-base leading-6" style={{ color: theme.bodyColor }}>
              Review the membership charge before moving ahead.
            </p>
          </div>
          {donationCampaignName ? (
            <div
              className="w-full rounded-2xl px-4 py-3 text-center sm:max-w-sm sm:px-5 sm:py-4 lg:ml-auto lg:min-w-56"
              style={{ background: theme.tileBackground }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                Total Payable
              </span>
              <span className="mt-2 block text-2xl font-bold sm:text-3xl" style={{ color: theme.level1 }}>
                {totalAmountLabel}
              </span>
            </div>
          ) : null}
        </div>
        <div className="h-px w-full" style={{ background: theme.tileBorder, opacity: 0.7 }} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              Amount
            </p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: theme.level1 }}>
              {formattedMembershipCharges}
            </p>
          </div>

          {info.membershipDetail.donationCampaignName ? (
            <div className="space-y-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4" style={{ background: theme.tileBackground }}>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                  Donation Campaign
                </p>
                <p className="text-base font-semibold" style={{ color: theme.tileValueColor }}>
                  {donationCampaignName}
                </p>
              </div>
              <label className="flex min-w-0 items-stretch overflow-hidden rounded-2xl border" style={{ borderColor: theme.cardBorder }}>
                <span
                  className="flex shrink-0 items-center whitespace-nowrap border-r px-3 text-sm font-semibold"
                  style={{ borderColor: theme.cardBorder, color: theme.tileValueColor, background: theme.level3 }}
                >
                  {currencyPrefix}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.donationAmount}
                  onChange={(event) => setField("donationAmount", formatDonationAmountInput(event.target.value))}
                  onBlur={(event) => setField("donationAmount", normalizeDonationAmountInput(event.target.value))}
                  placeholder="0.00"
                  className="w-full bg-white px-4 py-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                  style={{ color: theme.titleColor }}
                />
              </label>
              <p className="text-xs leading-5" style={{ color: theme.mutedLabelColor }}>
                Optional. Leave blank if you do not want to donate.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
