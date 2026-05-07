import { getJson, postJson } from "./api";
import {
  invalidateMembershipWizardProgressCache,
  invalidateMembershipWizardQuestionsCache,
  invalidateMembershipWizardReviewCache,
  readNumber,
  readResponseData,
  readStringArray,
  readText,
} from "./membershipWizard.shared";
import type {
  MembershipCustomQuestionDraft,
  MembershipCustomQuestionOptionDraft,
  MembershipQuestionsInfo,
} from "../types/membership";

function createCustomQuestionOptionDraftFromApi(option: unknown): MembershipCustomQuestionOptionDraft | null {
  const optionCandidate = option as Record<string, unknown>;
  const id = readText(optionCandidate.UniqueId ?? optionCandidate.uniqueId);
  const displayText = readText(optionCandidate.DisplayText ?? optionCandidate.displayText);
  const value = readText(optionCandidate.Value ?? optionCandidate.value);

  if (!id || !displayText || !value) {
    return null;
  }

  return {
    id,
    displayText,
    value,
    isDefault: Boolean(optionCandidate.IsDefault ?? optionCandidate.isDefault),
  };
}

export async function getMembershipQuestionsInfo(membershipTypeUniqueId: string) {
  const payload = await getJson<unknown>(`/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/questions`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const uniqueId = readText(responseData?.UniqueId ?? responseData?.uniqueId);
  const customFormUniqueIds = Array.isArray(responseData?.CustomFormUniqueIds ?? responseData?.customFormUniqueIds)
    ? ((responseData?.CustomFormUniqueIds ?? responseData?.customFormUniqueIds) as unknown[])
        .map((item) => readText(item))
        .filter((item) => item.length > 0)
    : [];
  const customQuestions = Array.isArray(responseData?.CustomQuestions ?? responseData?.customQuestions)
    ? ((responseData?.CustomQuestions ?? responseData?.customQuestions) as unknown[])
        .map((item): MembershipCustomQuestionDraft | null => {
          const candidate = item as Record<string, unknown>;
          const options = Array.isArray(candidate.Options ?? candidate.options)
            ? ((candidate.Options ?? candidate.options) as unknown[])
                .map(createCustomQuestionOptionDraftFromApi)
                .filter((option): option is MembershipCustomQuestionOptionDraft => option !== null)
            : [];

          const id = readText(candidate.UniqueId ?? candidate.uniqueId);
          const controlName = readText(candidate.ControlName ?? candidate.controlName);
          const controlType = readText(candidate.ControlType ?? candidate.controlType);

          if (!id || !controlName || !controlType) {
            return null;
          }

          return {
            id,
            controlId: Number(candidate.ControlId ?? candidate.controlId ?? 0),
            controlName,
            controlType,
            iconClass: readText(candidate.IconClass ?? candidate.iconClass),
            label: readText(candidate.Label ?? candidate.label),
            placeHolder: readText(candidate.PlaceHolder ?? candidate.placeHolder) || null,
            tooltip: readText(candidate.Tooltip ?? candidate.tooltip) || null,
            required: Boolean(candidate.Required ?? candidate.required),
            requiredMessage: readText(candidate.RequiredMessage ?? candidate.requiredMessage) || "",
            acceptedFileTypes: readStringArray(candidate.AcceptedFileTypes ?? candidate.acceptedFileTypes),
            minLength: readText(candidate.MinLength ?? candidate.minLength) || null,
            maxLength: readText(candidate.MaxLength ?? candidate.maxLength) || null,
            defaultValue: readText(candidate.DefaultValue ?? candidate.defaultValue) || null,
            displayOrder: Number(candidate.DisplayOrder ?? candidate.displayOrder ?? 0),
            options,
          };
        })
        .filter((item): item is MembershipCustomQuestionDraft => item !== null)
    : [];
  const stepNo = Number(responseData?.StepNo ?? responseData?.stepNo ?? 0);

  if (!uniqueId) {
    throw new Error("Unexpected membership questions response.");
  }

  return {
    uniqueId,
    customFormUniqueIds,
    customQuestions,
    stepNo: Number.isFinite(stepNo) && stepNo > 0 ? stepNo : 7,
  } satisfies MembershipQuestionsInfo;
}

export async function saveMembershipQuestionsStep(
  customFormUniqueIds: string[] | null,
  customQuestions: MembershipCustomQuestionDraft[] | null,
  stepNumber: number,
  membershipTypeUniqueId?: string,
) {
  if (!membershipTypeUniqueId) {
    throw new Error("membershipTypeUniqueId is required for membership questions saving.");
  }

  const requestBody = {
    customFormUniqueIds: customFormUniqueIds && customFormUniqueIds.length > 0 ? customFormUniqueIds : null,
    customQuestions:
      customQuestions && customQuestions.length > 0
        ? [...customQuestions]
            .sort((left, right) => left.displayOrder - right.displayOrder)
            .map((question) => ({
              uniqueId: question.id,
              controlId: question.controlId,
              controlName: question.controlName,
              controlType: question.controlType,
              iconClass: question.iconClass,
              label: question.label,
              placeHolder: question.placeHolder,
              tooltip: question.tooltip,
              required: question.required,
              requiredMessage: question.requiredMessage,
              acceptedFileTypes: question.acceptedFileTypes.join(",") || null,
              minLength: question.minLength,
              maxLength: question.maxLength,
              defaultValue: question.defaultValue,
              displayOrder: question.displayOrder,
              options: question.options.map((option) => ({
                uniqueId: option.id,
                displayText: option.displayText,
                value: option.value,
                isDefault: option.isDefault,
              })),
            }))
        : null,
  };

  const payload = await postJson<unknown>(
    `/api/organizer/membership/type/wizard/${membershipTypeUniqueId}/questions?stepNumber=${stepNumber}`,
    requestBody,
  );

  const responseData = readResponseData(payload);
  const savedMembershipTypeUniqueId =
    readText(responseData) ||
    readText(
      responseData && typeof responseData === "object"
        ? (responseData as Record<string, unknown>).UniqueId ??
            (responseData as Record<string, unknown>).uniqueId ??
            (responseData as Record<string, unknown>).MembershipTypeUniqueId ??
            (responseData as Record<string, unknown>).membershipTypeUniqueId
        : "",
    );

  if (!savedMembershipTypeUniqueId) {
    throw new Error("Unexpected membership questions response.");
  }

  invalidateMembershipWizardQuestionsCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardReviewCache(savedMembershipTypeUniqueId);
  invalidateMembershipWizardProgressCache(savedMembershipTypeUniqueId);

  return {
    membershipTypeUniqueId: savedMembershipTypeUniqueId,
    responseData,
  };
}
