import { getJson, postJson } from "./api";
import {
  invalidateMembershipWizardReviewCache,
  readBoolean,
  readNumber,
  readResponseData,
  readText,
} from "./membershipWizard.shared";
import type {
  DiscountCouponListItem,
  DiscountCouponTypeValue,
  MembershipDiscountCouponsInfo,
} from "../types/membership";

export interface MembershipDiscountCouponBatchSaveItem {
  uniqueId?: string;
  code: string;
  discountType: DiscountCouponTypeValue;
  discountValue: number;
  maxDiscountAmount: number | null;
  totalCoupons: number;
  isActive: boolean;
}

export interface MembershipDiscountCouponBatchSaveRequest {
  discountsEnabled: boolean;
  coupons: MembershipDiscountCouponBatchSaveItem[];
  deletedCouponIds: string[];
}

function readDiscountCouponList(payload: unknown) {
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null | Array<unknown>;
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.PageData)
      ? responseData.PageData
      : Array.isArray(responseData?.Data)
        ? responseData.Data
        : [];

  return items
    .map((item): DiscountCouponListItem => ({
      uniqueId: readText(item.UniqueId ?? item.uniqueId),
      code: readText(item.Code ?? item.code),
      moduleType: readText(item.ModuleType ?? item.moduleType),
      discountType: readText(item.DiscountType ?? item.discountType) as DiscountCouponTypeValue,
      discountValue: readNumber(item.DiscountValue ?? item.discountValue) ?? 0,
      maxDiscountAmount: readNumber(item.MaxDiscountAmount ?? item.maxDiscountAmount) ?? null,
      totalCoupons: readNumber(item.TotalCoupons ?? item.totalCoupons) ?? null,
      usageCount: readNumber(item.UsageCount ?? item.usageCount) ?? 0,
      isActive: readBoolean(item.IsActive ?? item.isActive) ?? false,
    }))
    .filter((item) => item.uniqueId && item.code);
}

export async function getMembershipDiscountCoupons(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(
    `/api/organizer/discount/coupon/list?pageNo=1&pageSize=100&moduleType=Membership&moduleEntityUniqueId=${membershipTypeUniqueId}`,
  );

  return readDiscountCouponList(payload);
}

export async function getMembershipDiscountCouponsInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(
    `/api/organizer/membership/type/${membershipTypeUniqueId}/discount-coupons`,
  );
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const discountsEnabled =
    typeof responseData?.DiscountsEnabled === "boolean"
      ? responseData.DiscountsEnabled
      : typeof responseData?.discountsEnabled === "boolean"
        ? responseData.discountsEnabled
        : undefined;

  if (typeof discountsEnabled !== "boolean") {
    throw new Error("Unable to load membership discount state.");
  }

  const coupons = readDiscountCouponList(responseData?.Coupons ?? responseData?.coupons ?? []);

  return {
    discountsEnabled,
    coupons,
  } satisfies MembershipDiscountCouponsInfo;
}

export async function saveMembershipDiscountCoupons(
  membershipTypeUniqueId: string,
  request: MembershipDiscountCouponBatchSaveRequest,
) {
  const payload = await postJson<unknown>("/api/organizer/discount/coupon/batch-save", {
    moduleType: "Membership",
    moduleEntityUniqueId: membershipTypeUniqueId,
    discountsEnabled: request.discountsEnabled,
    coupons: request.coupons,
    deletedCouponIds: request.deletedCouponIds,
  });

  invalidateMembershipWizardReviewCache(membershipTypeUniqueId);

  return payload;
}
