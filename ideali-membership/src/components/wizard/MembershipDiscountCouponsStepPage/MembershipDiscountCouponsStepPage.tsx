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
  DeleteDiscountCouponModal,
  MembershipDiscountCouponModal,
} from "./MembershipDiscountCouponsStepPage.components";
import {
  MEMBERSHIP_DISCOUNT_COUPONS_CONTENT,
  MEMBERSHIP_DISCOUNT_COUPONS_NEXT_STEP_NUMBER,
  MEMBERSHIP_DISCOUNT_COUPONS_STEP_NUMBER,
} from "./MembershipDiscountCouponsStepPage.fields";
import { MembershipDiscountCouponsStepPageContent } from "./MembershipDiscountCouponsStepPage.content";
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

      <MembershipDiscountCouponsStepPageContent
        copiedCouponUniqueId={copiedCouponUniqueId}
        coupons={coupons}
        discountsEnabled={discountsEnabled}
        error={error}
        isLoading={isLoading}
        isSaving={isSaving}
        onCanDeleteCoupon={canDeleteCoupon}
        onCopyCouponCode={handleCopyCouponCode}
        onCreateCoupon={handleOpenCreateModal}
        onDeleteCoupon={handleDeleteCoupon}
        onEditCoupon={handleEditCoupon}
        onToggleCouponActive={handleToggleCouponActive}
        onToggleDiscounts={handleToggleDiscounts}
        toastMessage={toastMessage}
      />

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


