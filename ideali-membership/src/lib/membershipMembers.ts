import { getJson } from "./api";
import type { MembershipMemberListItem, PageResult } from "../types/membership";

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

function buildQueryString(pageNo: number, pageSize: number, membershipTypeUniqueIds?: string[] | null) {
  const searchParams = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  const uniqueIds = Array.from(
    new Set((membershipTypeUniqueIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0)),
  );

  uniqueIds.forEach((membershipTypeUniqueId) => {
    searchParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
  });

  return searchParams.toString();
}

export async function fetchMembershipMembers(pageNo: number, pageSize: number, membershipTypeUniqueIds?: string[] | null) {
  const payload = await getJson<unknown>(
    `/api/organizer/membership/type/members?${buildQueryString(pageNo, pageSize, membershipTypeUniqueIds)}`,
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

  return pageResult;
}
