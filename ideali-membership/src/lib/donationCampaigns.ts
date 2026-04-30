import { getJson } from "./api";
import type { DonationCampaignListItem } from "../types/donation";

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

export async function getCurrentOrganizerDonationCampaigns() {
  const payload = await getJson<unknown>("/api/organizer/donation/campaign-list");
  const responseData = readResponseData(payload) as Array<Record<string, unknown>> | Record<string, unknown> | null;

  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as Record<string, unknown> | null)?.PageData)
      ? ((responseData as Record<string, unknown>).PageData as Array<Record<string, unknown>>)
      : Array.isArray((responseData as Record<string, unknown> | null)?.Data)
        ? ((responseData as Record<string, unknown>).Data as Array<Record<string, unknown>>)
        : [];

  return (items ?? [])
    .map((item): DonationCampaignListItem => ({
      uniqueId: readText(item.UniqueId ?? item.uniqueId),
      name: readText(item.Name ?? item.name),
    }))
    .filter((item) => item.uniqueId && item.name);
}
