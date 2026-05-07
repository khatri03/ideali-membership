import type { DiscountCouponListItem, DiscountCouponTypeValue } from "../../../types/membership";

export type DiscountCouponDraft = {
  code: string;
  discountType: DiscountCouponTypeValue;
  discountValue: string;
  maxDiscountAmount: string;
  totalCoupons: string;
  isActive: boolean;
};

export type DiscountCouponDraftErrors = Partial<Record<keyof DiscountCouponDraft, string>>;

export function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M9 3h2v6h6v2h-6v6H9v-6H3V9h6z" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 2.12l-8.2 8.2-3.4.85.85-3.4 8.63-8.77ZM5.1 11.61l-.38 1.52 1.52-.38 7.87-7.87-1.14-1.14-7.87 7.87Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7.5 2.5h5l.5 1.5H16V6H4V4h3l.5-1.5Zm-1 5h2v7h-2v-7Zm5 0h2v7h-2v-7ZM5 7h10l-.6 9.1A2 2 0 0 1 12.4 18H7.6a2 2 0 0 1-1.99-1.9L5 7Z" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h1V14H6A1 1 0 0 1 5 13V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5h1V6A2.5 2.5 0 0 0 12.5 3.5H6Zm3 4A2.5 2.5 0 0 0 6.5 10v3A2.5 2.5 0 0 0 9 15.5h4A2.5 2.5 0 0 0 15.5 13v-3A2.5 2.5 0 0 0 13 7.5H9Zm0 1h4A1.5 1.5 0 0 1 14.5 10v3A1.5 1.5 0 0 1 13 14.5H9A1.5 1.5 0 0 1 7.5 13v-3A1.5 1.5 0 0 1 9 8.5Z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7.9 13.6 4.7 10.4l1.4-1.4 1.8 1.8 5.9-5.9 1.4 1.4-7.3 7.3Z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M5.72 5.72a.75.75 0 0 1 1.06 0L10 8.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L11.06 10l3.22 3.22a.75.75 0 0 1-1.06 1.06L10 11.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L8.94 10 5.72 6.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

export function formatDiscountAmount(coupon: DiscountCouponListItem) {
  const amount = coupon.discountValue.toFixed(2);
  return coupon.discountType === "Percentage" ? `${amount}%` : `$${amount}`;
}

export function formatDiscountTypeLabel(discountType: DiscountCouponTypeValue) {
  return discountType === "Percentage" ? "%" : "$";
}

export function getDiscountTypeHelperText(discountType: DiscountCouponTypeValue) {
  return discountType === "Percentage" ? "Discount by percentage" : "Discount by amount";
}

export function getDefaultCouponDraft(): DiscountCouponDraft {
  return {
    code: "",
    discountType: "FixedAmount",
    discountValue: "",
    maxDiscountAmount: "",
    totalCoupons: "",
    isActive: true,
  };
}

export function isLocalCoupon(coupon: DiscountCouponListItem) {
  return coupon.uniqueId.startsWith("local-");
}

export function convertCouponToDraft(coupon: DiscountCouponListItem): DiscountCouponDraft {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    maxDiscountAmount: coupon.maxDiscountAmount?.toString() ?? "",
    totalCoupons: (coupon.totalCoupons ?? "").toString(),
    isActive: coupon.isActive,
  };
}

export function buildGeneratedCouponCode(draft: DiscountCouponDraft) {
  const prefixes = ["SAVE", "DEAL", "PROMO", "BONUS", "FLASH", "PERK", "VIP", "OFFER"];
  const discountValue = Number(draft.discountValue);
  const normalizedValue = Number.isFinite(discountValue) && discountValue > 0 ? String(discountValue).replace(/[^0-9]/g, "") : "";
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] ?? "SAVE";
  const suffix = draft.discountType === "Percentage" ? "PCT" : "OFF";
  const randomToken = Math.random().toString(36).slice(2, 6).toUpperCase();

  return [prefix, normalizedValue, suffix, randomToken].filter(Boolean).join("").slice(0, 16);
}

export function sanitizeCouponCode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 16);
}

export function validateCouponDraft(draft: DiscountCouponDraft) {
  const errors: DiscountCouponDraftErrors = {};
  const code = draft.code.trim();
  const discountValue = Number(draft.discountValue);
  const maxDiscountAmount = draft.maxDiscountAmount.trim() ? Number(draft.maxDiscountAmount) : null;
  const totalCoupons = Number(draft.totalCoupons);

  if (!code) {
    errors.code = "Code is required.";
  } else if (/\s/.test(code)) {
    errors.code = "Code cannot contain spaces.";
  } else if (code.length > 16) {
    errors.code = "Code cannot exceed 16 characters.";
  }

  if (!draft.discountType) {
    errors.discountType = "Discount type is required.";
  }

  if (!draft.discountValue.trim() || !Number.isFinite(discountValue) || discountValue <= 0) {
    errors.discountValue = "Discount value must be greater than zero.";
  } else if (draft.discountType === "Percentage" && discountValue > 100) {
    errors.discountValue = "Percentage discount value cannot exceed 100.";
  }

  if (draft.discountType === "Percentage" && maxDiscountAmount !== null && !Number.isFinite(maxDiscountAmount)) {
    errors.maxDiscountAmount = "Max discount must be a valid number.";
  } else if (draft.discountType === "Percentage" && maxDiscountAmount !== null && maxDiscountAmount < 0) {
    errors.maxDiscountAmount = "Max discount cannot be negative.";
  }

  if (!draft.totalCoupons.trim() || !Number.isFinite(totalCoupons) || !Number.isInteger(totalCoupons) || totalCoupons <= 0) {
    errors.totalCoupons = "Total coupons must be greater than zero.";
  }

  return errors;
}
