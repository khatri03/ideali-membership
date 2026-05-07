import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES, buildMembershipWizardStepPath } from "../../../routes";
import {
  getMembershipDiscountCouponsInfo,
  saveMembershipDiscountCoupons,
} from "../../../lib/membershipWizard";
import type { DiscountCouponListItem } from "../../../types/membership";
import { useWizardFooterActions } from "../WizardFooterActionsContext/WizardFooterActionsContext";
import {
  MEMBERSHIP_DISCOUNT_COUPONS_CONTENT,
  MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER,
} from "./MembershipDiscountCouponsStepPage.fields";
import {
  buildGeneratedCouponCode,
  CheckIcon,
  convertCouponToDraft,
  CopyIcon,
  formatDiscountAmount,
  formatDiscountTypeLabel,
  getDefaultCouponDraft,
  isLocalCoupon,
  PencilIcon,
  PlusIcon,
  sanitizeCouponCode,
  TrashIcon,
  type DiscountCouponDraft,
} from "./MembershipDiscountCouponsStepPage.utils";
import {
  DeleteDiscountCouponModal,
  MembershipDiscountCouponModal,
} from "./MembershipDiscountCouponsStepPage.components";



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
  const [deletedCouponIds, setDeletedCouponIds] = useState<string[]>([]);
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

    async function loadDiscountCoupons() {
      setIsLoading(true);
      setError("");

      try {
        const { discountsEnabled: enabled, coupons: items } = await getMembershipDiscountCouponsInfo(
          currentMembershipTypeUniqueId,
        );
        if (!isMounted) {
          return;
        }

        setDiscountsEnabled(enabled);
        setCoupons(items);
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

    void loadDiscountCoupons();

    return () => {
      isMounted = false;
    };
  }, [currentMembershipTypeUniqueId]);

  function handleToggleDiscounts() {
    if (isLoading || isSaving) {
      return;
    }

    setDiscountsEnabled((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue && coupons.length === 0) {
        setEditingCouponId(null);
        setIsCouponModalOpen(true);
      }

      return nextValue;
    });
  }

  async function saveDiscountsState(nextPath: string) {
    if (!currentMembershipTypeUniqueId || isLoading || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await saveMembershipDiscountCoupons(currentMembershipTypeUniqueId, {
        discountsEnabled,
        coupons: coupons.map((coupon) => ({
          uniqueId: isLocalCoupon(coupon) ? undefined : coupon.uniqueId,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.discountType === "Percentage" ? coupon.maxDiscountAmount : null,
          totalCoupons: coupon.totalCoupons ?? 0,
          isActive: coupon.isActive,
        })),
        deletedCouponIds,
      });
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
      discountType: draft.discountType,
      discountValue,
      maxDiscountAmount: draft.discountType === "Percentage" ? maxDiscountAmount : null,
      totalCoupons,
      isActive: draft.isActive,
      usageCount: 0,
    };

    if (editingCouponId) {
      setCoupons((current) =>
        current.map((coupon) => (coupon.uniqueId === editingCouponId ? localCoupon : coupon)),
      );
      return;
    }

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

  function canDeleteCoupon(coupon: DiscountCouponListItem) {
    return coupon.usageCount <= 0;
  }

  function handleToggleCouponActive(couponId: string) {
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

    if (pendingDeleteCoupon && !isLocalCoupon(pendingDeleteCoupon)) {
      setDeletedCouponIds((current) =>
        current.includes(pendingDeleteCouponId) ? current : [...current, pendingDeleteCouponId],
      );
    }

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
  }, [
    coupons,
    currentMembershipTypeUniqueId,
    deletedCouponIds,
    discountsEnabled,
    isLoading,
    isSaving,
    navigate,
    setFooterActions,
  ]);

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
              data-wizard-focus="true"
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

        {coupons.length > 0 ? (
          <>
            {!discountsEnabled ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Coupons are disabled until discount enabled.
              </div>
            ) : null}

            <div
              className={[
                "overflow-hidden rounded-2xl border bg-white",
                discountsEnabled ? "border-slate-200" : "border-slate-200 opacity-60 grayscale-[0.08]",
              ].join(" ")}
            >
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
                            disabled={!discountsEnabled}
                            className={[
                              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                              copiedCouponUniqueId === coupon.uniqueId
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : discountsEnabled
                                  ? "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                  : "border-slate-200 bg-white text-slate-300",
                              "disabled:cursor-not-allowed disabled:opacity-70",
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
                        <div className="inline-flex justify-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={coupon.isActive}
                            aria-label={`Toggle ${coupon.code} active state`}
                            onClick={() => handleToggleCouponActive(coupon.uniqueId)}
                            disabled={!discountsEnabled}
                            className={[
                              "relative inline-flex h-7 w-12 items-center rounded-full border transition",
                              coupon.isActive
                                ? "border-cyan-500 bg-cyan-500"
                                : discountsEnabled
                                  ? "border-slate-300 bg-slate-200 hover:bg-slate-300"
                                  : "border-slate-300 bg-slate-200",
                              "disabled:cursor-not-allowed disabled:opacity-70",
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
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-nowrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                            aria-label="Edit discount coupon"
                            title="Edit"
                            disabled={!discountsEnabled}
                            className={[
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition",
                              discountsEnabled
                                ? "border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                : "border-slate-200 text-slate-300",
                              "disabled:cursor-not-allowed disabled:opacity-70",
                            ].join(" ")}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.uniqueId)}
                            aria-label="Delete discount coupon"
                            title={
                              !discountsEnabled
                                ? "Delete is disabled until discount coupons are enabled."
                                : canDeleteCoupon(coupon)
                                  ? "Delete"
                                  : "This coupon has already been used and cannot be deleted."
                            }
                            disabled={!discountsEnabled || !canDeleteCoupon(coupon)}
                            className={[
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition",
                              discountsEnabled && canDeleteCoupon(coupon)
                                ? "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                                : "border-slate-200 text-slate-300",
                              "disabled:cursor-not-allowed disabled:opacity-70",
                            ].join(" ")}
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
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No discount coupons have been created yet.
          </div>
        )}

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


