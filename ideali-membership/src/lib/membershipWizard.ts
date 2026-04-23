import { getJson, postJson } from "./api";
import type { MembershipTitleInfo, MembershipTypeListItem } from "../types/membership";

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

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function saveMembershipTitleStep(
  name: string,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  const basePath = membershipTypeUniqueId
    ? `/api/membership/type/wizard/${membershipTypeUniqueId}/title`
    : "/api/membership/type/wizard/title";

  const payload = await postJson<unknown>(
    `${basePath}?stepNumber=${stepNumber}`,
    { name },
  );

  const responseData = readResponseData(payload);
  const savedMembershipTypeUniqueId =
    readText(responseData) ||
    readText(
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>).UniqueId ??
            (responseData as Record<string, unknown>).uniqueId ??
            (responseData as Record<string, unknown>).MembershipTypeUniqueId ??
            (responseData as Record<string, unknown>).membershipTypeUniqueId
        : "",
    );

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership title response.");
  }

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipTypes() {
  const payload = await getJson<unknown>("/api/membership/type/list");
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null;
  const items = (Array.isArray(responseData?.PageData)
    ? responseData?.PageData
    : Array.isArray(responseData?.Data)
      ? responseData?.Data
      : responseData) as Array<Record<string, unknown>>;

  return items
    .map((item): MembershipTypeListItem => ({
      text: readText(item.Text ?? item.text ?? item.Name ?? item.name),
      value: readText(item.Value ?? item.value ?? item.UniqueId ?? item.uniqueId),
    }))
    .filter((item) => item.text && item.value);
}

export async function getMembershipTitleInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/title`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
  const name = readText(responseData?.Name ?? responseData?.name);
  const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

  if (!uniqueId || !name) {
    throw new Error("Unexpected membership title response.");
  }

  return {
    uniqueId,
    name,
    stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 1,
  } satisfies MembershipTitleInfo;
}

export async function getMembershipColorInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/color`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
  const color = readText(responseData?.Color ?? responseData?.color);
  const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

  if (!uniqueId) {
    throw new Error("Unexpected membership color response.");
  }

  return {
    uniqueId,
    color: color || "",
    stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 3,
  };
}

export async function saveMembershipColorStep(
  color: string | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership color saving.");
  }

  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/${membershipTypeUniqueId}/color?stepNumber=${stepNumber}`,
    { color },
  );

  const responseData = readResponseData(payload);
  const savedMembershipTypeUniqueId =
    readText(responseData) ||
    readText(
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>).UniqueId ??
            (responseData as Record<string, unknown>).uniqueId ??
            (responseData as Record<string, unknown>).MembershipTypeUniqueId ??
            (responseData as Record<string, unknown>).membershipTypeUniqueId
        : "",
    );

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership color response.");
  }

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipWizardProgress(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/progress`);
  const responseData = readResponseData(payload);

  if (typeof responseData === "number") {
    return Number.isFinite(responseData) && responseData >= 0 ? responseData : 0;
  }

  if (responseData && typeof responseData === "object") {
    const record = responseData as Record<string, unknown>;
    const stepNumber =
      readNumber(record.StepNumber ?? record.stepNumber ?? record.StepNo ?? record.stepNo ?? record.Data) ??
      readNumber(record.data);

    if (typeof stepNumber === "number" && Number.isFinite(stepNumber) && stepNumber >= 0) {
      return stepNumber;
    }
  }

  return 0;
}
