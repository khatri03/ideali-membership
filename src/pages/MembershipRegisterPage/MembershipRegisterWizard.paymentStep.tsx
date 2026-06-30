import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { MembershipRegisterPageViewModel, MembershipTheme } from "./MembershipRegisterPage.types";
import { MEMBERSHIP_REGISTER_PAGE_COPY } from "./MembershipRegisterPage.fields";
import type {
  DiscountCouponValidationResult,
  MembershipRegistrationFormState,
  MembershipRegistrationInfo,
  MembershipRegistrationStripeCredentials,
} from "../../types/membershipRegistration";
import { fetchStripePublicCredentials, resolvePaymentProductId } from "../../lib/membershipRegistration";
import type { StripeCardPaymentMethodCreator } from "./MembershipRegisterWizard.types";
import { buildCurrencyPrefix, formatAmountInput, normalizeAmountInput, parseTipAmount } from "./MembershipRegisterWizard.utils";
import { CheckIcon } from "./MembershipRegisterWizard.parts";

export type PaymentStepProps = {
  info: MembershipRegistrationInfo;
  form: MembershipRegistrationFormState;
  paymentMethodError?: string;
  isCreditCardFieldsComplete: boolean;
  showCreditCardFieldErrors: boolean;
  onStripeCardPaymentMethodCreatorReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onStripeCardFieldsCompleteChange: (isComplete: boolean) => void;
  setField: MembershipRegisterPageViewModel["setField"];
  theme: MembershipTheme;
  couponValidation: DiscountCouponValidationResult | null;
  couponValidationError: string;
  isValidatingCoupon: boolean;
  isCouponApplied: boolean;
  onValidateCoupon: () => void;
  onClearCoupon: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
};

function StripeCardFields({
  theme,
  onCreatePaymentMethodReady,
  onCardFieldsCompleteChange,
  showFieldErrors,
}: {
  theme: MembershipTheme;
  onCreatePaymentMethodReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onCardFieldsCompleteChange: (isComplete: boolean) => void;
  showFieldErrors: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const stripeInputClassName =
    "w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm";
  const stripeInputStyle = {
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
  const cardNumberElementOptions = {
    ...stripeInputStyle,
    disableLink: true,
  };
  const [isCardNumberComplete, setIsCardNumberComplete] = useState(false);
  const [isCardExpiryComplete, setIsCardExpiryComplete] = useState(false);
  const [isCardCvcComplete, setIsCardCvcComplete] = useState(false);
  const cardExpiryElementRef = useRef<{ focus: () => void } | null>(null);
  const cardCvcElementRef = useRef<{ focus: () => void } | null>(null);

  useEffect(() => {
    onCardFieldsCompleteChange(
      isCardNumberComplete && isCardExpiryComplete && isCardCvcComplete,
    );
  }, [
    isCardCvcComplete,
    isCardExpiryComplete,
    isCardNumberComplete,
    onCardFieldsCompleteChange,
  ]);

  useEffect(() => {
    if (!stripe || !elements) {
      onCreatePaymentMethodReady(null);
      onCardFieldsCompleteChange(false);
      return;
    }

    const createPaymentMethod: StripeCardPaymentMethodCreator = async (
      cardHolderName: string,
    ) => {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found.");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: cardHolderName,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Unable to create payment method.");
      }

      return { id: paymentMethod.id };
    };

    onCreatePaymentMethodReady(createPaymentMethod);

    return () => {
      onCreatePaymentMethodReady(null);
      onCardFieldsCompleteChange(false);
    };
  }, [
    elements,
    onCardFieldsCompleteChange,
    onCreatePaymentMethodReady,
    stripe,
  ]);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[3fr_1fr_1fr]">
          <div className="space-y-2 md:col-span-1">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Credit card
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardNumberElement
                options={cardNumberElementOptions}
                onChange={(event) => {
                  setIsCardNumberComplete(event.complete);
                }}
              />
            </div>
            {showFieldErrors && !isCardNumberComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                Credit card required.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              Expiry
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardExpiryElement
                options={stripeInputStyle}
                onChange={(event) => {
                  setIsCardExpiryComplete(event.complete);
                  if (event.complete) {
                    cardCvcElementRef.current?.focus();
                  }
                }}
                onReady={(element) => {
                  cardExpiryElementRef.current = element;
                }}
              />
            </div>
            {showFieldErrors && !isCardExpiryComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                Expiry required.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              CVV
            </p>
            <div
              className={stripeInputClassName}
              style={{ borderColor: theme.cardBorder }}
            >
              <CardCvcElement
                options={stripeInputStyle}
                onChange={(event) => {
                  setIsCardCvcComplete(event.complete);
                }}
                onReady={(element) => {
                  cardCvcElementRef.current = element;
                }}
              />
            </div>
            {showFieldErrors && !isCardCvcComplete ? (
              <p className="text-xs font-medium leading-5 text-rose-600">
                CVV required.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StripeElementsFields({
  theme,
  stripeCredentials,
  onCreatePaymentMethodReady,
  onCardFieldsCompleteChange,
  showFieldErrors,
}: {
  theme: MembershipTheme;
  stripeCredentials: MembershipRegistrationStripeCredentials;
  onCreatePaymentMethodReady: (
    creator: StripeCardPaymentMethodCreator | null,
  ) => void;
  onCardFieldsCompleteChange: (isComplete: boolean) => void;
  showFieldErrors: boolean;
}) {
  const stripePromise = useMemo(() => {
    return loadStripe(stripeCredentials.publishableKey);
  }, [stripeCredentials.publishableKey]);

  if (!stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFields
        theme={theme}
        onCreatePaymentMethodReady={onCreatePaymentMethodReady}
        onCardFieldsCompleteChange={onCardFieldsCompleteChange}
        showFieldErrors={showFieldErrors}
      />
    </Elements>
  );
}

function StripeCardSkeleton() {
  const skeletonRowClassName =
    "h-12 animate-pulse rounded-2xl border border-slate-200 bg-slate-100";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[3fr_1fr_1fr]">
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-200" />
          <div className={skeletonRowClassName} />
        </div>
      </div>
    </div>
  );
}

export function PaymentStep({
  info,
  form,
  paymentMethodError,
  isCreditCardFieldsComplete,
  showCreditCardFieldErrors,
  onStripeCardPaymentMethodCreatorReady,
  onStripeCardFieldsCompleteChange,
  setField,
  theme,
  couponValidation,
  couponValidationError,
  isValidatingCoupon,
  isCouponApplied,
  onValidateCoupon,
  onClearCoupon,
  isSubmitting,
  isLastStep,
}: PaymentStepProps) {
  const paymentProducts = useMemo(() => {
    return info.paymentSettings.paymentProducts.filter(
      (product, index, array) =>
        array.findIndex((candidate) => candidate.name === product.name) ===
        index,
    );
  }, [info.paymentSettings.paymentProducts]);
  const paymentAccountUniqueId =
    info.paymentSettings.paymentAccountUniqueId?.trim();
  const currencyPrefix = buildCurrencyPrefix(info);
  const membershipAmount = Number(info.membershipDetail.membershipCharges ?? 0);
  const presetTips = info.presetTips ?? [];
  const tipAmount = presetTips.length > 0 ? parseTipAmount(form.tipAmount) : 0;
  const selectedTipPercent =
    presetTips.length > 0 ? Number(form.tipPresetPercent) : 0;
  const tipAmountInputRef = useRef<HTMLInputElement | null>(null);
  const totalAmount = membershipAmount + tipAmount;
  const couponDiscountAmount = isCouponApplied && couponValidation
    ? couponValidation.discountAmount
    : 0;
  const finalTotal = Math.max(totalAmount - couponDiscountAmount, 0);
  const hasCouponSection =
    isLastStep &&
    membershipAmount > 0 &&
    !info.membershipDetail.isFree &&
    Boolean(info?.discountsEnabled && info?.hasActiveCoupons);
  const [stripeCredentials, setStripeCredentials] =
    useState<MembershipRegistrationStripeCredentials | null>(null);
  const [stripeCredentialsLoading, setStripeCredentialsLoading] =
    useState(false);
  const [stripeCredentialsError, setStripeCredentialsError] = useState("");
  const blurActiveElement = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }, []);
  const formatMoney = (amount: number) => {
    return `${currencyPrefix}${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };
  const totalAmountLabel =
    finalTotal > 0
      ? formatMoney(finalTotal)
      : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel;
  useEffect(() => {
    if (!selectedTipPercent || !presetTips.length) {
      return;
    }

    const matchingPreset = presetTips.find(
      (presetTip) => presetTip.percent === selectedTipPercent,
    );
    if (!matchingPreset) {
      return;
    }

    const presetBaseAmount = membershipAmount;
    const nextTipAmount = (
      (presetBaseAmount * matchingPreset.percent) /
      100
    ).toFixed(2);

    if (form.tipAmount !== nextTipAmount) {
      setField("tipAmount", nextTipAmount);
    }
  }, [
    form.tipAmount,
    membershipAmount,
    presetTips,
    selectedTipPercent,
    setField,
  ]);

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

  const [openPaymentProduct, setOpenPaymentProduct] = useState<string | null>(
    null,
  );
  const didInitializeOpenStateRef = useRef(false);

  useEffect(() => {
    if (
      !paymentAccountUniqueId ||
      selectedPaymentProduct?.name !== "CreditCard"
    ) {
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
        const credentials = await fetchStripePublicCredentials(
          paymentAccountUniqueId,
        );
        if (!isMounted) {
          return;
        }

        setStripeCredentials(credentials);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStripeCredentials(null);
        setStripeCredentialsError(
          error instanceof Error
            ? error.message
            : "Unable to load Stripe credentials.",
        );
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
    setOpenPaymentProduct(
      selectedPaymentProduct?.name ?? paymentProducts[0]?.name ?? null,
    );
  }, [paymentProducts, selectedPaymentProduct]);

  useEffect(() => {
    if (selectedPaymentProduct?.name !== "CreditCard") {
      onStripeCardFieldsCompleteChange(false);
      blurActiveElement();
    }
  }, [
    blurActiveElement,
    onStripeCardFieldsCompleteChange,
    selectedPaymentProduct?.name,
  ]);

  if (paymentProducts.length === 0) {
    return (
      <div
        className="rounded-3xl border px-4 py-5 text-sm leading-6"
        style={{ borderColor: theme.cardBorder }}
      >
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
            Select your desired payment method.
          </div>

          <div className="space-y-3">
            {paymentProducts.map((product, index) => {
              const isOpen = openPaymentProduct === product.name;
              const productId = resolvePaymentProductId(product.name);
              const isSelected = productId
                ? form.paymentMethod.trim() === String(productId)
                : false;
              const panelId = `payment-method-panel-${product.name}`;
              const buttonId = `payment-method-button-${product.name}`;
              const headerLabel = product.displayName || product.name;

              return (
                <div key={product.name}>
                  <section
                    className="overflow-hidden rounded-3xl border transition"
                    style={{
                      borderColor:
                        isOpen || isSelected ? theme.level1 : theme.cardBorder,
                      background: theme.cardBackground,
                    }}
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => {
                        blurActiveElement();

                        if (productId) {
                          setField("paymentMethod", String(productId));
                        }

                        setOpenPaymentProduct((current) => {
                          if (current === product.name && isSelected) {
                            return current;
                          }

                          return current === product.name ? null : product.name;
                        });
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              borderColor: isSelected
                                ? theme.level1
                                : theme.cardBorder,
                              background: isSelected
                                ? theme.level1
                                : "transparent",
                              color: isSelected ? "#fff" : theme.bodyColor,
                            }}
                            aria-hidden="true"
                          >
                            {isSelected ? (
                              <CheckIcon className="h-3.5 w-3.5" />
                            ) : null}
                          </span>
                          <span
                            className="truncate text-base font-semibold"
                            style={{ color: theme.titleColor }}
                          >
                            {headerLabel}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="overflow-hidden border-t px-4"
                        style={{ borderColor: theme.cardBorder }}
                      >
                        <div className="py-4">
                          {product.name === "CreditCard" && isSelected ? (
                            <div className="mt-4">
                              {stripeCredentialsLoading ? (
                                <StripeCardSkeleton />
                              ) : stripeCredentialsError ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
                                  {stripeCredentialsError}
                                </div>
                              ) : stripeCredentials ? (
                                <StripeElementsFields
                                  key={stripeCredentials.publishableKey}
                                  theme={theme}
                                  stripeCredentials={stripeCredentials}
                                  onCreatePaymentMethodReady={
                                    onStripeCardPaymentMethodCreatorReady
                                  }
                                  onCardFieldsCompleteChange={
                                    onStripeCardFieldsCompleteChange
                                  }
                                  showFieldErrors={showCreditCardFieldErrors}
                                />
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="order-1 space-y-2 rounded-3xl border px-4 py-4 sm:px-5 sm:py-5 lg:order-2 lg:self-start"
          style={{
            borderColor: theme.cardBorder,
            background: theme.tileBackground,
          }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.tileLabelColor }}
            >
              What you will pay
            </p>
            <p
              className="mt-1 text-sm leading-6"
              style={{ color: theme.bodyColor }}
            >
              Review the amount before selecting a payment method.
            </p>
          </div>

          <div
            className="space-y-3 rounded-2xl px-4 py-4"
            style={{ background: theme.cardBackground }}
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: theme.tileLabelColor }}
                >
                  Membership
                </p>
                <p
                  className="text-base text-right font-semibold"
                  style={{ color: theme.tileValueColor }}
                >
                  {membershipAmount > 0
                    ? formatMoney(membershipAmount)
                    : MEMBERSHIP_REGISTER_PAGE_COPY.priceFreeLabel}
                </p>
              </div>

              {hasCouponSection ? (
                <div
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 ${isCouponApplied ? "rounded-2xl p-3 -mx-3" : ""}`.trim()}
                  id="coupon-section"
                  style={{
                    background: isCouponApplied
                      ? "rgba(240,253,244,0.98)"
                      : "transparent",
                  }}
                >
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: theme.tileLabelColor }}
                    >
                      Coupon
                    </p>
                    {isCouponApplied && couponValidation ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {couponValidation.code}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          -{formatMoney(couponValidation.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <p
                    className="text-base text-right font-semibold"
                    style={{ color: theme.tileValueColor }}
                  >
                    <div className="space-y-2">
                      {!isCouponApplied ? (
                        <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/80 shadow-sm transition">
                          <input
                            id="couponCode"
                            type="text"
                            value={form.couponCode}
                            onChange={(event) =>
                              setField("couponCode", event.target.value)
                            }
                            placeholder="Enter coupon code"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                            style={{ color: theme.titleColor }}
                            disabled={isSubmitting || isValidatingCoupon}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void onValidateCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void onValidateCoupon()}
                            disabled={
                              !form.couponCode.trim() ||
                              isSubmitting ||
                              isValidatingCoupon
                            }
                            className="shrink-0 px-3 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ background: theme.level1 }}
                          >
                            {isValidatingCoupon ? "Validating..." : "Apply"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onClearCoupon()}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                          Remove
                        </button>
                      )}

                      {couponValidationError ? (
                        <p className="text-xs text-rose-600">
                          {couponValidationError}
                        </p>
                      ) : null}
                    </div>
                  </p>
                </div>
              ) : null}

              {presetTips.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)_minmax(0,200px)] sm:items-center">
                    <div className="min-w-0 sm:self-center">
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: theme.tileLabelColor }}
                      >
                        Tip
                      </p>
                    </div>

                    <div className="min-w-0">
                      <select
                        value={form.tipPresetPercent}
                        onChange={(event) => {
                          if (event.target.value === "other") {
                            setField("tipPresetPercent", "other");
                            window.setTimeout(() => {
                              tipAmountInputRef.current?.focus();
                            }, 0);
                            return;
                          }

                          const selectedPreset = presetTips.find(
                            (presetTip) =>
                              String(presetTip.percent) === event.target.value,
                          );
                          if (!selectedPreset) {
                            setField("tipPresetPercent", "");
                            return;
                          }

                          const presetBaseAmount = membershipAmount;
                          const presetAmount =
                            (presetBaseAmount * selectedPreset.percent) / 100;
                          setField("tipPresetPercent", event.target.value);
                          setField(
                            "tipAmount",
                            presetAmount > 0 ? presetAmount.toFixed(2) : "",
                          );
                        }}
                        className="w-full rounded-2xl border bg-white px-3 py-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                        style={{
                          borderColor: theme.cardBorder,
                          color: theme.titleColor,
                        }}
                      >
                        {presetTips.map((presetTip) => (
                          <option
                            key={presetTip.percent}
                            value={presetTip.percent}
                          >
                            {presetTip.percent}%
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="w-full sm:max-w-50">
                      <div className="flex min-w-0 items-stretch overflow-hidden rounded-2xl bg-white/70 shadow-sm">
                        <span
                          className="flex shrink-0 items-center whitespace-nowrap px-3 text-sm font-semibold"
                          style={{
                            color: theme.tileValueColor,
                            background: theme.level3,
                          }}
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
                            setField(
                              "tipAmount",
                              formatAmountInput(event.target.value),
                            );
                          }}
                          onBlur={(event) => {
                            setField("tipPresetPercent", "other");
                            setField(
                              "tipAmount",
                              normalizeAmountInput(event.target.value),
                            );
                          }}
                          placeholder="0.00"
                          className="w-full bg-white/70 px-3 py-2.5 text-right text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20"
                          style={{ color: theme.titleColor }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-4 tracking-wide">
                    <span
                      aria-hidden="true"
                      className="text-[12px] leading-none text-red-500"
                    >
                      ♥
                    </span>{" "}
                    If you would like to give a little extra, your tip goes a
                    long way in supporting us.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {isCouponApplied && couponDiscountAmount > 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-2.5">
              <span className="text-sm font-medium text-emerald-700">
                Discount applied
              </span>
              <span className="text-sm font-bold text-emerald-700">
                -{formatMoney(couponDiscountAmount)}
              </span>
            </div>
          ) : null}

          <div className="border-t" style={{ borderColor: theme.cardBorder }} />

          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: theme.cardBackground }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.tileLabelColor }}
              >
                Total payable
              </p>
              <p
                className="text-2xl font-bold text-right sm:text-3xl"
                style={{ color: isCouponApplied ? theme.level1 : theme.level1 }}
              >
                {totalAmountLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
