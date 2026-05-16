import { describe, it, expect } from "vitest";
import { readResponseData, readText, readNumber, readBoolean, getPositiveNumber } from "./parseUtils";

describe("readResponseData", () => {
  it("returns payload as-is when not an object", () => {
    expect(readResponseData("hello")).toBe("hello");
    expect(readResponseData(42)).toBe(42);
    expect(readResponseData(null)).toBe(null);
    expect(readResponseData(undefined)).toBe(undefined);
  });

  it("extracts Data (PascalCase) over raw payload", () => {
    expect(readResponseData({ Data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it("extracts data (camelCase) when Data is absent", () => {
    expect(readResponseData({ data: "result" })).toBe("result");
  });

  it("prefers Data over data when both present", () => {
    expect(readResponseData({ Data: "pascal", data: "camel" })).toBe("pascal");
  });

  it("returns payload object when neither Data nor data present", () => {
    const payload = { foo: "bar" };
    expect(readResponseData(payload)).toBe(payload);
  });

  it("returns array payload as-is", () => {
    const arr = [1, 2];
    expect(readResponseData(arr)).toBe(arr);
  });
});

describe("readText", () => {
  it("returns the string value unchanged", () => {
    expect(readText("hello")).toBe("hello");
    expect(readText("")).toBe("");
  });

  it("returns empty string for non-string values", () => {
    expect(readText(null)).toBe("");
    expect(readText(undefined)).toBe("");
    expect(readText(42)).toBe("");
    expect(readText(true)).toBe("");
    expect(readText({})).toBe("");
    expect(readText([])).toBe("");
  });
});

describe("readNumber", () => {
  it("returns finite number values", () => {
    expect(readNumber(0)).toBe(0);
    expect(readNumber(42)).toBe(42);
    expect(readNumber(-7)).toBe(-7);
    expect(readNumber(3.14)).toBeCloseTo(3.14);
  });

  it("returns null for non-finite numbers", () => {
    expect(readNumber(Infinity)).toBe(null);
    expect(readNumber(-Infinity)).toBe(null);
    expect(readNumber(NaN)).toBe(null);
  });

  it("returns null for non-number values", () => {
    expect(readNumber("42")).toBe(null);
    expect(readNumber(null)).toBe(null);
    expect(readNumber(undefined)).toBe(null);
    expect(readNumber(true)).toBe(null);
    expect(readNumber({})).toBe(null);
  });
});

describe("getPositiveNumber", () => {
  it("parses valid positive integer string", () => {
    expect(getPositiveNumber("5", 1)).toBe(5);
    expect(getPositiveNumber("100", 1)).toBe(100);
  });

  it("parses valid positive float string", () => {
    expect(getPositiveNumber("3.14", 1)).toBeCloseTo(3.14);
  });

  it("returns fallback for zero", () => {
    expect(getPositiveNumber("0", 1)).toBe(1);
  });

  it("returns fallback for negative values", () => {
    expect(getPositiveNumber("-5", 1)).toBe(1);
  });

  it("returns fallback for non-numeric strings", () => {
    expect(getPositiveNumber("abc", 1)).toBe(1);
    expect(getPositiveNumber("", 1)).toBe(1);
  });

  it("returns fallback for null", () => {
    expect(getPositiveNumber(null, 25)).toBe(25);
  });

  it("returns fallback for undefined", () => {
    expect(getPositiveNumber(undefined, 10)).toBe(10);
  });

  it("returns fallback for Infinity string", () => {
    expect(getPositiveNumber("Infinity", 1)).toBe(1);
  });
});

describe("readBoolean", () => {
  it("returns true for boolean true", () => {
    expect(readBoolean(true)).toBe(true);
  });

  it("returns false for boolean false", () => {
    expect(readBoolean(false)).toBe(false);
  });

  it("returns false for non-boolean values", () => {
    expect(readBoolean(null)).toBe(false);
    expect(readBoolean(undefined)).toBe(false);
    expect(readBoolean("true")).toBe(false);
    expect(readBoolean(1)).toBe(false);
    expect(readBoolean(0)).toBe(false);
    expect(readBoolean({})).toBe(false);
  });
});
