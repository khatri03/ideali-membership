export function normalizeMembershipPaymentAccountUniqueId(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function getMembershipPaymentAccountError(value: string | null | undefined) {
  return normalizeMembershipPaymentAccountUniqueId(value)
    ? ""
    : "Payment account is required.";
}
