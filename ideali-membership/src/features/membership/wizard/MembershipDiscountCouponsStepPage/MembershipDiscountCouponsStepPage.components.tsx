import { useEffect, useRef, useState } from "react";
import type { DiscountCouponTypeValue } from "../../../../types/membership";
import {
  CloseIcon,
  buildGeneratedCouponCode,
  getDefaultCouponDraft,
  getDiscountTypeHelperText,
  sanitizeCouponCode,
  type DiscountCouponDraft,
  type DiscountCouponDraftErrors,
  validateCouponDraft,
} from "./MembershipDiscountCouponsStepPage.utils";

export function MembershipDiscountCouponModal({
  isOpen,
  initialDraft,
  mode,
  onClose,
  onSaveClose,
  onSaveContinue,
}: {
  isOpen: boolean;
  initialDraft?: DiscountCouponDraft | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaveClose: (draft: DiscountCouponDraft) => void;
  onSaveContinue: (draft: DiscountCouponDraft) => void;
}) {
  const [draft, setDraft] = useState<DiscountCouponDraft>(getDefaultCouponDraft());
  const [errors, setErrors] = useState<DiscountCouponDraftErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialDraft ?? getDefaultCouponDraft());
    setErrors({});
    setFormError("");
    setIsSaving(false);
  }, [initialDraft, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.setTimeout(() => {
      codeInputRef.current?.focus();
    }, 0);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isPercentage = draft.discountType === "Percentage";

  const updateDraft = <K extends keyof DiscountCouponDraft>(key: K, value: DiscountCouponDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (key === "discountType" && value !== "Percentage") {
        next.maxDiscountAmount = "";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  };

  const submit = async (mode: "close" | "continue") => {
    if (isSaving) {
      return;
    }

    const nextErrors = validateCouponDraft(draft);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "close") {
        onSaveClose(draft);
        onClose();
        return;
      }

      onSaveContinue(draft);
      setDraft(getDefaultCouponDraft());
      setErrors({});
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save discount coupon.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm" data-wizard-enter-block="true">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 sm:rounded-[2rem]">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add Discount Coupon</h2>
            <p className="text-sm leading-6 text-slate-600">
              {mode === "edit"
                ? "Update the coupon details for this membership type. Mandatory fields are marked with *."
                : "Create a coupon code for this membership type. Mandatory fields are marked with *."}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2 md:col-span-3">
                <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-start sm:justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Code <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                  </span>
                  <div className="flex justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={() => updateDraft("code", buildGeneratedCouponCode(draft))}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      Generate Random Code
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    ref={codeInputRef}
                    value={draft.code}
                    onChange={(event) => updateDraft("code", sanitizeCouponCode(event.target.value))}
                    type="text"
                    autoComplete="off"
                    maxLength={16}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    placeholder="WELCOME10"
                  />
                  {draft.code ? (
                    <button
                      type="button"
                      onClick={() => updateDraft("code", "")}
                      aria-label="Clear coupon code"
                      title="Clear"
                      className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <CloseIcon />
                    </button>
                  ) : null}
                </div>
                {errors.code ? <p className="text-xs text-rose-600">{errors.code}</p> : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">
                  Type <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                </span>
                <select
                  value={draft.discountType}
                  onChange={(event) => updateDraft("discountType", event.target.value as DiscountCouponTypeValue)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="FixedAmount">$</option>
                  <option value="Percentage">%</option>
                </select>
                <p className="text-xs text-slate-500">
                  {getDiscountTypeHelperText(draft.discountType).startsWith("Discount by") ? (
                    <>
                      Discount by <strong className="font-semibold text-slate-700">{draft.discountType === "Percentage" ? "percentage" : "amount"}</strong>
                    </>
                  ) : (
                    getDiscountTypeHelperText(draft.discountType)
                  )}
                </p>
                {errors.discountType ? <p className="text-xs text-rose-600">{errors.discountType}</p> : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">Max Discount</span>
                <input
                  value={draft.maxDiscountAmount}
                  onChange={(event) => updateDraft("maxDiscountAmount", event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!isPercentage}
                  className={[
                    "w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition",
                    isPercentage
                      ? "border-slate-200 bg-white text-slate-900 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      : "border-slate-200 bg-slate-100 text-slate-400",
                    "disabled:cursor-not-allowed",
                  ].join(" ")}
                  placeholder="25"
                />
                <p className="text-xs text-slate-500">
                  {isPercentage ? "Optional cap for percentage discounts." : "Available only for percentage discounts."}
                </p>
                {errors.maxDiscountAmount ? <p className="text-xs text-rose-600">{errors.maxDiscountAmount}</p> : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">
                  Value <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                </span>
                <input
                  value={draft.discountValue}
                  onChange={(event) => {
                    updateDraft("discountValue", event.target.value);
                  }}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="10"
                />
                {errors.discountValue ? <p className="text-xs text-rose-600">{errors.discountValue}</p> : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">
                  Total Coupons <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                </span>
                <input
                  value={draft.totalCoupons}
                  onChange={(event) => updateDraft("totalCoupons", event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="100"
                />
                {errors.totalCoupons ? <p className="text-xs text-rose-600">{errors.totalCoupons}</p> : null}
              </label>
              <div className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">Is Active</span>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">{draft.isActive ? "Available to use?" : "Inactive?"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.isActive}
                    aria-label="Toggle coupon active state"
                    onClick={() => updateDraft("isActive", !draft.isActive)}
                    className={[
                      "relative inline-flex h-8 w-14 items-center rounded-full border transition",
                      draft.isActive
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                        draft.isActive ? "translate-x-7" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>
            </div>
            {formError ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}
          </div>
        </div>
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
          >
            Close
          </button>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => void submit("continue")}
              disabled={isSaving}
              className="rounded-full border border-cyan-200 bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "edit" ? "Update & Continue" : "Add & Continue"}
            </button>
            <button
              type="button"
              onClick={() => void submit("close")}
              disabled={isSaving}
              className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "edit" ? "Update & Close" : "Add & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeleteDiscountCouponModal({
  code,
  onCancel,
  onConfirm,
}: {
  code: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm" data-wizard-enter-block="true">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Delete discount coupon</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Are you sure?</h3>
        </div>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            This will remove <span className="font-semibold text-slate-900">{code}</span> from the coupon list.
          </p>
          <p className="text-sm leading-6 text-slate-600">This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-rose-200 bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

