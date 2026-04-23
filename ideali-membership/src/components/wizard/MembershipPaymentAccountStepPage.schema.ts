export function normalizeMembershipPaymentAccountUniqueId(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function getMembershipPaymentAccountError(value: string | null | undefined) {
  return normalizeMembershipPaymentAccountUniqueId(value)
    ? ""
    : "Please select a payment account first.";
}
