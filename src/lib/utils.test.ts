import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins string classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ active: true, hidden: false })).toBe("active");
    expect(cn({ active: false, hidden: false })).toBe("");
  });

  it("mixes strings and objects", () => {
    expect(cn("base", { active: true, disabled: false }, "extra")).toBe("base active extra");
  });

  it("returns empty string when all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles object with undefined value (treated as disabled)", () => {
    expect(cn({ visible: undefined })).toBe("");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles single string", () => {
    expect(cn("only")).toBe("only");
  });
});
