import { useEffect, useMemo, useRef, useState } from "react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type { MembershipRegisterPageViewModel } from "./MembershipRegisterPage.types";
import type {
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationStripeCredentials,
} from "../../types/membershipRegistration";
import { fetchStripePublicCredentials, resolvePaymentProductId } from "../../lib/membershipRegistration";

type MembershipTheme = {
  accentRgb: { r: number; g: number; b: number };
  level1: string;
  level2: string;
  level3: string;
  pageBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  iconBackground: string;
  iconBorder: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  labelColor: string;
  mutedLabelColor: string;
  tileBorder: string;
  tileBackground: string;
  tileLabelColor: string;
  tileValueColor: string;
  barBackground: string;
};

type PaymentStepProps = {
  info: MembershipRegistrationInfo;
  form: MembershipRegistrationFormState;
  paymentMethodError?: string;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  currencyPrefix: string;
  membershipAmount: number;
  priceFreeLabel: string;
  parseDonationAmount: (value: string) => number;
  formatDonationAmountInput: (value: string) => string;
  normalizeDonationAmountInput: (value: string) => string;
};

function PaymentCheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7.8 13.7 4.6 10.5l-1.5 1.5 4.7 4.7 9.2-9.2-1.5-1.5z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.41Z" />
    </svg>
  );
}

function StripeCardFields({ theme }: { theme: MembershipTheme }) {
  const stripeInputClassName = "w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm";
  const stripeInputOptions = {
    disableLink: true,
    style: {
      base: {
        color: theme.titleColor,
        fontSize: "16px",
        "::placeholder": {
          color: theme.mutedLabelColor,
        },
      },
      invalid: {
        color: "#dc2626",
      },
    },
  };
  const cardCvcElementRef = useRef<{ focus: () => void } | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[3fr_1fr_1fr]">
        <div className="space-y-2 md:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
            Credit card
          </p>
          <div className={stripeInputClassName} style={{ borderColor: theme.cardBorder }}>
            <CardNumberElement options={stripeInputOptions} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
            Expiry
          </p>
          <div className={stripeInputClassName} style={{ borderColor: theme.cardBorder }}>
            <CardExpiryElement
              options={stripeInputOptions}
              onChange={(event) => {
                if (event.complete) {
                  cardCvcElementRef.current?.focus();
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
            CVV
          </p>
          <div className={stripeInputClassName} style={{ borderColor: theme.cardBorder }}>
            <CardCvcElement
              options={stripeInputOptions}
              onReady={(element) => {
                cardCvcElementRef.current = element;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentStep({
  info,
  form,
  paymentMethodError,
  setField,
  theme,
  currencyPrefix,
  membershipAmount,
  priceFreeLabel,
  parseDonationAmount,
  formatDonationAmountInput,
  normalizeDonationAmountInput,
}: PaymentStepProps) {
  const paymentProducts = useMemo(() => {
    return info.paymentSettings.paymentProducts.filter(
      (product, index, array) => array.findIndex((candidate) => candidate.name === product.name) === index,
    );
  }, [info.paymentSettings.paymentProducts]);
  const paymentAccountUniqueId = info.paymentSettings.paymentAccountUniqueId?.trim();
  const donationCampaignName = info.membershipDetail.donationCampaignName?.trim();
  const donationAmount = donationCampaignName ? parseDonationAmount(form.donationAmount) : 0;
  const presetTips = info.presetTips ?? [];
  const tipAmount = presetTips.length > 0 ? parseDonationAmount(form.tipAmount) : 0;
  const selectedTipPercent = presetTips.length > 0 ? Number(form.tipPresetPercent) : 0;
  const tipAmountInputRef = useRef<HTMLInputElement | null>(null);
  const totalAmount = membershipAmount + donationAmount + tipAmount;
  const [stripeCredentials, setStripeCredentials] = useState<MembershipRegistrationStripeCredentials | null>(null);
  const [stripeCredentialsLoading, setStripeCredentialsLoading] = useState(false);
  const [stripeCredentialsError, setStripeCredentialsError] = useState("");
  const formatMoney = (amount: number) => {
    return `${currencyPrefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };
  const totalAmountLabel = totalAmount > 0 ? formatMoney(totalAmount) : priceFreeLabel;
  const stripePromise = useMemo(() => {
    if (!stripeCredentials) {
      return null;
    }

    return loadStripe(stripeCredentials.publishableKey, {
      stripeAccount: stripeCredentials.stripeAccount,
    });
  }, [stripeCredentials]);

  useEffect(() => {
    if (!selectedTipPercent || !presetTips.length) {
      return;
    }

    const matchingPreset = presetTips.find((presetTip) => presetTip.percent === selectedTipPercent);
    if (!matchingPreset) {
      return;
    }

    const presetBaseAmount = membershipAmount + donationAmount;
    const nextTipAmount = ((presetBaseAmount * matchingPreset.percent) / 100).toFixed(2);

    if (form.tipAmount !== nextTipAmount) {
      setField("tipAmount", nextTipAmount);
    }
  }, [donationAmount, form.tipAmount, membershipAmount, presetTips, selectedTipPercent, setField]);

  const selectedPaymentProduct = useMemo(() => {
    const selectedProductId = form.paymentMethod.trim();
    if (!selectedProductId) {
      return null;
    }

    return (
      paymentProducts.find((product) => {
        const productId = resolvePaymentProductId(product.name);
        return productId ? String(productId) === selectedProductId : false;
      }) ?? null
    );
  }, [form.paymentMethod, paymentProducts]);

  const [openPaymentProduct, setOpenPaymentProduct] = useState<string | null>(null);
  const didInitializeOpenStateRef = useRef(false);

  useEffect(() => {
    if (!paymentAccountUniqueId || selectedPaymentProduct?.name !== "CreditCard") {
      setStripeCredentials(null);
      setStripeCredentialsError("");
      setStripeCredentialsLoading(false);
      return;
    }

    let isMounted = true;
    setStripeCredentialsLoading(true);
    setStripeCredentialsError("");

    void (async () => {
      try {
        const credentials = await fetchStripePublicCredentials(paymentAccountUniqueId);
        if (!isMounted) {
          return;
        }

        setStripeCredentials(credentials);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStripeCredentials(null);
        setStripeCredentialsError(error instanceof Error ? error.message : "Unable to load Stripe credentials.");
      } finally {
        if (isMounted) {
          setStripeCredentialsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [paymentAccountUniqueId, selectedPaymentProduct?.name]);

  useEffect(() => {
    if (didInitializeOpenStateRef.current || paymentProducts.length === 0) {
      return;
    }

    didInitializeOpenStateRef.current = true;
    setOpenPaymentProduct(selectedPaymentProduct?.name ?? paymentProducts[0]?.name ?? null);
  }, [paymentProducts, selectedPaymentProduct]);

  if (paymentProducts.length === 0) {
    return (
      <div className="rounded-3xl border px-4 py-5 text-sm leading-6" style={{ borderColor: theme.cardBorder }}>
        No payment methods are currently available for this membership.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethodError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800 shadow-sm">
          {paymentMethodError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            Choose one payment method below. You can expand a card to review it and collapse it again if needed.
          </div>

          <div className="space-y-3">
            {paymentProducts.map((product) => {
              const isOpen = openPaymentProduct === product.name;
              const productId = resolvePaymentProductId(product.name);
              const isSelected = productId ? form.paymentMethod.trim() === String(productId) : false;
              const panelId = `payment-method-panel-${product.name}`;
              const buttonId = `payment-method-button-${product.name}`;
              const headerLabel = product.displayName || product.name;

              return (
                <section
                  key={product.name}
                  className="overflow-hidden rounded-3xl border transition"
                  style={{
                    borderColor: isOpen || isSelected ? theme.level1 : theme.cardBorder,
                    background: theme.cardBackground,
                  }}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      if (productId) {
                        setField("paymentMethod", String(productId));
                      }

                      setOpenPaymentProduct((current) => (current === product.name ? null : product.name));
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            borderColor: isSelected ? theme.level1 : theme.cardBorder,
                            background: isSelected ? theme.level1 : "transparent",
                            color: isSelected ? "#fff" : theme.bodyColor,
                          }}
                          aria-hidden="true"
                        >
                          {isSelected ? <PaymentCheckIcon className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="truncate text-base font-semibold" style={{ color: theme.titleColor }}>
                          {headerLabel}
                        </span>
                      </div>
                    </div>

                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition"
                      style={{
                        borderColor: isOpen ? theme.level1 : theme.cardBorder,
                        color: theme.titleColor,
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className={
                          isOpen ? "rotate-180 transform transition-transform duration-300 ease-out" : "transition-transform duration-300 ease-out"
                        }
                      >
                        <ChevronDownIcon />
                      </span>
                    </span>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="overflow-hidden border-t px-4"
                      style={{ borderColor: theme.cardBorder }}
                    >
                      <div className="py-4">
                        <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
                          {product.name === "CreditCard"
                            ? "Debit/Credit Card will be used for this registration. You can collapse this card after selecting it."
                            : `${headerLabel} will be used for this registration. You can collapse this card after selecting it.`}
                        </p>
                        {product.name === "CreditCard" && isSelected ? (
                          <div className="mt-4">
                            {stripeCredentialsLoading ? (
                              <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: theme.cardBorder }}>
                                Loading card fields...
                              </div>
                            ) : stripeCredentialsError ? (
                              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                                {stripeCredentialsError}
                              </div>
                            ) : stripePromise ? (
                              <Elements stripe={stripePromise}>
                                <StripeCardFields theme={theme} />
                              </Elements>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div
          className="order-1 space-y-2 rounded-3xl border px-4 py-4 sm:px-5 sm:py-5 lg:order-2 lg:self-start"
          style={{ borderColor: theme.cardBorder, background: theme.tileBackground }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
              What you will pay
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: theme.bodyColor }}>
              Review the amount before selecting a payment method.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl px-4 py-4" style={{ background: theme.cardBackground }}>
            <div className="grid gap-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                  Membership
                </p>
                <p className="text-base font-semibold text-right" style={{ color: theme.tileValueColor }}>
                  {membershipAmount > 0 ? formatMoney(membershipAmount) : priceFreeLabel}
                </p>
              </div>

              {donationCampaignName ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                      Donation
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5">{donationCampaignName}</p>
                  </div>
                  <div className="w-[200px]">
                    <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                      <span
                        className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                        style={{ color: theme.tileValueColor, background: theme.level3 }}
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
                        className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                        style={{ color: theme.titleColor }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {presetTips.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)_minmax(0,200px)] sm:items-center">
                    <div className="min-w-0 sm:self-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                        Tip
                      </p>
                    </div>

                    <div className="min-w-0">
                      <select
                        value={form.tipPresetPercent}
                        onChange={(event) => {
                          if (event.target.value === "other") {
                            setField("tipPresetPercent", "other");
                            setField("tipAmount", "");
                            window.setTimeout(() => {
                              tipAmountInputRef.current?.focus();
                            }, 0);
                            return;
                          }

                          const selectedPreset = presetTips.find((presetTip) => String(presetTip.percent) === event.target.value);
                          if (!selectedPreset) {
                            setField("tipPresetPercent", "");
                            return;
                          }

                          const presetBaseAmount = membershipAmount + donationAmount;
                          const presetAmount = (presetBaseAmount * selectedPreset.percent) / 100;
                          setField("tipPresetPercent", event.target.value);
                          setField("tipAmount", presetAmount > 0 ? presetAmount.toFixed(2) : "");
                        }}
                        className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                        style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
                      >
                        {presetTips.map((presetTip) => (
                          <option key={presetTip.percent} value={presetTip.percent}>
                            {presetTip.percent}%
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="w-full sm:max-w-[200px]">
                      <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                        <span
                          className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                          style={{ color: theme.tileValueColor, background: theme.level3 }}
                        >
                          {currencyPrefix}
                        </span>
                        <input
                          ref={tipAmountInputRef}
                          type="text"
                          inputMode="decimal"
                          value={form.tipAmount}
                          onChange={(event) => {
                            setField("tipPresetPercent", "other");
                            setField("tipAmount", formatDonationAmountInput(event.target.value));
                          }}
                          onBlur={(event) => {
                            setField("tipPresetPercent", "other");
                            setField("tipAmount", normalizeDonationAmountInput(event.target.value));
                          }}
                          placeholder="0.00"
                          className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                          style={{ color: theme.titleColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] leading-4 tracking-wide">
                    <span aria-hidden="true" className="text-[12px] leading-none text-red-500">
                      â™¥
                    </span>{" "}
                    If you would like to give a little extra, your tip goes a long way in supporting us.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t" style={{ borderColor: theme.cardBorder }} />

          <div className="rounded-2xl px-4 py-3" style={{ background: theme.cardBackground }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
                Total payable
              </p>
              <p className="text-2xl font-bold text-right sm:text-3xl" style={{ color: theme.level1 }}>
                {totalAmountLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
