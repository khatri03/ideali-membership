import { useMemo, useRef } from "react";
import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js";
import type { MembershipTheme } from "./MembershipRegisterWizard.shared";

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

export function StripeCardFields({ theme }: { theme: MembershipTheme }) {
  const stripeInputClassName = "w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm";
  const stripeInputOptions = useMemo(
    () => ({
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
    }),
    [theme.titleColor, theme.mutedLabelColor],
  );
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

export { ChevronDownIcon, PaymentCheckIcon };
