import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../routes";
import {
  createMembershipDiscountCoupon,
  getMembershipDiscountCoupons,
  getMembershipTypeDiscountsEnabled,
  updateMembershipTypeDiscountsEnabled,
} from "../../lib/membershipWizard";
import type { DiscountCouponListItem, DiscountCouponTypeValue } from "../../types/membership";
import { useWizardFooterActions } from "./WizardFooterActionsContext";
import {
  MEMBERSHIP_DISCOUNT_COUPONS_CONTENT,
  MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER,
} from "./MembershipDiscountCouponsStepPage.fields";

type DiscountCouponDraft = {
  code: string;
  discountType: DiscountCouponTypeValue;
  discountValue: string;
  maxDiscountAmount: string;
  totalCoupons: string;
  isActive: boolean;
};

type DiscountCouponDraftErrors = Partial<Record<keyof DiscountCouponDraft, string>>;

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M9 3h2v6h6v2h-6v6H9v-6H3V9h6z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 2.12l-8.2 8.2-3.4.85.85-3.4 8.63-8.77ZM5.1 11.61l-.38 1.52 1.52-.38 7.87-7.87-1.14-1.14-7.87 7.87Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7.5 2.5h5l.5 1.5H16V6H4V4h3l.5-1.5Zm-1 5h2v7h-2v-7Zm5 0h2v7h-2v-7ZM5 7h10l-.6 9.1A2 2 0 0 1 12.4 18H7.6a2 2 0 0 1-1.99-1.9L5 7Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h1V14H6A1 1 0 0 1 5 13V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5h1V6A2.5 2.5 0 0 0 12.5 3.5H6Zm3 4A2.5 2.5 0 0 0 6.5 10v3A2.5 2.5 0 0 0 9 15.5h4A2.5 2.5 0 0 0 15.5 13v-3A2.5 2.5 0 0 0 13 7.5H9Zm0 1h4A1.5 1.5 0 0 1 14.5 10v3A1.5 1.5 0 0 1 13 14.5H9A1.5 1.5 0 0 1 7.5 13v-3A1.5 1.5 0 0 1 9 8.5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7.9 13.6 4.7 10.4l1.4-1.4 1.8 1.8 5.9-5.9 1.4 1.4-7.3 7.3Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M5.72 5.72a.75.75 0 0 1 1.06 0L10 8.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L11.06 10l3.22 3.22a.75.75 0 0 1-1.06 1.06L10 11.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L8.94 10 5.72 6.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function formatDiscountAmount(coupon: DiscountCouponListItem) {
  const amount = coupon.discountValue.toFixed(2);
  return coupon.discountType === "Percentage" ? `${amount}%` : `$${amount}`;
}

function formatDiscountTypeLabel(discountType: DiscountCouponTypeValue) {
  return discountType === "Percentage" ? "%" : "$";
}

function getDiscountTypeHelperText(discountType: DiscountCouponTypeValue) {
  if (discountType === "Percentage") {
    return "Discount by percentage";
  }

  return "Discount by amount";
}

function getDefaultCouponDraft(): DiscountCouponDraft {
  return {
    code: "",
    discountType: "FixedAmount",
    discountValue: "",
    maxDiscountAmount: "",
    totalCoupons: "",
    isActive: true,
  };
}

function isLocalCoupon(coupon: DiscountCouponListItem) {
  return coupon.uniqueId.startsWith("local-");
}

function convertCouponToDraft(coupon: DiscountCouponListItem): DiscountCouponDraft {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    maxDiscountAmount: coupon.maxDiscountAmount?.toString() ?? "",
    totalCoupons: (coupon.totalCoupons ?? "").toString(),
    isActive: coupon.isActive,
  };
}

function buildGeneratedCouponCode(draft: DiscountCouponDraft) {
  const prefixes = ["SAVE", "DEAL", "PROMO", "BONUS", "FLASH", "PERK", "VIP", "OFFER"];
  const discountValue = Number(draft.discountValue);
  const normalizedValue =
    Number.isFinite(discountValue) && discountValue > 0
      ? String(discountValue).replace(/[^0-9]/g, "")
      : "";
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] ?? "SAVE";
  const suffix = draft.discountType === "Percentage" ? "PCT" : "OFF";
  const randomToken = Math.random().toString(36).slice(2, 6).toUpperCase();

  return [prefix, normalizedValue, suffix, randomToken].filter(Boolean).join("").slice(0, 16);
}

function sanitizeCouponCode(value: string) {
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 16);
}

function validateCouponDraft(draft: DiscountCouponDraft) {
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

  if (
    !draft.totalCoupons.trim() ||
    !Number.isFinite(totalCoupons) ||
    !Number.isInteger(totalCoupons) ||
    totalCoupons <= 0
  ) {
    errors.totalCoupons = "Total coupons must be greater than zero.";
  }

  return errors;
}

function MembershipDiscountCouponModal({
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialDraft ?? getDefaultCouponDraft());
    setErrors({});
    setFormError("");
    setIsSaving(false);
  }, [initialDraft, isOpen]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
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
                <span className="text-sm font-semibold text-slate-800">
                  Max Discount
                </span>
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
                {errors.maxDiscountAmount ? (
                  <p className="text-xs text-rose-600">{errors.maxDiscountAmount}</p>
                ) : null}
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
                  <span className="text-sm text-slate-600">
                    {draft.isActive ? "Available to use?" : "Inactive?"}
                  </span>
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

            {formError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 sm:flex-row sm:items-center">
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

function DeleteDiscountCouponModal({
  code,
  onCancel,
  onConfirm,
}: {
  code: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      data-wizard-enter-block="true"
    >
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

export function MembershipDiscountCouponsStepPage() {
  const navigate = useNavigate();
  const { membershipTypeUniqueId } = useParams<{ membershipTypeUniqueId?: string }>();
  const currentMembershipTypeUniqueId = membershipTypeUniqueId ?? "";
  const { setFooterActions } = useWizardFooterActions();
  const [discountsEnabled, setDiscountsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [coupons, setCoupons] = useState<DiscountCouponListItem[]>([]);
  const [pendingCoupons, setPendingCoupons] = useState<DiscountCouponListItem[]>([]);
  const [couponLoadError, setCouponLoadError] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [pendingDeleteCouponId, setPendingDeleteCouponId] = useState<string | null>(null);
  const [copiedCouponUniqueId, setCopiedCouponUniqueId] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const copyTimerRef = useRef<number | null>(null);
  const editingCoupon = editingCouponId
    ? coupons.find((coupon) => coupon.uniqueId === editingCouponId) ?? null
    : null;
  const pendingDeleteCoupon = pendingDeleteCouponId
    ? coupons.find((coupon) => coupon.uniqueId === pendingDeleteCouponId) ?? null
    : null;
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      setError("Membership type unique id is missing.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDiscountsState() {
      setIsLoading(true);
      setError("");

      try {
        const enabled = await getMembershipTypeDiscountsEnabled(currentMembershipTypeUniqueId);
        if (!isMounted) {
          return;
        }

        setDiscountsEnabled(enabled);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load discount state.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDiscountsState();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  useEffect(() => {
    if (!currentMembershipTypeUniqueId) {
      return;
    }

    let isMounted = true;

    async function loadCoupons() {
      setCouponLoadError("");

      try {
        const items = await getMembershipDiscountCoupons(currentMembershipTypeUniqueId);
        if (isMounted) {
          setCoupons(items);
        }
      } catch (loadError) {
        if (isMounted) {
          setCouponLoadError(loadError instanceof Error ? loadError.message : "Unable to load discount coupons.");
        }
      }
    }

    void loadCoupons();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  async function handleToggleDiscounts() {
    if (isLoading || isSaving) {
      return;
    }

    setDiscountsEnabled((currentValue) => !currentValue);
  }

  async function saveDiscountsState(nextPath: string) {
    if (!currentMembershipTypeUniqueId || isLoading || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateMembershipTypeDiscountsEnabled(currentMembershipTypeUniqueId, discountsEnabled);
      for (const coupon of pendingCoupons) {
        await createMembershipDiscountCoupon(currentMembershipTypeUniqueId, {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.discountType === "Percentage" ? coupon.maxDiscountAmount : null,
          totalCoupons: coupon.totalCoupons ?? 0,
          isActive: coupon.isActive,
        });
      }
      navigate(nextPath, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save discount state.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCreateDiscountCoupon(draft: DiscountCouponDraft) {
    const discountValue = Number(draft.discountValue);
    const maxDiscountAmount = draft.maxDiscountAmount.trim() ? Number(draft.maxDiscountAmount) : null;
    const totalCoupons = Number(draft.totalCoupons);

    const localCoupon: DiscountCouponListItem = {
      uniqueId: editingCouponId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: draft.code.trim(),
      moduleType: "Membership",
      moduleEntityId: null,
      discountType: draft.discountType,
      discountValue,
      maxDiscountAmount: draft.discountType === "Percentage" ? maxDiscountAmount : null,
      totalCoupons,
      isActive: draft.isActive,
      usageCount: 0,
    };

    if (editingCouponId) {
      setPendingCoupons((current) =>
        current.map((coupon) => (coupon.uniqueId === editingCouponId ? localCoupon : coupon)),
      );
      setCoupons((current) =>
        current.map((coupon) => (coupon.uniqueId === editingCouponId ? localCoupon : coupon)),
      );
      return;
    }

    setPendingCoupons((current) => [...current, localCoupon]);
    setCoupons((current) => [...current, localCoupon]);
  }

  function handleOpenCreateModal() {
    setEditingCouponId(null);
    setIsCouponModalOpen(true);
  }

  function handleEditCoupon(coupon: DiscountCouponListItem) {
    setEditingCouponId(coupon.uniqueId);
    setIsCouponModalOpen(true);
  }

  function handleDeleteCoupon(couponId: string) {
    setPendingDeleteCouponId(couponId);
  }

  function handleToggleCouponActive(couponId: string) {
    setPendingCoupons((current) =>
      current.map((coupon) =>
        coupon.uniqueId === couponId ? { ...coupon, isActive: !coupon.isActive } : coupon,
      ),
    );
    setCoupons((current) =>
      current.map((coupon) =>
        coupon.uniqueId === couponId ? { ...coupon, isActive: !coupon.isActive } : coupon,
      ),
    );
  }

  async function handleCopyCouponCode(coupon: DiscountCouponListItem) {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCouponUniqueId(coupon.uniqueId);
      setToastMessage(`Copied ${coupon.code} to clipboard.`);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedCouponUniqueId((current) => (current === coupon.uniqueId ? "" : current));
      }, 3000);
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage("");
      }, 3000);
    } catch {
      setError("Unable to copy the coupon code.");
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function confirmDeleteCoupon() {
    if (!pendingDeleteCouponId) {
      return;
    }

    setPendingCoupons((current) => current.filter((coupon) => coupon.uniqueId !== pendingDeleteCouponId));
    setCoupons((current) => current.filter((coupon) => coupon.uniqueId !== pendingDeleteCouponId));
    if (editingCouponId === pendingDeleteCouponId) {
      setEditingCouponId(null);
      setIsCouponModalOpen(false);
    }
    setPendingDeleteCouponId(null);
  }

  useLayoutEffect(() => {
    setFooterActions({
      showBack: true,
      showSkip: true,
      showSaveNext: true,
      showSaveExit: true,
      skipLabel: "Skip",
      saveNextLabel: "Save & Continue",
      saveExitLabel: "Save & Exit",
      isSaving,
      onBack: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardPricing,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER - 1,
          ),
          { replace: true },
        ),
      onSkip: () =>
        navigate(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardQuestions,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
          ),
          { replace: true },
        ),
      onSaveNext: () =>
        void saveDiscountsState(
          buildMembershipWizardStepPath(
            APP_ROUTES.membershipWizardQuestions,
            currentMembershipTypeUniqueId,
            MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
          ),
        ),
      onSaveExit: () => void saveDiscountsState(APP_ROUTES.membershipTypes),
    });
  }, [currentMembershipTypeUniqueId, discountsEnabled, isLoading, isSaving, navigate, setFooterActions]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mt-5 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {MEMBERSHIP_DISCOUNT_COUPONS_CONTENT.title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {MEMBERSHIP_DISCOUNT_COUPONS_CONTENT.description}
        </p>
      </div>

      <div className="mt-8 max-w-3xl rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Want To Enable Discounts?</span>
            <p className="text-xs leading-5 text-slate-500">Make membership discounts available for this plan.</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:min-w-[220px] sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
            <span className="pr-4 text-sm font-medium text-slate-600 sm:hidden">Enable coupons</span>
            <button
              type="button"
              role="switch"
              aria-checked={discountsEnabled}
              aria-label="Toggle membership discounts"
              onClick={() => void handleToggleDiscounts()}
              disabled={isLoading || isSaving}
              className={[
                "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
                discountsEnabled
                  ? "border-cyan-500 bg-cyan-500"
                  : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
                  discountsEnabled ? "translate-x-7" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Available Coupons</span>
            <p className="text-xs leading-5 text-slate-500">
              Add coupons only after discounts are enabled.
            </p>
          </div>

          <button
            type="button"
            aria-label="Add discount coupon"
            onClick={handleOpenCreateModal}
            disabled={!discountsEnabled || isLoading || isSaving}
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
              discountsEnabled
                ? "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                : "border-slate-200 bg-slate-100 text-slate-300",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            <PlusIcon />
          </button>
        </div>

      <div className="mt-5 space-y-3">
        {toastMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg shadow-emerald-900/10"
          >
            <CheckIcon />
            <span>{toastMessage}</span>
          </div>
        ) : null}
        {!discountsEnabled ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Enable discount coupons to start adding coupon rules.
            </div>
          ) : coupons.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full table-fixed divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="w-[34%] px-4 py-3">Code</th>
                    <th className="w-[12%] px-4 py-3">Type</th>
                    <th className="w-[18%] px-4 py-3">Value</th>
                    <th className="w-[16%] px-4 py-3 text-center">Active</th>
                    <th className="w-[20%] px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon.uniqueId} className="align-middle text-sm text-slate-700">
                      <td className="px-4 py-4 align-middle">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 truncate font-semibold text-slate-900">{coupon.code}</span>
                          <button
                            type="button"
                            onClick={() => void handleCopyCouponCode(coupon)}
                            aria-label="Copy discount coupon code"
                            title={copiedCouponUniqueId === coupon.uniqueId ? "Copied" : "Copy"}
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                              copiedCouponUniqueId === coupon.uniqueId
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700",
                            ].join(" ")}
                          >
                            {copiedCouponUniqueId === coupon.uniqueId ? <CheckIcon /> : <CopyIcon />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {formatDiscountTypeLabel(coupon.discountType)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="font-medium text-slate-900">{formatDiscountAmount(coupon)}</span>
                      </td>
                      <td className="px-4 py-4 align-middle text-center">
                        {isLocalCoupon(coupon) ? (
                          <div className="inline-flex justify-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={coupon.isActive}
                              aria-label={`Toggle ${coupon.code} active state`}
                              onClick={() => handleToggleCouponActive(coupon.uniqueId)}
                              className={[
                                "relative inline-flex h-7 w-12 items-center rounded-full border transition",
                                coupon.isActive
                                  ? "border-cyan-500 bg-cyan-500"
                                  : "border-slate-300 bg-slate-200 hover:bg-slate-300",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
                                  coupon.isActive ? "translate-x-6" : "translate-x-1",
                                ].join(" ")}
                              />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Locked</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                            aria-label="Edit discount coupon"
                            title="Edit"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.uniqueId)}
                            aria-label="Delete discount coupon"
                            title="Delete"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No discount coupons have been created yet.
            </div>
          )}

          {couponLoadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {couponLoadError}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <MembershipDiscountCouponModal
        isOpen={isCouponModalOpen}
        initialDraft={editingCoupon ? convertCouponToDraft(editingCoupon) : null}
        mode={editingCouponId ? "edit" : "create"}
        onClose={() => {
          setEditingCouponId(null);
          setIsCouponModalOpen(false);
        }}
        onSaveClose={handleCreateDiscountCoupon}
        onSaveContinue={handleCreateDiscountCoupon}
      />

      {pendingDeleteCoupon ? (
        <DeleteDiscountCouponModal
          code={pendingDeleteCoupon.code}
          onCancel={() => setPendingDeleteCouponId(null)}
          onConfirm={confirmDeleteCoupon}
        />
      ) : null}
    </section>
  );
}
