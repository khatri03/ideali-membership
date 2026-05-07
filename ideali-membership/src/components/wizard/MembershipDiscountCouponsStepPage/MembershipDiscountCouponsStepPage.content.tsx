import type { DiscountCouponListItem } from "../../../types/membership";
import {
  CheckIcon,
  CopyIcon,
  formatDiscountAmount,
  formatDiscountTypeLabel,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "./MembershipDiscountCouponsStepPage.utils";

export function MembershipDiscountCouponsStepPageContent({
  copiedCouponUniqueId,
  coupons,
  discountsEnabled,
  error,
  isLoading,
  isSaving,
  onCopyCouponCode,
  onCreateCoupon,
  onCanDeleteCoupon,
  onDeleteCoupon,
  onEditCoupon,
  onToggleCouponActive,
  onToggleDiscounts,
  toastMessage,
}: {
  copiedCouponUniqueId: string;
  coupons: DiscountCouponListItem[];
  discountsEnabled: boolean;
  error: string;
  isLoading: boolean;
  isSaving: boolean;
  onCopyCouponCode: (coupon: DiscountCouponListItem) => void;
  onCreateCoupon: () => void;
  onCanDeleteCoupon: (coupon: DiscountCouponListItem) => boolean;
  onDeleteCoupon: (couponId: string) => void;
  onEditCoupon: (coupon: DiscountCouponListItem) => void;
  onToggleCouponActive: (couponId: string) => void;
  onToggleDiscounts: () => void;
  toastMessage: string;
}) {
  return (
    <>
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
              onClick={() => void onToggleDiscounts()}
              data-wizard-focus="true"
              disabled={isLoading || isSaving}
              className={[
                "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition",
                discountsEnabled ? "border-cyan-500 bg-cyan-500" : "border-slate-300 bg-slate-200 hover:bg-slate-300",
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
            <p className="text-xs leading-5 text-slate-500">Add coupons only after discounts are enabled.</p>
          </div>

          <button
            type="button"
            aria-label="Add discount coupon"
            onClick={onCreateCoupon}
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
                              onClick={() => void onCopyCouponCode(coupon)}
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
                              onClick={() => onToggleCouponActive(coupon.uniqueId)}
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
                              onClick={() => onEditCoupon(coupon)}
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
                              onClick={() => onDeleteCoupon(coupon.uniqueId)}
                              aria-label="Delete discount coupon"
                              title={
                                !discountsEnabled
                                  ? "Delete is disabled until discount coupons are enabled."
                                  : onCanDeleteCoupon(coupon)
                                    ? "Delete"
                                    : "This coupon has already been used and cannot be deleted."
                              }
                              disabled={!discountsEnabled || !onCanDeleteCoupon(coupon)}
                              className={[
                                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white transition",
                                discountsEnabled && onCanDeleteCoupon(coupon)
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
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </div>
    </>
  );
}
