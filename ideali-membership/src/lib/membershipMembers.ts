import { getJson } from "./api";
import type {
  MembershipMemberCustomFormAnswer,
  MembershipMemberCustomQuestionAnswer,
  MembershipMemberDetailItem,
  MembershipMemberListItem,
  MembershipMemberSortBy,
  PageResult,
} from "../types/membership";
import { readResponseData, readText } from "./parseUtils";

function readNullableText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readCustomFormAnswers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): MembershipMemberCustomFormAnswer | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const valueText = readText(
        record.Value ?? record.value ?? record.Answer ?? record.answer ?? record.Text ?? record.text,
      );

      return {
        formUniqueId: readNullableText(record.FormUniqueId ?? record.formUniqueId ?? record.FormId ?? record.formId),
        formName: readText(record.FormName ?? record.formName ?? record.FormTitle ?? record.formTitle),
        formHeaderText: readNullableText(record.FormHeaderText ?? record.formHeaderText ?? record.HeaderText ?? record.headerText),
        formDescription: readNullableText(record.FormDescription ?? record.formDescription ?? record.Description ?? record.description),
        formLayoutColumn: readNullableNumber(record.FormLayoutColumn ?? record.formLayoutColumn ?? record.LayoutColumn ?? record.layoutColumn),
        fieldUniqueId: readNullableText(record.FieldUniqueId ?? record.fieldUniqueId ?? record.FieldId ?? record.fieldId),
        fieldLabel: readText(record.FieldLabel ?? record.fieldLabel ?? record.Label ?? record.label),
        fieldType: readNullableText(record.FieldType ?? record.fieldType ?? record.ControlType ?? record.controlType),
        fieldDisplayOrder: readNullableNumber(record.FieldDisplayOrder ?? record.fieldDisplayOrder ?? record.DisplayOrder ?? record.displayOrder),
        fieldLayoutColumn: readNullableNumber(record.FieldLayoutColumn ?? record.fieldLayoutColumn ?? record.LayoutColumn ?? record.layoutColumn),
        value: valueText,
      };
    })
    .filter((item): item is MembershipMemberCustomFormAnswer => Boolean(item?.fieldLabel || item?.value));
}

function readCustomQuestionAnswers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): MembershipMemberCustomQuestionAnswer | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        questionUniqueId: readText(record.QuestionUniqueId ?? record.questionUniqueId ?? record.UniqueId ?? record.uniqueId),
        questionLabel: readText(record.QuestionLabel ?? record.questionLabel ?? record.Label ?? record.label),
        controlType: readNullableText(record.ControlType ?? record.controlType ?? record.QuestionType ?? record.questionType),
        optionLabel: readNullableText(record.OptionLabel ?? record.optionLabel ?? record.DisplayText ?? record.displayText),
        fileStorageId: readNullableNumber(record.FileStorageId ?? record.fileStorageId),
        value: readNullableText(record.Value ?? record.value ?? record.Answer ?? record.answer),
      };
    })
    .filter((item): item is MembershipMemberCustomQuestionAnswer => Boolean(item?.questionUniqueId || item?.questionLabel || item?.value));
}

function pickMemberDetailRecord(responseData: Record<string, unknown> | null) {
  const nested = responseData?.MemberDetail ?? responseData?.memberDetail ?? responseData?.MembershipDetail ?? responseData?.membershipDetail;
  return (nested && typeof nested === "object" ? (nested as Record<string, unknown>) : responseData) ?? null;
}

function readMemberUniqueId(record: Record<string, unknown>) {
  return readText(
    record.UniqueId ??
      record.uniqueId ??
      record.MemberUniqueId ??
      record.memberUniqueId ??
      record.MembershipMemberUniqueId ??
      record.membershipMemberUniqueId ??
      record.RegistrationUniqueId ??
      record.registrationUniqueId ??
      record.MemberId ??
      record.memberId ??
      record.Id ??
      record.id,
  );
}

function buildQueryString(
  pageNo: number,
  pageSize: number,
  membershipStatuses?: string[] | null,
  membershipTypeUniqueIds?: string[] | null,
  searchTerm?: string | null,
  sortBy?: MembershipMemberSortBy | null,
  sortOrder?: "asc" | "desc" | null,
) {
  const searchParams = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  const normalizedMembershipStatuses = Array.from(
    new Set((membershipStatuses ?? []).map((value) => value.trim()).filter((value) => value.length > 0)),
  );

  normalizedMembershipStatuses.forEach((membershipStatus) => {
    searchParams.append("membershipStatuses", membershipStatus);
  });

  const uniqueIds = Array.from(
    new Set((membershipTypeUniqueIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0)),
  );

  uniqueIds.forEach((membershipTypeUniqueId) => {
    searchParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
  });

  const normalizedSearchTerm = searchTerm?.trim();
  if (normalizedSearchTerm) {
    searchParams.set("searchTerm", normalizedSearchTerm);
  }

  if (sortBy) {
    searchParams.set("sortBy", sortBy);
  }

  if (sortOrder) {
    searchParams.set("sortOrder", sortOrder);
  }

  return searchParams.toString();
}

export async function fetchMembershipMembers(
  pageNo: number,
  pageSize: number,
  membershipStatuses?: string[] | null,
  membershipTypeUniqueIds?: string[] | null,
  searchTerm?: string | null,
  sortBy?: MembershipMemberSortBy | null,
  sortOrder?: "asc" | "desc" | null,
) {
  const payload = await getJson<unknown>(
    `/api/organizer/membership/type/members?${buildQueryString(
      pageNo,
      pageSize,
      membershipStatuses,
      membershipTypeUniqueIds,
      searchTerm,
      sortBy,
      sortOrder,
    )}`,
  );
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const items = Array.isArray(responseData?.PageData)
    ? (responseData.PageData as Array<Record<string, unknown>>)
    : Array.isArray(responseData?.pageData)
      ? (responseData.pageData as Array<Record<string, unknown>>)
      : [];

  const pageResult: PageResult<MembershipMemberListItem> = {
    pageNo: readNumber(responseData?.PageNo ?? responseData?.pageNo, pageNo),
    pageSize: readNumber(responseData?.PageSize ?? responseData?.pageSize, pageSize),
    pageCount: readNumber(responseData?.PageCount ?? responseData?.pageCount, 0),
    totalRecordsCount: readNumber(responseData?.TotalRecordsCount ?? responseData?.totalRecordsCount, 0),
    pageData: items
      .map((item): MembershipMemberListItem => ({
        uniqueId: readMemberUniqueId(item),
        memberFullName: readText(item.MemberFullName ?? item.memberFullName),
        activeMembershipName: readText(item.ActiveMembershipName ?? item.activeMembershipName),
        membershipStatus: readText(item.MembershipStatus ?? item.membershipStatus),
        email: readText(item.Email ?? item.email),
        membershipExpiryUtc: readNullableText(item.MembershipExpiryUtc ?? item.membershipExpiryUtc),
      }))
      .filter((item) => item.memberFullName.length > 0 || item.email.length > 0),
  };

  return pageResult;
}

export async function fetchMembershipMemberDetail(memberUniqueId: string) {
  const payload = await getJson<unknown>(`/api/organizer/membership/type/members/${memberUniqueId}/detail`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;
  const detailRecord = pickMemberDetailRecord(responseData);

  if (!detailRecord) {
    throw new Error("Unable to load member details.");
  }

  const customFormResponses = readCustomFormAnswers(
    responseData?.CustomFormResponses ??
      responseData?.customFormResponses ??
      detailRecord.CustomFormResponses ??
      detailRecord.customFormResponses ??
      detailRecord.CustomFormsResponses ??
      detailRecord.customFormsResponses,
  );

  const customQuestionResponses = readCustomQuestionAnswers(
    responseData?.CustomQuestionResponses ??
      responseData?.customQuestionResponses ??
      detailRecord.CustomQuestionResponses ??
      detailRecord.customQuestionResponses ??
      detailRecord.CustomQuestionsResponses ??
      detailRecord.customQuestionsResponses,
  );

  const memberFullName = readText(
    detailRecord.MemberFullName ??
      detailRecord.memberFullName ??
      detailRecord.FullName ??
      detailRecord.fullName ??
      detailRecord.Name ??
      detailRecord.name,
  );

  if (!memberFullName) {
    throw new Error("Unexpected member detail response.");
  }

  return {
    uniqueId: readMemberUniqueId(detailRecord) || memberUniqueId,
    memberFullName,
    activeMembershipName: readText(
      detailRecord.ActiveMembershipName ??
        detailRecord.activeMembershipName ??
        detailRecord.MembershipName ??
        detailRecord.membershipName,
    ),
    membershipStatus: readText(detailRecord.MembershipStatus ?? detailRecord.membershipStatus),
    email: readText(detailRecord.Email ?? detailRecord.email),
    membershipExpiryUtc: readNullableText(detailRecord.MembershipExpiryUtc ?? detailRecord.membershipExpiryUtc),
    membershipStartUtc: readNullableText(detailRecord.MembershipStartUtc ?? detailRecord.membershipStartUtc),
    memberPhotoUrl: readNullableText(
      detailRecord.MemberPhotoUrl ??
        detailRecord.memberPhotoUrl ??
        detailRecord.ProfilePhotoUrl ??
        detailRecord.profilePhotoUrl ??
        detailRecord.AvatarUrl ??
        detailRecord.avatarUrl,
    ),
    contactPrefix: readNullableText(detailRecord.ContactPrefix ?? detailRecord.contactPrefix),
    firstName: readNullableText(detailRecord.FirstName ?? detailRecord.firstName),
    middleName: readNullableText(detailRecord.MiddleName ?? detailRecord.middleName),
    lastName: readNullableText(detailRecord.LastName ?? detailRecord.lastName),
    cellPhone: readNullableText(detailRecord.CellPhone ?? detailRecord.cellPhone),
    streetLine1: readNullableText(detailRecord.StreetLine1 ?? detailRecord.streetLine1),
    streetLine2: readNullableText(detailRecord.StreetLine2 ?? detailRecord.streetLine2),
    cityName: readNullableText(detailRecord.CityName ?? detailRecord.cityName),
    stateName: readNullableText(detailRecord.StateName ?? detailRecord.stateName),
    countryName: readNullableText(detailRecord.CountryName ?? detailRecord.countryName),
    zipCode: readNullableText(detailRecord.ZipCode ?? detailRecord.zipCode),
    notes: readNullableText(detailRecord.Notes ?? detailRecord.notes),
    customFormResponses,
    customQuestionResponses,
  } satisfies MembershipMemberDetailItem;
}

export async function fetchMembershipStatusOptions() {
  const payload = await getJson<unknown>("/api/organizer/membership/type/status-options");
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null | Array<unknown>;
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.PageData)
      ? responseData.PageData
      : Array.isArray(responseData?.Data)
        ? responseData.Data
        : [];

  return items
    .map((item) => ({
      label: readText((item as { Text?: unknown; text?: unknown }).Text ?? (item as { Text?: unknown; text?: unknown }).text),
      value: readText((item as { Value?: unknown; value?: unknown }).Value ?? (item as { Value?: unknown; value?: unknown }).value),
    }))
    .filter((item) => item.label.length > 0 && item.value.length > 0);
}

export async function fetchMembershipTypeOptions() {
  const payload = await getJson<unknown>("/api/organizer/membership/type/options");
  const responseData = readResponseData(payload) as { PageData?: unknown; Data?: unknown } | null | Array<unknown>;
  const items = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.PageData)
      ? responseData.PageData
      : Array.isArray(responseData?.Data)
        ? responseData.Data
        : [];

  return items
    .map((item) => ({
      label: readText((item as { Text?: unknown; text?: unknown }).Text ?? (item as { Text?: unknown; text?: unknown }).text),
      value: readText((item as { Value?: unknown; value?: unknown }).Value ?? (item as { Value?: unknown; value?: unknown }).value),
    }))
    .filter((item) => item.label.length > 0 && item.value.length > 0);
}
