import { postJson } from "./api";

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

export async function saveMembershipTitleStep(name: string, stepNumber: number) {
  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/title?stepNumber=${stepNumber}`,
    { name },
  );

  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const membershipTypeUniqueId = readText(
    responseData?.UniqueId ??
      responseData?.uniqueId ??
      responseData?.MembershipTypeUniqueId ??
      responseData?.membershipTypeUniqueId,
  );

  if (!membershipTypeUniqueId) {
    throw new Error("Unexpected membership title response.");
  }

  return {
    membershipTypeUniqueId,
    responseData,
  };
}
