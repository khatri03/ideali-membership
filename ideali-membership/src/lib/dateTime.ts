export function formatUtcToLocalDateTime(
  value: string | null,
  options?: {
    locale?: string;
    timeZone?: string;
    includeSeconds?: boolean;
  },
) {
  if (!value) {
    return "No expiry";
  }

  const parsedDate = parseUtcDate(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const locale = options?.locale ?? "en-GB";
  const timeZone = options?.timeZone ?? "Asia/Karachi";
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    hour12: true,
    timeZone,
  }).formatToParts(parsedDate);

  const day = parts.find((item) => item.type === "day")?.value ?? "";
  const month = parts.find((item) => item.type === "month")?.value ?? "";
  const year = parts.find((item) => item.type === "year")?.value ?? "";
  const hour = parts.find((item) => item.type === "hour")?.value ?? "";
  const minute = parts.find((item) => item.type === "minute")?.value ?? "";
  const second = options?.includeSeconds
    ? parts.find((item) => item.type === "second")?.value
    : null;
  const dayPeriod = parts.find((item) => item.type === "dayPeriod")?.value?.toLowerCase() ?? "";

  const dateLabel = `${day}-${month}-${year}`;
  const timeLabel = `${hour}:${minute}${second ? `:${second}` : ""} ${dayPeriod}`.trim();

  return `${dateLabel}, ${timeLabel}`;
}

function parseUtcDate(value: string) {
  const normalizedValue = normalizeUtcDateString(value);
  return new Date(normalizedValue);
}

function normalizeUtcDateString(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return trimmedValue;
  }

  if (/[zZ]$/.test(trimmedValue) || /[+-]\d{2}:?\d{2}$/.test(trimmedValue)) {
    return trimmedValue.replace(" ", "T");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return `${trimmedValue}T00:00:00Z`;
  }

  return `${trimmedValue.replace(" ", "T")}Z`;
}
