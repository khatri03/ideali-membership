import { useEffect, useLayoutEffect, useState } from "react";
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

function formatDiscountAmount(coupon: DiscountCouponListItem) {
  const amount = coupon.discountValue.toFixed(2);
  return coupon.discountType === "Percentage" ? `${amount}%` : `$${amount}`;
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

function buildGeneratedCouponCode(draft: DiscountCouponDraft) {
  const discountValue = Number(draft.discountValue);
  const normalizedValue =
    Number.isFinite(discountValue) && discountValue > 0
      ? String(discountValue).replace(/[^0-9]/g, "")
      : "";
  const suffix = draft.discountType === "Percentage" ? "PCT" : "OFF";
  const randomToken = Math.random().toString(36).slice(2, 6).toUpperCase();

  return [`SAVE`, normalizedValue, suffix, randomToken].filter(Boolean).join("");
}

function validateCouponDraft(draft: DiscountCouponDraft) {
  const errors: DiscountCouponDraftErrors = {};
  const code = draft.code.trim();
  const discountValue = Number(draft.discountValue);
  const maxDiscountAmount = draft.maxDiscountAmount.trim() ? Number(draft.maxDiscountAmount) : null;
  const totalCoupons = Number(draft.totalCoupons);

  if (!code) {
    errors.code = "Code is required.";
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
  loading,
  onClose,
  onSaveClose,
  onSaveContinue,
}: {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSaveClose: (draft: DiscountCouponDraft) => Promise<void>;
  onSaveContinue: (draft: DiscountCouponDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DiscountCouponDraft>(getDefaultCouponDraft());
  const [errors, setErrors] = useState<DiscountCouponDraftErrors>({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(getDefaultCouponDraft());
    setErrors({});
    setFormError("");
    setIsSaving(false);
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

      if (key === "discountValue" && next.discountType === "Percentage") {
        const parsedValue = Number(String(value));
        if (Number.isFinite(parsedValue) && parsedValue > 100) {
          next.discountValue = "100";
        }
      }

      return next;
    });

    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  };

  const submit = async (mode: "close" | "continue") => {
    if (loading || isSaving) {
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
        await onSaveClose(draft);
        onClose();
        return;
      }

      await onSaveContinue(draft);
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
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add Discount Coupon</h2>
            <p className="text-sm leading-6 text-slate-600">
              Create a coupon code for this membership type. Mandatory fields are marked with *.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
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
                <input
                  value={draft.code}
                  onChange={(event) => updateDraft("code", event.target.value.toUpperCase())}
                  type="text"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="WELCOME10"
                />
                {errors.code ? <p className="text-xs text-rose-600">{errors.code}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">
                  Discount Type <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                </span>
                <select
                  value={draft.discountType}
                  onChange={(event) => updateDraft("discountType", event.target.value as DiscountCouponTypeValue)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="FixedAmount">Discount By Amount ($)</option>
                  <option value="Percentage">Discount By Percentage (%)</option>
                </select>
                {errors.discountType ? <p className="text-xs text-rose-600">{errors.discountType}</p> : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">
                  Discount Value <span className="text-rose-600" aria-label="Required" title="Required">*</span>
                </span>
                <input
                  value={draft.discountValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (draft.discountType === "Percentage") {
                      const numericValue = Number(nextValue);
                      if (nextValue && Number.isFinite(numericValue) && numericValue > 100) {
                        updateDraft("discountValue", "100");
                        return;
                      }
                    }

                    updateDraft("discountValue", nextValue);
                  }}
                  type="number"
                  min="0"
                  max={isPercentage ? "100" : undefined}
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  placeholder="10"
                />
                {errors.discountValue ? <p className="text-xs text-rose-600">{errors.discountValue}</p> : null}
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
                {errors.maxDiscountAmount ? (
                  <p className="text-xs text-rose-600">{errors.maxDiscountAmount}</p>
                ) : null}
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
                    {draft.isActive ? "Coupon will be available" : "Coupon will be inactive"}
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

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => void submit("continue")}
              disabled={loading || isSaving}
              className="rounded-full border border-cyan-200 bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save & Continue
            </button>
            <button
              type="button"
              onClick={() => void submit("close")}
              disabled={loading || isSaving}
              className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save & Close
            </button>
          </div>
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
  const [couponLoadError, setCouponLoadError] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

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
      navigate(nextPath, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save discount state.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDiscountCoupon(draft: DiscountCouponDraft) {
    if (!currentMembershipTypeUniqueId) {
      throw new Error("Membership type unique id is missing.");
    }

    const discountValue = Number(draft.discountValue);
    const maxDiscountAmount = draft.maxDiscountAmount.trim() ? Number(draft.maxDiscountAmount) : null;
    const totalCoupons = Number(draft.totalCoupons);

    await createMembershipDiscountCoupon(currentMembershipTypeUniqueId, {
      code: draft.code.trim(),
      discountType: draft.discountType,
      discountValue,
      maxDiscountAmount: draft.discountType === "Percentage" ? maxDiscountAmount : null,
      totalCoupons,
      isActive: draft.isActive,
    });

    const items = await getMembershipDiscountCoupons(currentMembershipTypeUniqueId);
    setCoupons(items);
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
  }, [currentMembershipTypeUniqueId, discountsEnabled, isSaving, navigate, setFooterActions]);

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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Discount coupons</span>
            <p className="text-xs leading-5 text-slate-500">Make membership discounts available for this plan.</p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={discountsEnabled}
            aria-label="Toggle membership discounts"
            onClick={() => void handleToggleDiscounts()}
            disabled={isLoading || isSaving}
            className={[
              "relative inline-flex h-8 w-14 items-center rounded-full border transition",
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

      <div className="mt-5 max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Coupon actions</span>
            <p className="text-xs leading-5 text-slate-500">
              Add coupons only after discounts are enabled.
            </p>
          </div>

          <button
            type="button"
            aria-label="Add discount coupon"
            onClick={() => setIsCouponModalOpen(true)}
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
          {!discountsEnabled ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Enable discount coupons to start adding coupon rules.
            </div>
          ) : coupons.length > 0 ? (
            coupons.map((coupon) => (
              <div key={coupon.uniqueId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{coupon.code}</span>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          coupon.isActive
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {coupon.discountType === "Percentage"
                        ? `Discount By Percentage (${formatDiscountAmount(coupon)})`
                        : `Discount By Amount (${formatDiscountAmount(coupon)})`}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <div>Total coupons: {coupon.totalCoupons ?? 0}</div>
                    <div>Used: {coupon.usageCount}</div>
                  </div>
                </div>

                {coupon.discountType === "Percentage" && coupon.maxDiscountAmount !== null ? (
                  <p className="mt-2 text-xs text-slate-500">Max discount: ${coupon.maxDiscountAmount.toFixed(2)}</p>
                ) : null}
              </div>
            ))
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
        loading={isLoading}
        onClose={() => setIsCouponModalOpen(false)}
        onSaveClose={handleCreateDiscountCoupon}
        onSaveContinue={handleCreateDiscountCoupon}
      />
    </section>
  );
}
