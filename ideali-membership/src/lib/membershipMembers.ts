import { getJson } from "./api";
import type { MembershipMemberListItem, PageResult } from "../types/membership";

const ENABLE_DUMMY_MEMBERS = import.meta.env.DEV;
const DUMMY_PAGE_COUNT = 8;

function readResponseData(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if ("Data" in payload) {
    return (payload as { Data?: unknown }).Data;
  }

  if ("data" in payload) {
    return (payload as { data?: unknown }).data;
  }

  return payload;
}

function readText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readNullableText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildQueryString(pageNo: number, pageSize: number, membershipTypeUniqueId?: string | null) {
  const searchParams = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  if (membershipTypeUniqueId) {
    searchParams.set("membershipTypeUniqueId", membershipTypeUniqueId);
  }

  return searchParams.toString();
}

function buildDummyMembers(
  pageNo: number,
  pageSize: number,
  membershipTypeUniqueId?: string | null,
): MembershipMemberListItem[] {
  const typeLabel = membershipTypeUniqueId?.trim()
    ? membershipTypeUniqueId.trim().slice(0, 8)
    : "general";

  return Array.from({ length: pageSize }, (_, index) => {
    const position = (pageNo - 1) * pageSize + index + 1;

    return {
      uniqueId: `dummy-member-${pageNo}-${index + 1}`,
      memberFullName: `Test Member ${position}`,
      activeMembershipName: `Test Membership ${typeLabel.toUpperCase()}`,
      email: `test.member.${position}@example.com`,
      membershipExpiryUtc:
        position % 3 === 0
          ? null
          : new Date(Date.now() + position * 86400000).toISOString(),
    };
  });
}

export async function fetchMembershipMembers(pageNo: number, pageSize: number, membershipTypeUniqueId?: string | null) {
  const payload = await getJson<unknown>(
    `/api/organizer/membership/type/members?${buildQueryString(pageNo, pageSize, membershipTypeUniqueId)}`,
  );
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const items = Array.isArray(responseData?.PageData)
    ? (responseData.PageData as Array<Record<string, unknown>>)
    : Array.isArray(responseData?.pageData)
      ? (responseData.pageData as Array<Record<string, unknown>>)
      : [];

  const pageResult: PageResult<MembershipMemberListItem> = {
    pageNo: readNumber(responseData?.PageNo ?? responseData?.pageNo, pageNo),
    pageSize: readNumber(responseData?.PageSize ?? responseData?.pageSize, pageSize),
    pageCount: readNumber(responseData?.PageCount ?? responseData?.pageCount, 0),
    totalRecordsCount: readNumber(responseData?.TotalRecordsCount ?? responseData?.totalRecordsCount, 0),
    pageData: items
      .map((item): MembershipMemberListItem => ({
        uniqueId: readText(item.UniqueId ?? item.uniqueId),
        memberFullName: readText(item.MemberFullName ?? item.memberFullName),
        activeMembershipName: readText(item.ActiveMembershipName ?? item.activeMembershipName),
        email: readText(item.Email ?? item.email),
        membershipExpiryUtc: readNullableText(item.MembershipExpiryUtc ?? item.membershipExpiryUtc),
      }))
      .filter((item) => item.memberFullName.length > 0 || item.email.length > 0),
  };

  if (ENABLE_DUMMY_MEMBERS) {
    const dummyMembers = buildDummyMembers(pageNo, pageSize, membershipTypeUniqueId);
    pageResult.pageData = [...pageResult.pageData, ...dummyMembers];
    pageResult.totalRecordsCount = Math.max(pageResult.totalRecordsCount, pageSize * DUMMY_PAGE_COUNT);
    pageResult.pageCount = Math.max(pageResult.pageCount, Math.ceil(pageResult.totalRecordsCount / pageSize));
  }

  return pageResult;
}
