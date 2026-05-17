import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { formatUtcToLocalDateTime } from "../lib/dateTime";
import { fetchMembershipMemberDetail } from "../lib/membershipMembers";

const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;
type MemberTone = "slate" | "cyan" | "emerald" | "amber" | "rose";

function getStatusTone(value: string): MemberTone {
  switch (value) {
    case "Active":
      return "emerald";
    case "PendingApproval":
    case "Pending":
      return "amber";
    case "Expired":
      return "rose";
    case "InActive":
    case "NearExpiry":
      return "cyan";
    default:
      return "slate";
  }
}

function groupCustomFormResponses(
  responses: Array<{
    formUniqueId: string | null;
    formName: string;
    formHeaderText: string | null;
    formDescription: string | null;
    formLayoutColumn: number | null;
    fieldUniqueId: string | null;
    fieldLabel: string;
    fieldType: string | null;
    fieldDisplayOrder: number | null;
    fieldLayoutColumn: number | null;
    value: string;
  }>,
) {
  const sections = new Map<
    string,
    {
      id: string;
      title: string;
      description: string;
      layoutColumn: number;
      items: typeof responses;
    }
  >();

  responses.forEach((response, index) => {
    const key = response.formUniqueId || response.formName || `form-${index}`;
    const title = response.formHeaderText || response.formName || "Custom form responses";
    const description = response.formDescription || "";
    const layoutColumn = Math.max(1, Math.min(4, response.formLayoutColumn ?? 2));
    const current = sections.get(key);

    if (current) {
      current.items.push(response);
      return;
    }

    sections.set(key, {
      id: key,
      title,
      description,
      layoutColumn,
      items: [response],
    });
  });

  return Array.from(sections.values()).map((section) => ({
    ...section,
    items: [...section.items].sort((left, right) => {
      const leftOrder = left.fieldDisplayOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.fieldDisplayOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return (left.fieldLabel || left.fieldUniqueId || "").localeCompare(right.fieldLabel || right.fieldUniqueId || "");
    }),
  }));
}

export function useMemberDetailPage() {
  const { memberUniqueId } = useParams<{ memberUniqueId?: string }>();

  const memberQuery = useQuery({
    queryKey: ["membership-member-detail", memberUniqueId ?? ""],
    queryFn: () => fetchMembershipMemberDetail(memberUniqueId ?? ""),
    enabled: Boolean(memberUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const member = memberQuery.data ?? null;

  const customFormSections = useMemo(() => {
    if (!member) {
      return [];
    }

    return groupCustomFormResponses(member.customFormResponses);
  }, [member]);

  const customQuestionResponses = useMemo(() => {
    if (!member) {
      return [];
    }

    return member.customQuestionResponses;
  }, [member]);

  const statCards = useMemo(() => {
    if (!member) {
      return [];
    }

    return [
      {
        label: "Membership status",
        value: member.membershipStatus || "Unknown",
        detail: member.activeMembershipName || "Membership assignment unavailable",
        tone: getStatusTone(member.membershipStatus),
      },
      {
        label: "Email",
        value: member.email || "Not provided",
        detail: member.memberFullName,
        tone: "cyan" as const,
      },
      {
        label: "Expiry",
        value: formatUtcToLocalDateTime(member.membershipExpiryUtc),
        detail: member.membershipStartUtc ? `Started ${formatUtcToLocalDateTime(member.membershipStartUtc)}` : "Start date unavailable",
        tone: "amber" as const,
      },
      {
        label: "Custom responses",
        value: String(member.customFormResponses.length + member.customQuestionResponses.length),
        detail: `${member.customFormResponses.length} form ${member.customFormResponses.length === 1 ? "entry" : "entries"} and ${member.customQuestionResponses.length} question ${member.customQuestionResponses.length === 1 ? "entry" : "entries"}`,
        tone: "emerald" as const,
      },
    ];
  }, [member]);

  const addressLines = useMemo(() => {
    if (!member) {
      return [];
    }

    return [
      member.streetLine1,
      member.streetLine2,
      [member.cityName, member.stateName, member.zipCode].filter(Boolean).join(", "),
      member.countryName,
    ].filter((line): line is string => Boolean(line && line.trim().length > 0));
  }, [member]);

  const fullName = useMemo(() => {
    if (!member) {
      return "Member detail";
    }

    return member.memberFullName;
  }, [member]);

  const error = memberUniqueId ? (memberQuery.error instanceof Error ? memberQuery.error.message : null) : "Member ID is missing.";
  const membershipExpiryLabel = member ? formatUtcToLocalDateTime(member.membershipExpiryUtc) : "No expiry";
  const membershipStartLabel = member?.membershipStartUtc ? formatUtcToLocalDateTime(member.membershipStartUtc) : "Not available";

  return {
    memberUniqueId,
    member,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressLines,
    membershipExpiryLabel,
    membershipStartLabel,
    isLoading: memberQuery.isPending || memberQuery.isFetching,
    error,
    refetch: memberQuery.refetch,
  };
}
