import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { formatUtcToLocalDateTime } from "../lib/dateTime";
import { fetchMembershipMemberDetail } from "../lib/membershipMembers";
import { getMembershipRegistrationInfo } from "../lib/membershipRegistration";
import type {
  MembershipMemberCustomFormAnswer,
  MembershipMemberCustomQuestionAnswer,
} from "../types/membership";
import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormSummary,
  MembershipRegistrationCustomQuestion,
} from "../types/membershipRegistration";

const STALE_TIME_5_MIN_MS = 5 * 60 * 1000;
type MemberTone = "slate" | "cyan" | "emerald" | "amber" | "rose";

type CustomFormItemView = MembershipMemberCustomFormAnswer & {
  fieldDefinition: MembershipRegistrationCustomFormField | null;
};

type CustomQuestionItemView = MembershipMemberCustomQuestionAnswer & {
  questionDefinition: MembershipRegistrationCustomQuestion | null;
};

type CustomFormSectionView = {
  id: string;
  title: string;
  description: string;
  layoutColumn: number;
  items: CustomFormItemView[];
  order: number;
};

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

function normalizeControlType(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseSelectedValues(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma-delimited parsing below.
    }
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function groupCustomFormResponses(
  responses: MembershipMemberCustomFormAnswer[],
  formDefinitions: MembershipRegistrationCustomFormSummary[],
): CustomFormSectionView[] {
  const formLookup = new Map(formDefinitions.map((form) => [form.uniqueId, form]));
  const fieldLookup = new Map(
    formDefinitions.flatMap((form) => form.fields.map((field) => [field.uniqueId, { form, field }] as const)),
  );

  const sections = new Map<string, CustomFormSectionView>();

  formDefinitions.forEach((form, index) => {
    sections.set(form.uniqueId, {
      id: form.uniqueId,
      title: form.headerText || form.name || "Custom form responses",
      description: form.description || "",
      layoutColumn: Math.max(1, Math.min(4, form.layoutColumn ?? 2)),
      items: [],
      order: index,
    });
  });

  responses.forEach((response, index) => {
    const fieldDefinition = response.formUniqueId ? fieldLookup.get(response.fieldUniqueId ?? "")?.field ?? null : null;
    const formDefinition = response.formUniqueId ? formLookup.get(response.formUniqueId) ?? null : null;
    const key = formDefinition?.uniqueId || response.formUniqueId || response.formName || `form-${index}`;
    const current = sections.get(key);

    if (current) {
      current.items.push({
        ...response,
        fieldDefinition,
      });
      return;
    }

    sections.set(key, {
      id: key,
      title: response.formHeaderText || response.formName || "Custom form responses",
      description: response.formDescription || "",
      layoutColumn: Math.max(1, Math.min(4, response.formLayoutColumn ?? 2)),
      items: [
        {
          ...response,
          fieldDefinition,
        },
      ],
      order: formDefinitions.length + index,
    });
  });

  return Array.from(sections.values())
    .map((section) => ({
      ...section,
      items: [...section.items].sort((left, right) => {
        const leftOrder = left.fieldDisplayOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.fieldDisplayOrder ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return (left.fieldLabel || left.fieldUniqueId || "").localeCompare(right.fieldLabel || right.fieldUniqueId || "");
      }),
    }))
    .sort((left, right) => left.order - right.order);
}

function mapCustomQuestionResponses(
  responses: MembershipMemberCustomQuestionAnswer[],
  questionDefinitions: MembershipRegistrationCustomQuestion[],
): CustomQuestionItemView[] {
  const questionLookup = new Map(questionDefinitions.map((question) => [question.uniqueId, question]));

  return responses.map((response) => ({
    ...response,
    questionDefinition: questionLookup.get(response.questionUniqueId) ?? null,
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
  const membershipTypeUniqueId = member?.membershipTypeUniqueId ?? null;

  const registrationInfoQuery = useQuery({
    queryKey: ["membership-registration-info", membershipTypeUniqueId ?? ""],
    queryFn: () => getMembershipRegistrationInfo(membershipTypeUniqueId ?? ""),
    enabled: Boolean(membershipTypeUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const registrationInfo = registrationInfoQuery.data ?? null;

  const customFormSections = useMemo(() => {
    if (!member) {
      return [];
    }

    return groupCustomFormResponses(
      member.customFormResponses,
      registrationInfo?.membershipDetail.customForms ?? [],
    );
  }, [member, registrationInfo]);

  const customQuestionResponses = useMemo(() => {
    if (!member) {
      return [];
    }

    return mapCustomQuestionResponses(
      member.customQuestionResponses,
      registrationInfo?.membershipDetail.customQuestions ?? [],
    );
  }, [member, registrationInfo]);

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

  const error = memberUniqueId
    ? memberQuery.error instanceof Error
      ? memberQuery.error.message
      : registrationInfoQuery.error instanceof Error
        ? registrationInfoQuery.error.message
        : null
    : "Member ID is missing.";
  const membershipExpiryLabel = member ? formatUtcToLocalDateTime(member.membershipExpiryUtc) : "No expiry";
  const membershipStartLabel = member?.membershipStartUtc ? formatUtcToLocalDateTime(member.membershipStartUtc) : "Not available";

  return {
    memberUniqueId,
    member,
    registrationInfo,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressLines,
    membershipExpiryLabel,
    membershipStartLabel,
    isLoading: memberQuery.isPending || memberQuery.isFetching || registrationInfoQuery.isPending || registrationInfoQuery.isFetching,
    error,
    refetch: async () => {
      await memberQuery.refetch();
      await registrationInfoQuery.refetch();
    },
  };
}
