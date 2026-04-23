export function normalizeMembershipDescription(value: string | null) {
  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? value : null;
}
