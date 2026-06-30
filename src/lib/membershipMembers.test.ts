import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchMembershipMemberDetail,
  fetchMembershipMembers,
  fetchMembershipStatusOptions,
  fetchMembershipTypeOptions,
} from "./membershipMembers";

vi.mock("./api", () => ({
  getJson: vi.fn(),
}));

import { getJson } from "./api";
const mockGetJson = vi.mocked(getJson);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── fetchMembershipMembers ───────────────────────────────────────────────────

describe("fetchMembershipMembers", () => {
  it("parses PascalCase response correctly", async () => {
    mockGetJson.mockResolvedValue({
      Data: {
        PageNo: 1,
        PageSize: 20,
        PageCount: 2,
        TotalRecordsCount: 25,
        PageData: [
          {
            UniqueId: "uid-1",
            MemberFullName: "John Doe",
            ActiveMembershipName: "Gold",
            MembershipStatus: "Active",
            Email: "john@example.com",
            MembershipExpiryUtc: "2026-12-31",
          },
        ],
      },
    });

    const result = await fetchMembershipMembers(1, 20);
    const first = result.pageData[0]!;

    expect(result.pageNo).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.pageCount).toBe(2);
    expect(result.totalRecordsCount).toBe(25);
    expect(result.pageData).toHaveLength(1);
    expect(first).toMatchObject({
      uniqueId: "uid-1",
      memberFullName: "John Doe",
      activeMembershipName: "Gold",
      membershipStatus: "Active",
      email: "john@example.com",
      membershipExpiryUtc: "2026-12-31",
    });
  });

  it("parses camelCase response correctly", async () => {
    mockGetJson.mockResolvedValue({
      data: {
        pageNo: 1,
        pageSize: 10,
        pageCount: 1,
        totalRecordsCount: 3,
        pageData: [
          {
            uniqueId: "uid-2",
            memberFullName: "Jane Smith",
            activeMembershipName: "Silver",
            membershipStatus: "Expired",
            email: "jane@example.com",
            membershipExpiryUtc: null,
          },
        ],
      },
    });

    const result = await fetchMembershipMembers(1, 10);
    const first = result.pageData[0]!;
    expect(first.uniqueId).toBe("uid-2");
    expect(first.membershipExpiryUtc).toBe(null);
  });

  it("filters out items with no name and no email", async () => {
    mockGetJson.mockResolvedValue({
      Data: {
        PageNo: 1,
        PageSize: 10,
        PageCount: 1,
        TotalRecordsCount: 2,
        PageData: [
          { UniqueId: "a", MemberFullName: "Alice", Email: "" },
          { UniqueId: "b", MemberFullName: "", Email: "" },
        ],
      },
    });

    const result = await fetchMembershipMembers(1, 10);
    expect(result.pageData).toHaveLength(1);
    expect(result.pageData[0]!.uniqueId).toBe("a");
  });

  it("supports alternate member id fields", async () => {
    mockGetJson.mockResolvedValue({
      Data: {
        PageNo: 1,
        PageSize: 10,
        PageCount: 1,
        TotalRecordsCount: 1,
        PageData: [
          {
            MemberUniqueId: "member-123",
            MemberFullName: "Alex Johnson",
            ActiveMembershipName: "Gold",
            MembershipStatus: "Active",
            Email: "alex@example.com",
          },
        ],
      },
    });

    const result = await fetchMembershipMembers(1, 10);
    expect(result.pageData[0]!.uniqueId).toBe("member-123");
  });

  it("includes query params: pageNo and pageSize always present", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 2, PageSize: 5, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(2, 5);

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("pageNo=2");
    expect(calledUrl).toContain("pageSize=5");
  });

  it("includes membershipStatuses in query when provided", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 1, PageSize: 10, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(1, 10, ["Active", "Expired"]);

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("membershipStatuses=Active");
    expect(calledUrl).toContain("membershipStatuses=Expired");
  });

  it("deduplicates and trims membershipStatuses", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 1, PageSize: 10, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(1, 10, ["Active", " Active ", "Active"]);

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    const statusOccurrences = (calledUrl.match(/membershipStatuses=/g) ?? []).length;
    expect(statusOccurrences).toBe(1);
  });

  it("includes searchTerm in query when provided", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 1, PageSize: 10, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(1, 10, null, null, "  john  ");

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("searchTerm=john");
  });

  it("omits searchTerm from query when blank", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 1, PageSize: 10, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(1, 10, null, null, "   ");

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).not.toContain("searchTerm");
  });

  it("includes sortBy and sortOrder when provided", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageNo: 1, PageSize: 10, PageCount: 0, TotalRecordsCount: 0, PageData: [] } });
    await fetchMembershipMembers(1, 10, null, null, null, "memberFullName", "asc");

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("sortBy=memberFullName");
    expect(calledUrl).toContain("sortOrder=asc");
  });

  it("falls back to pageNo/pageSize args when response values missing", async () => {
    mockGetJson.mockResolvedValue({ Data: { PageData: [] } });
    const result = await fetchMembershipMembers(3, 15);
    expect(result.pageNo).toBe(3);
    expect(result.pageSize).toBe(15);
    expect(result.pageCount).toBe(0);
    expect(result.totalRecordsCount).toBe(0);
  });
});

// ─── fetchMembershipStatusOptions ────────────────────────────────────────────

describe("fetchMembershipStatusOptions", () => {
  it("parses array response (PascalCase)", async () => {
    mockGetJson.mockResolvedValue({
      Data: [
        { Text: "Active", Value: "active" },
        { Text: "Expired", Value: "expired" },
      ],
    });

    const result = await fetchMembershipStatusOptions();
    expect(result).toHaveLength(2);
    expect(result[0]!).toEqual({ label: "Active", value: "active" });
    expect(result[1]!).toEqual({ label: "Expired", value: "expired" });
  });

  it("parses array response (camelCase)", async () => {
    mockGetJson.mockResolvedValue({
      data: [
        { text: "Pending", value: "pending" },
      ],
    });

    const result = await fetchMembershipStatusOptions();
    expect(result[0]!).toEqual({ label: "Pending", value: "pending" });
  });

  it("parses flat array response (no Data wrapper)", async () => {
    mockGetJson.mockResolvedValue([
      { Text: "Draft", Value: "draft" },
    ]);

    const result = await fetchMembershipStatusOptions();
    expect(result[0]!).toEqual({ label: "Draft", value: "draft" });
  });

  it("filters out items with empty label or value", async () => {
    mockGetJson.mockResolvedValue({
      Data: [
        { Text: "Valid", Value: "valid" },
        { Text: "", Value: "missing-label" },
        { Text: "Missing Value", Value: "" },
      ],
    });

    const result = await fetchMembershipStatusOptions();
    expect(result).toHaveLength(1);
    expect(result[0]!.label).toBe("Valid");
  });

  it("returns empty array when response is not iterable", async () => {
    mockGetJson.mockResolvedValue({ Data: null });
    const result = await fetchMembershipStatusOptions();
    expect(result).toEqual([]);
  });
});

// ─── fetchMembershipTypeOptions ──────────────────────────────────────────────

describe("fetchMembershipTypeOptions", () => {
  it("parses PascalCase options from Data", async () => {
    mockGetJson.mockResolvedValue({
      Data: [
        { Text: "Gold", Value: "gold-uid" },
        { Text: "Silver", Value: "silver-uid" },
      ],
    });

    const result = await fetchMembershipTypeOptions();
    expect(result).toHaveLength(2);
    expect(result[0]!).toEqual({ label: "Gold", value: "gold-uid" });
  });

  it("returns empty array when response empty", async () => {
    mockGetJson.mockResolvedValue({ Data: [] });
    const result = await fetchMembershipTypeOptions();
    expect(result).toEqual([]);
  });

  it("filters out items with empty label or value", async () => {
    mockGetJson.mockResolvedValue({
      Data: [
        { Text: "Good", Value: "good" },
        { Text: "", Value: "no-label" },
      ],
    });

    const result = await fetchMembershipTypeOptions();
    expect(result).toHaveLength(1);
  });
});

// â”€â”€â”€ fetchMembershipMemberDetail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe("fetchMembershipMemberDetail", () => {
  it("parses detail payload with custom responses", async () => {
    mockGetJson.mockResolvedValue({
      Data: {
        UniqueId: "uid-100",
        MemberFullName: "Amina Khan",
        ActiveMembershipName: "Platinum",
        MembershipStatus: "Active",
        Email: "amina@example.com",
        MembershipExpiryUtc: "2026-12-31",
        MembershipStartUtc: "2026-01-01",
        MembershipTypeUniqueId: "membership-type-1",
        MemberPhotoUrl: "https://example.com/photo.jpg",
        CellPhone: "+92 300 0000000",
        StreetLine1: "Street 1",
        CityName: "Lahore",
        CountryName: "Pakistan",
        CustomFormResponses: [
          {
            FormUniqueId: "form-1",
            FormName: "Organization details",
            FormHeaderText: "Organization details",
            FormDescription: "Business profile fields",
            FormLayoutColumn: 2,
            FieldUniqueId: "field-1",
            FieldLabel: "Department",
            FieldType: "Text",
            FieldDisplayOrder: 1,
            FieldLayoutColumn: 2,
            Value: "Engineering",
          },
        ],
        CustomQuestionResponses: [
          {
            QuestionUniqueId: "q-1",
            QuestionLabel: "Preferred contact",
            ControlType: "Radio",
            OptionLabel: "Email",
            Value: "Email",
          },
        ],
      },
    });

    const result = await fetchMembershipMemberDetail("uid-100");

    expect(result.uniqueId).toBe("uid-100");
    expect(result.contact.email).toBe("amina@example.com");
    expect(result.membership.membershipTypeUniqueId).toBe("membership-type-1");
    expect(result.membership.activeMembershipName).toBe("Platinum");
    expect(result.membership.membershipStatus).toBe("Active");
    expect(result.customFormResponses).toHaveLength(1);
    expect(result.customFormResponses[0]).toMatchObject({
      formName: "Organization details",
      formHeaderText: "Organization details",
      formDescription: "Business profile fields",
      formLayoutColumn: 2,
      fieldLabel: "Department",
      fieldDisplayOrder: 1,
      fieldLayoutColumn: 2,
      value: "Engineering",
    });
    expect(result.customQuestionResponses).toHaveLength(1);
    expect(result.customQuestionResponses[0]).toMatchObject({
      questionLabel: "Preferred contact",
      optionLabel: "Email",
    });
  });

  it("uses the member unique id in the request path", async () => {
    mockGetJson.mockResolvedValue({
      Data: {
        UniqueId: "uid-200",
        MemberFullName: "John Doe",
        ActiveMembershipName: "Gold",
        MembershipStatus: "Active",
        Email: "john@example.com",
      },
    });

    await fetchMembershipMemberDetail("uid-200");

    const calledUrl = mockGetJson.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("/api/organizer/membership/type/members/uid-200/detail");
  });
});
