export function parseUtcDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatUtcDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function getMembershipAdvanceSettingsValidationError(
  registrationStartDateUtc: Date | null,
  registrationEndDateUtc: Date | null,
) {
  if (
    registrationStartDateUtc &&
    registrationEndDateUtc &&
    registrationEndDateUtc.getTime() <= registrationStartDateUtc.getTime()
  ) {
    return "Registration end date must be later than registration start date.";
  }

  return "";
}
