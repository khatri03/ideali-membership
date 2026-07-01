import { describe, expect, it } from "vitest";
import { buildSamplePolls, getPollAudienceCopy, getPollStatusTone, POLL_TYPE_COPY } from "./pollDisplay";
import { buildPollListQuery } from "./pollsApi";

describe("poll display helpers", () => {
  it("keeps the supported question types categorized", () => {
    expect(POLL_TYPE_COPY.SingleChoice.status).toBe("Core");
    expect(Object.keys(POLL_TYPE_COPY)).toEqual([
      "SingleChoice",
      "MultipleChoice",
      "YesNo",
      "OpenText",
    ]);
  });

  it("returns the right audience copy", () => {
    expect(getPollAudienceCopy("Public")).toBe("Visible to everyone");
    expect(getPollAudienceCopy("MembersOnly")).toBe("Members only");
  });

  it("returns a stable status tone for each poll state", () => {
    expect(getPollStatusTone("Published")).toContain("emerald");
    expect(getPollStatusTone("Draft")).toContain("amber");
    expect(getPollStatusTone("Closed")).toContain("slate");
    expect(getPollStatusTone("Archived")).toContain("slate");
  });

  it("keeps the sample poll data aligned with the MVP story", () => {
    const samplePolls = buildSamplePolls();

    expect(samplePolls).toHaveLength(2);
    expect(samplePolls[0]?.audienceType).toBe("Public");
    expect(samplePolls[1]?.audienceType).toBe("MembersOnly");
    expect(samplePolls[1]?.requiredMembershipTypeUniqueIds).toEqual(["membership-premium"]);
  });
});

describe("poll list query", () => {
  it("serializes only the active poll filters", () => {
    expect(
      buildPollListQuery({
        pageNo: 1,
        pageSize: 8,
        searchText: " premium ",
        audienceType: "MembersOnly",
        status: "Published",
      }),
    ).toBe("pageNo=1&pageSize=8&searchText=premium&audienceType=MembersOnly&status=Published");
  });

  it("omits blank search text", () => {
    expect(
      buildPollListQuery({
        pageNo: 2,
        pageSize: 20,
        searchText: "   ",
        audienceType: null,
        status: null,
      }),
    ).toBe("pageNo=2&pageSize=20");
  });
});
