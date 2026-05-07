const wizardResponseCache = new Map<string, unknown>();
const wizardRequestCache = new Map<string, Promise<unknown>>();

export function readResponseData(payload: unknown) {
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

export function readText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => readText(item)).filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

export function isMembershipTypePlaceholderRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    "UniqueId" in record ||
    "uniqueId" in record ||
    "PlaceHolderText" in record ||
    "placeHolderText" in record
  );
}

export function flattenMembershipTypePlaceholderRecords(value: unknown): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];

  function visit(node: unknown) {
    if (!node) {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (isMembershipTypePlaceholderRecord(node)) {
      items.push(node);
      return;
    }

    if (typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(visit);
    }
  }

  visit(value);
  return items;
}

export function formatMembershipTypePlaceholderGroupLabel(value: string) {
  const normalizedValue = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  if (!normalizedValue) {
    return "Variables";
  }

  return normalizedValue
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

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

export function invalidateMembershipWizardQuestionsCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:questions:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardAdvanceSettingsCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:advance-settings:${membershipTypeUniqueId}`);
}

export function invalidateMembershipWizardReviewCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:review:${membershipTypeUniqueId}`);
}

export function invalidateOrganizerPaymentAccountSelectionCache() {
  invalidateWizardCache("organizer:payment-account-selection-items");
}

export function invalidateOrganizerPaymentMethodsCache(paymentAccountUniqueId: string) {
  invalidateWizardCache(`organizer:payment-methods:${paymentAccountUniqueId}`);
}

export function invalidateMembershipWizardProgressCache(membershipTypeUniqueId: string) {
  invalidateWizardCache(`wizard:progress:${membershipTypeUniqueId}`);
}

export { getCachedWizardResponse };
