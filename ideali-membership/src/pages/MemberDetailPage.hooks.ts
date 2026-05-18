import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { formatUtcToLocalDateTime } from "../lib/dateTime";
import {
  approveMembershipMember,
  fetchMembershipMemberDetail,
  fetchMembershipStatusOptions,
  rejectMembershipMember,
} from "../lib/membershipMembers";
import { getMembershipRegistrationInfo } from "../lib/membershipRegistration";
import { showToast } from "../shared/components/toast/Toast";
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

type AddressFieldIconKey = "type" | "line1" | "line2" | "city" | "state" | "country" | "postal";

type AddressFieldView = {
  label: string;
  value: string;
  iconKey: AddressFieldIconKey;
};

type CustomFormSectionView = {
  id: string;
  title: string;
  description: string;
  layoutColumn: number;
  items: CustomFormItemView[];
  order: number;
};

function normalizeStatusValue(value: string) {
  return value.replace(/[\s_-]+/g, "").toLowerCase();
}

function getStatusTone(value: string): MemberTone {
  switch (normalizeStatusValue(value)) {
    case "active":
      return "emerald";
    case "pendingapproval":
    case "pending":
      return "amber";
    case "expired":
      return "rose";
    case "inactive":
    case "nearexpiry":
      return "cyan";
    default:
      return "slate";
  }
}

function getMembershipStartCardLabel(value: string) {
  switch (normalizeStatusValue(value)) {
    case "active":
      return "Member Since";
    case "pendingapproval":
    case "rejected":
      return "Applied On";
    default:
      return "Applied On";
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
    .filter((section) => section.items.length > 0)
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
  const [isUpdatingMembershipStatus, setIsUpdatingMembershipStatus] = useState(false);

  const memberQuery = useQuery({
    queryKey: ["membership-member-detail", memberUniqueId ?? ""],
    queryFn: () => fetchMembershipMemberDetail(memberUniqueId ?? ""),
    enabled: Boolean(memberUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const member = memberQuery.data ?? null;
  const membershipTypeUniqueId = member?.membership.membershipTypeUniqueId ?? null;

  const membershipStatusOptionsQuery = useQuery({
    queryKey: ["membership-status-options"],
    queryFn: fetchMembershipStatusOptions,
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const registrationInfoQuery = useQuery({
    queryKey: ["membership-registration-info", membershipTypeUniqueId ?? ""],
    queryFn: () => getMembershipRegistrationInfo(membershipTypeUniqueId ?? ""),
    enabled: Boolean(membershipTypeUniqueId),
    staleTime: STALE_TIME_5_MIN_MS,
  });

  const registrationInfo = registrationInfoQuery.data ?? null;
  const membershipStatusOptions = membershipStatusOptionsQuery.data ?? [];
  const membershipStatusLabelMap = useMemo(
    () => new Map(membershipStatusOptions.map((option) => [option.value, option.label] as const)),
    [membershipStatusOptions],
  );
  const membershipStatusLabel = useMemo(() => {
    if (!member) {
      return "Unknown";
    }

    return membershipStatusLabelMap.get(member.membership.membershipStatus) ?? (member.membership.membershipStatus || "Unknown");
  }, [member, membershipStatusLabelMap]);
  const isPendingApproval = normalizeStatusValue(member?.membership.membershipStatus ?? "") === "pendingapproval";

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

  const membershipStartLabel = member?.membership.membershipStartUtc
    ? formatUtcToLocalDateTime(member.membership.membershipStartUtc)
    : "Not available";

  const statCards = useMemo(() => {
    if (!member) {
      return [];
    }

    return [
      {
        label: "Active Memebrship",
        value: member.membership.activeMembershipName || "Not assigned",
        tone: "cyan" as const,
      },
      {
        label: "Status",
        value: membershipStatusLabel,
        tone: getStatusTone(member.membership.membershipStatus),
      },
      {
        label: getMembershipStartCardLabel(membershipStatusLabel),
        value: membershipStartLabel,
        tone: "slate" as const,
      },
      {
        label: "Expiry",
        value: formatUtcToLocalDateTime(member.membership.membershipExpiryUtc),
        tone: "amber" as const,
      },
    ];
  }, [member, membershipStartLabel, membershipStatusLabel]);

  const addressFields = useMemo<AddressFieldView[]>(() => {
    if (!member) {
      return [];
    }

    return [
      { label: "Type", value: member.address.type || "Primary", iconKey: "type" },
      { label: "Address Line 1", value: member.address.streetLine1 || "Not provided", iconKey: "line1" },
      { label: "Address Line 2", value: member.address.streetLine2 || "Not provided", iconKey: "line2" },
      { label: "City", value: member.address.city || "Not provided", iconKey: "city" },
      { label: "State", value: member.address.state || "Not provided", iconKey: "state" },
      { label: "Country", value: member.address.country || "Not provided", iconKey: "country" },
      { label: "Zip/Postal Code", value: member.address.zipCode || "Not provided", iconKey: "postal" },
    ];
  }, [member]);

  const fullName = useMemo(() => {
    if (!member) {
      return "Member detail";
    }

    const firstName = member.contact.firstName?.trim() ?? "";
    const middleName = member.contact.middleName?.trim() ?? "";
    const lastName = member.contact.lastName?.trim() ?? "";
    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Member detail";
  }, [member]);

  const error = memberUniqueId
    ? memberQuery.error instanceof Error
      ? memberQuery.error.message
      : registrationInfoQuery.error instanceof Error
        ? registrationInfoQuery.error.message
        : null
    : "Member ID is missing.";
  const membershipExpiryLabel = member ? formatUtcToLocalDateTime(member.membership.membershipExpiryUtc) : "No expiry";

  async function updateMembershipStatus(action: "approve" | "reject") {
    if (!memberUniqueId || !member) {
      return false;
    }

    if (!isPendingApproval) {
      showToast("Only pending approval members can be updated.", "error");
      return false;
    }

    setIsUpdatingMembershipStatus(true);

    try {
      if (action === "approve") {
        await approveMembershipMember(memberUniqueId);
        showToast("Member approved successfully.", "success");
      } else {
        await rejectMembershipMember(memberUniqueId);
        showToast("Member rejected successfully.", "success");
      }

      await memberQuery.refetch();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update member status.";
      showToast(message, "error");
      return false;
    } finally {
      setIsUpdatingMembershipStatus(false);
    }
  }

  return {
    memberUniqueId,
    member,
    registrationInfo,
    membershipStatusLabel,
    fullName,
    statCards,
    customFormSections,
    customQuestionResponses,
    addressFields,
    membershipExpiryLabel,
    membershipStartLabel,
    isPendingApproval,
    isUpdatingMembershipStatus,
    updateMembershipStatus,
    isLoading: memberQuery.isPending || memberQuery.isFetching || registrationInfoQuery.isPending || registrationInfoQuery.isFetching,
    error,
    refetch: async () => {
      await memberQuery.refetch();
      await registrationInfoQuery.refetch();
    },
  };
}
