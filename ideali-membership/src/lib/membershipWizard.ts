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

const wizardResponseCache = new Map<string, unknown>();
const wizardRequestCache = new Map<string, Promise<unknown>>();

async function getCachedWizardResponse<T>(cacheKey: string, loader: () => Promise<T>) {
  const cachedValue = wizardResponseCache.get(cacheKey);
  if (cachedValue !== undefined) {
    return cachedValue as T;
  }

  const cachedRequest = wizardRequestCache.get(cacheKey);
  if (cachedRequest) {
    return cachedRequest as Promise<T>;
  }

  const request = loader().then((value) => {
    wizardResponseCache.set(cacheKey, value);
    return value;
  });

  wizardRequestCache.set(cacheKey, request as Promise<unknown>);

  try {
    return await request;
  } finally {
    wizardRequestCache.delete(cacheKey);
  }
}

function invalidateWizardCache(cacheKey: string) {
  wizardResponseCache.delete(cacheKey);
  wizardRequestCache.delete(cacheKey);
}

function invalidateMembershipWizardProgressCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:progress:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardTitleCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:title:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardDescriptionCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:description:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardPricingCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:pricing:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardColorCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:color:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardBannerCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:banner:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardPaymentAccountCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:payment-account:${membershipTypeUniqueId}`);
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

  invalidateMembershipWizardTitleCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

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
  return getCachedWizardResponse(`wizard:title:${membershipTypeUniqueId}`, async () => {
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
  });
}

export async function getMembershipDescriptionInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:description:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/description`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const description = readText(responseData?.Description ?? responseData?.description);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership description response.");
    }

    return {
      uniqueId,
      description,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 2,
    };
  });
}

export async function getMembershipPricingInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:pricing:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/pricing`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const tenureValue = readNumber(responseData?.Tenure ?? responseData?.tenure);
    const customExpiryMonthValue = readNumber(
      responseData?.CustomExpiryMonth ?? responseData?.customExpiryMonth,
    );
    const customExpiryDayValue = readNumber(responseData?.CustomExpiryDay ?? responseData?.customExpiryDay);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership pricing response.");
    }

    return {
      uniqueId,
      pricing:
        typeof tenureValue === "number" && Number.isFinite(tenureValue)
          ? tenureValue
          : null,
      customExpiryMonth:
        typeof customExpiryMonthValue === "number" && Number.isFinite(customExpiryMonthValue)
          ? customExpiryMonthValue
          : null,
      customExpiryDay:
        typeof customExpiryDayValue === "number" && Number.isFinite(customExpiryDayValue)
          ? customExpiryDayValue
          : null,
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 5,
    };
  });
}

export async function saveMembershipPricingStep(
  pricing: number | null,
  customExpiryMonth: number | null,
  customExpiryDay: number | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership pricing saving.");
  }

  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/${membershipTypeUniqueId}/pricing?stepNumber=${stepNumber}`,
    {
      tenure: pricing,
      customExpiryMonth,
      customExpiryDay,
    },
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
    throw new Error("Unexpected membership pricing response.");
  }

  invalidateMembershipWizardPricingCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipDescriptionStep(
  description: string | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership description saving.");
  }

  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/${membershipTypeUniqueId}/description?stepNumber=${stepNumber}`,
    { description },
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
    throw new Error("Unexpected membership description response.");
  }

  invalidateMembershipWizardDescriptionCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipColorInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:color:${membershipTypeUniqueId}`, async () => {
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
  });
}

export async function getMembershipBannerInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:banner:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/banner`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const bannerUrl = readText(responseData?.BannerUrl ?? responseData?.bannerUrl);
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership banner response.");
    }

    return {
      uniqueId,
      bannerUrl: bannerUrl || "",
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 4,
    };
  });
}

export async function getMembershipPaymentAccountInfo(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:payment-account:${membershipTypeUniqueId}`, async () => {
    const payload = await getJson<unknown>(`/api/membership/type/wizard/${membershipTypeUniqueId}/payment-account`);
    const responseData = readResponseData(payload) as Record<string, unknown> | null;

    const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
    const paymentAccountUniqueId = readText(
      responseData?.PaymentAccountUniqueId ?? responseData?.paymentAccountUniqueId,
    );
    const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

    if (!uniqueId) {
      throw new Error("Unexpected membership payment account response.");
    }

    return {
      uniqueId,
      paymentAccountUniqueId: paymentAccountUniqueId || "",
      stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 6,
    };
  });
}

export async function saveMembershipPaymentAccountStep(
  paymentAccountUniqueId: string,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership payment account saving.");
  }

  if (!paymentAccountUniqueId) {
    throw new Error("Payment account is required.");
  }

  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/${membershipTypeUniqueId}/payment-account?stepNumber=${stepNumber}`,
    { paymentAccountUniqueId },
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
    throw new Error("Unexpected membership payment account response.");
  }

  invalidateMembershipWizardPaymentAccountCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function saveMembershipBannerStep(
  bannerUrl: string | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership banner saving.");
  }

  const payload = await postJson<unknown>(
    `/api/membership/type/wizard/${membershipTypeUniqueId}/banner?stepNumber=${stepNumber}`,
    { bannerUrl },
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
    throw new Error("Unexpected membership banner response.");
  }

  invalidateMembershipWizardBannerCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
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

  invalidateMembershipWizardColorCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}

export async function getMembershipWizardProgress(membershipTypeUniqueId: string) {
  return getCachedWizardResponse(`wizard:progress:${membershipTypeUniqueId}`, async () => {
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
  });
}

export function invalidateMembershipWizardProgress(membershipTypeUniqueId: string) {
  invalidateMembershipWizardProgressCache(membershipTypeUniqueId);
}
