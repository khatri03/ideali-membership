import { describe, it, expect } from "vitest";
import {
  getRowBoundsForIndex,
  normalizeLayoutColumn,
  normalizeFieldLayoutColumn,
  getPreviewColumnSpan,
  getLayoutPresetLabel,
  normalizeFields,
  isTruthyValue,
  getCheckboxDefaultValue,
  parseDelimitedDefaultValues,
  getSelectedOptionValues,
  clearDefaultOption,
  getDefaultOptionValue,
  normalizeAcceptedFileTypes,
  toggleAcceptedFileType,
  toSentenceCase,
  createFieldDraft,
  getPreviewDefaultValue,
  buildPreviewValues,
} from "./customFormDesignerUtils";
import type { CustomFormControl, CustomFormFieldDraft, CustomFormOptionDraft } from "../types/customForms";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeControl(overrides: Partial<CustomFormControl> = {}): CustomFormControl {
  return {
    id: 1,
    name: "Text",
    controlType: "text",
    iconClass: "icon-text",
    defaultLabel: "Text Field",
    canBeRequired: true,
    hasOptions: false,
    canHavePlaceHolder: true,
    canHaveMinLength: true,
    canHaveMaxLength: true,
    acceptedFileTypes: [],
    ...overrides,
  };
}

function makeField(overrides: Partial<CustomFormFieldDraft> = {}): CustomFormFieldDraft {
  return {
    id: "f1",
    uniqueId: "u1",
    controlUniqueId: "cu1",
    controlId: 1,
    controlName: "Text",
    controlType: "text",
    iconClass: "icon-text",
    label: "Name",
    placeholder: "",
    tooltip: "",
    required: false,
    requiredMessage: "Name is required.",
    acceptedFileTypes: [],
    minLength: "",
    maxLength: "",
    defaultValue: "",
    displayOrder: 1,
    layoutColumn: null,
    options: [],
    ...overrides,
  };
}

function makeOption(overrides: Partial<CustomFormOptionDraft> = {}): CustomFormOptionDraft {
  return {
    id: "o1",
    displayText: "Option 1",
    value: "option-1",
    isDefault: false,
    ...overrides,
  };
}

// ─── normalizeLayoutColumn ────────────────────────────────────────────────────

describe("normalizeLayoutColumn", () => {
  it("clamps to 1 for values below range", () => {
    expect(normalizeLayoutColumn(0)).toBe(1);
    expect(normalizeLayoutColumn(-5)).toBe(1);
  });

  it("clamps to 4 for values above range", () => {
    expect(normalizeLayoutColumn(5)).toBe(4);
    expect(normalizeLayoutColumn(100)).toBe(4);
  });

  it("accepts valid values 1–4", () => {
    expect(normalizeLayoutColumn(1)).toBe(1);
    expect(normalizeLayoutColumn(2)).toBe(2);
    expect(normalizeLayoutColumn(3)).toBe(3);
    expect(normalizeLayoutColumn(4)).toBe(4);
  });

  it("truncates decimals", () => {
    expect(normalizeLayoutColumn(2.9)).toBe(2);
    expect(normalizeLayoutColumn(3.1)).toBe(3);
  });

  it("returns 1 for null, undefined, NaN, Infinity", () => {
    expect(normalizeLayoutColumn(null)).toBe(1);
    expect(normalizeLayoutColumn(undefined)).toBe(1);
    expect(normalizeLayoutColumn(NaN)).toBe(1);
    expect(normalizeLayoutColumn(Infinity)).toBe(1);
  });
});

// ─── normalizeFieldLayoutColumn ───────────────────────────────────────────────

describe("normalizeFieldLayoutColumn", () => {
  it("returns null for null, undefined, NaN, Infinity", () => {
    expect(normalizeFieldLayoutColumn(null)).toBeNull();
    expect(normalizeFieldLayoutColumn(undefined)).toBeNull();
    expect(normalizeFieldLayoutColumn(NaN)).toBeNull();
    expect(normalizeFieldLayoutColumn(Infinity)).toBeNull();
  });

  it("clamps to 1 for values below range", () => {
    expect(normalizeFieldLayoutColumn(0)).toBe(1);
    expect(normalizeFieldLayoutColumn(-1)).toBe(1);
  });

  it("clamps to 4 for values above range", () => {
    expect(normalizeFieldLayoutColumn(5)).toBe(4);
  });

  it("accepts valid values 1–4", () => {
    expect(normalizeFieldLayoutColumn(1)).toBe(1);
    expect(normalizeFieldLayoutColumn(2)).toBe(2);
    expect(normalizeFieldLayoutColumn(3)).toBe(3);
    expect(normalizeFieldLayoutColumn(4)).toBe(4);
  });

  it("truncates decimals", () => {
    expect(normalizeFieldLayoutColumn(1.9)).toBe(1);
    expect(normalizeFieldLayoutColumn(3.7)).toBe(3);
  });
});

// ─── getPreviewColumnSpan ─────────────────────────────────────────────────────

describe("getPreviewColumnSpan", () => {
  describe("field has no layout override (layoutColumn = null) — uses form fallback", () => {
    it("1x1 form → span 12 (full width)", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 1)).toBe(12);
    });

    it("1x2 form → span 6 (half width)", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 2)).toBe(6);
    });

    it("1x3 form → span 4 (one third)", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 3)).toBe(4);
    });

    it("1x4 form → span 3 (one quarter)", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 4)).toBe(3);
    });
  });

  describe("field has explicit layout override — ignores form fallback", () => {
    it("field 1x1 in 1x4 form → span 12", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 1 }), 4)).toBe(12);
    });

    it("field 1x2 in 1x1 form → span 6", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 2 }), 1)).toBe(6);
    });

    it("field 1x3 in 1x2 form → span 4", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 3 }), 2)).toBe(4);
    });

    it("field 1x4 in 1x3 form → span 3", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 4 }), 3)).toBe(3);
    });
  });

  describe("mixed layout rows — total spans per row", () => {
    it("two 1x2 fields fill one row (6+6=12)", () => {
      const f1 = makeField({ layoutColumn: 2 });
      const f2 = makeField({ layoutColumn: 2 });
      expect(getPreviewColumnSpan(f1, 2) + getPreviewColumnSpan(f2, 2)).toBe(12);
    });

    it("three 1x3 fields fill one row (4+4+4=12)", () => {
      const span = getPreviewColumnSpan(makeField({ layoutColumn: 3 }), 3);
      expect(span * 3).toBe(12);
    });

    it("four 1x4 fields fill one row (3+3+3+3=12)", () => {
      const span = getPreviewColumnSpan(makeField({ layoutColumn: 4 }), 4);
      expect(span * 4).toBe(12);
    });

    it("1x2 + 1x4 + 1x4 fills one row (6+3+3=12)", () => {
      const a = getPreviewColumnSpan(makeField({ layoutColumn: 2 }), 2);
      const b = getPreviewColumnSpan(makeField({ layoutColumn: 4 }), 2);
      const c = getPreviewColumnSpan(makeField({ layoutColumn: 4 }), 2);
      expect(a + b + c).toBe(12);
    });

    it("1x1 always fills full row regardless of form layout", () => {
      [1, 2, 3, 4].forEach((fallback) => {
        expect(getPreviewColumnSpan(makeField({ layoutColumn: 1 }), fallback)).toBe(12);
      });
    });
  });

  describe("edge cases", () => {
    it("out-of-range field layoutColumn: below 1 clamps to 1 → span 12, above 4 clamps to 4 → span 3", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 0 as never }), 2)).toBe(12);
      expect(getPreviewColumnSpan(makeField({ layoutColumn: 5 as never }), 2)).toBe(3);
    });

    it("out-of-range fallback: below 1 clamps to 1 → span 12, above 4 clamps to 4 → span 3", () => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 0)).toBe(12);
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), 99)).toBe(3);
    });
  });
});

// ─── getLayoutPresetLabel ─────────────────────────────────────────────────────

describe("getLayoutPresetLabel", () => {
  it("returns 1x1 through 1x4", () => {
    expect(getLayoutPresetLabel(1)).toBe("1x1");
    expect(getLayoutPresetLabel(2)).toBe("1x2");
    expect(getLayoutPresetLabel(3)).toBe("1x3");
    expect(getLayoutPresetLabel(4)).toBe("1x4");
  });
});

// ─── normalizeFields ──────────────────────────────────────────────────────────

describe("normalizeFields", () => {
  it("renumbers displayOrder from 1", () => {
    const fields = [
      makeField({ id: "a", displayOrder: 99 }),
      makeField({ id: "b", displayOrder: 50 }),
      makeField({ id: "c", displayOrder: 7 }),
    ];
    const result = normalizeFields(fields);
    expect(result.map((f) => f.displayOrder)).toEqual([1, 2, 3]);
  });

  it("preserves field identity and all other properties", () => {
    const field = makeField({ id: "x", label: "My Label", layoutColumn: 3 });
    const [result] = normalizeFields([field]);
    expect(result?.id).toBe("x");
    expect(result?.label).toBe("My Label");
    expect(result?.layoutColumn).toBe(3);
  });

  it("handles empty array", () => {
    expect(normalizeFields([])).toEqual([]);
  });

  it("single field gets displayOrder 1", () => {
    expect(normalizeFields([makeField({ displayOrder: 5 })])[0]?.displayOrder).toBe(1);
  });
});

// ─── isTruthyValue ────────────────────────────────────────────────────────────

describe("isTruthyValue", () => {
  it.each(["true", "True", "TRUE", "1", "yes", "Yes", "on", "ON"])('"%s" is truthy', (v) => {
    expect(isTruthyValue(v)).toBe(true);
  });

  it.each(["false", "0", "no", "off", "", "  ", "random"])('"%s" is falsy', (v) => {
    expect(isTruthyValue(v)).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isTruthyValue("  true  ")).toBe(true);
    expect(isTruthyValue("  yes  ")).toBe(true);
  });
});

// ─── getCheckboxDefaultValue ──────────────────────────────────────────────────

describe("getCheckboxDefaultValue", () => {
  it('truthy values return "true"', () => {
    expect(getCheckboxDefaultValue("true")).toBe("true");
    expect(getCheckboxDefaultValue("1")).toBe("true");
    expect(getCheckboxDefaultValue("yes")).toBe("true");
  });

  it('falsy values return "false"', () => {
    expect(getCheckboxDefaultValue("false")).toBe("false");
    expect(getCheckboxDefaultValue("0")).toBe("false");
    expect(getCheckboxDefaultValue("")).toBe("false");
    expect(getCheckboxDefaultValue(null)).toBe("false");
    expect(getCheckboxDefaultValue(undefined)).toBe("false");
  });
});

// ─── parseDelimitedDefaultValues ─────────────────────────────────────────────

describe("parseDelimitedDefaultValues", () => {
  it("splits comma-separated values and trims", () => {
    expect(parseDelimitedDefaultValues("a, b, c")).toEqual(["a", "b", "c"]);
  });

  it("deduplicates", () => {
    expect(parseDelimitedDefaultValues("a, a, b")).toEqual(["a", "b"]);
  });

  it("filters empty segments", () => {
    expect(parseDelimitedDefaultValues("a,,b")).toEqual(["a", "b"]);
    expect(parseDelimitedDefaultValues(", ,")).toEqual([]);
  });

  it("returns empty array for null/undefined/empty", () => {
    expect(parseDelimitedDefaultValues(null)).toEqual([]);
    expect(parseDelimitedDefaultValues(undefined)).toEqual([]);
    expect(parseDelimitedDefaultValues("")).toEqual([]);
  });
});

// ─── getSelectedOptionValues ──────────────────────────────────────────────────

describe("getSelectedOptionValues", () => {
  it("returns values of options flagged isDefault", () => {
    const field = makeField({
      options: [
        makeOption({ id: "o1", value: "a", isDefault: true }),
        makeOption({ id: "o2", value: "b", isDefault: false }),
        makeOption({ id: "o3", value: "c", isDefault: true }),
      ],
      defaultValue: "b",
    });
    expect(getSelectedOptionValues(field)).toEqual(["a", "c"]);
  });

  it("falls back to parseDelimitedDefaultValues when no flags set", () => {
    const field = makeField({
      options: [
        makeOption({ id: "o1", value: "x", isDefault: false }),
      ],
      defaultValue: "x, y",
    });
    expect(getSelectedOptionValues(field)).toEqual(["x", "y"]);
  });

  it("returns empty array when no flags and empty defaultValue", () => {
    const field = makeField({ options: [], defaultValue: "" });
    expect(getSelectedOptionValues(field)).toEqual([]);
  });
});

// ─── clearDefaultOption ───────────────────────────────────────────────────────

describe("clearDefaultOption", () => {
  it("sets isDefault true only for specified option", () => {
    const options = [
      makeOption({ id: "o1", isDefault: true }),
      makeOption({ id: "o2", isDefault: false }),
      makeOption({ id: "o3", isDefault: true }),
    ];
    const result = clearDefaultOption(options, "o2");
    expect(result.find((o) => o.id === "o1")?.isDefault).toBe(false);
    expect(result.find((o) => o.id === "o2")?.isDefault).toBe(true);
    expect(result.find((o) => o.id === "o3")?.isDefault).toBe(false);
  });

  it("clears all when target id not found", () => {
    const options = [makeOption({ id: "o1", isDefault: true })];
    const result = clearDefaultOption(options, "nonexistent");
    expect(result.every((o) => !o.isDefault)).toBe(true);
  });
});

// ─── getDefaultOptionValue ────────────────────────────────────────────────────

describe("getDefaultOptionValue", () => {
  it("prefers isDefault flag", () => {
    const field = makeField({
      options: [
        makeOption({ id: "o1", value: "a", isDefault: false }),
        makeOption({ id: "o2", value: "b", isDefault: true }),
      ],
      defaultValue: "a",
    });
    expect(getDefaultOptionValue(field)).toBe("b");
  });

  it("falls back to option matching defaultValue", () => {
    const field = makeField({
      options: [
        makeOption({ id: "o1", value: "a", isDefault: false }),
        makeOption({ id: "o2", value: "b", isDefault: false }),
      ],
      defaultValue: "b",
    });
    expect(getDefaultOptionValue(field)).toBe("b");
  });

  it("falls back to first option when no match", () => {
    const field = makeField({
      options: [makeOption({ id: "o1", value: "first", isDefault: false })],
      defaultValue: "",
    });
    expect(getDefaultOptionValue(field)).toBe("first");
  });

  it("returns empty string when no options", () => {
    expect(getDefaultOptionValue(makeField({ options: [], defaultValue: "" }))).toBe("");
  });
});

// ─── toggleAcceptedFileType ───────────────────────────────────────────────────

describe("toggleAcceptedFileType", () => {
  it("adds file type when checked", () => {
    expect(toggleAcceptedFileType([".pdf"], ".jpg", true)).toEqual([".pdf", ".jpg"]);
  });

  it("removes file type when unchecked", () => {
    expect(toggleAcceptedFileType([".pdf", ".jpg"], ".jpg", false)).toEqual([".pdf"]);
  });

  it("does not duplicate on repeated add", () => {
    expect(toggleAcceptedFileType([".pdf"], ".pdf", true)).toEqual([".pdf"]);
  });

  it("handles removing non-existent type safely", () => {
    expect(toggleAcceptedFileType([".pdf"], ".jpg", false)).toEqual([".pdf"]);
  });
});

// ─── normalizeAcceptedFileTypes ───────────────────────────────────────────────

describe("normalizeAcceptedFileTypes", () => {
  it("returns array as-is", () => {
    expect(normalizeAcceptedFileTypes([".pdf", ".jpg"])).toEqual([".pdf", ".jpg"]);
  });

  it("returns [] for null, undefined, non-array", () => {
    expect(normalizeAcceptedFileTypes(null)).toEqual([]);
    expect(normalizeAcceptedFileTypes(undefined)).toEqual([]);
    expect(normalizeAcceptedFileTypes("string" as never)).toEqual([]);
  });
});

// ─── toSentenceCase ───────────────────────────────────────────────────────────

describe("toSentenceCase", () => {
  it("capitalizes first letter", () => {
    expect(toSentenceCase("hello world")).toBe("Hello world");
  });

  it("lowercases rest", () => {
    expect(toSentenceCase("FULL NAME")).toBe("Full name");
  });

  it("returns 'Field' for empty/null/undefined", () => {
    expect(toSentenceCase("")).toBe("Field");
    expect(toSentenceCase(null)).toBe("Field");
    expect(toSentenceCase(undefined)).toBe("Field");
    expect(toSentenceCase("   ")).toBe("Field");
  });
});

// ─── createFieldDraft ─────────────────────────────────────────────────────────

describe("createFieldDraft", () => {
  it("uses defaultLabel when present", () => {
    const ctrl = makeControl({ defaultLabel: "Email Address", name: "Email" });
    const field = createFieldDraft(ctrl, 1);
    expect(field.label).toBe("Email Address");
  });

  it("falls back to name when no defaultLabel", () => {
    const ctrl = makeControl({ defaultLabel: "", name: "Custom Field" });
    const field = createFieldDraft(ctrl, 1);
    expect(field.label).toBe("Custom Field");
  });

  it("checkbox default value is 'false'", () => {
    const ctrl = makeControl({ controlType: "checkbox", hasOptions: false });
    expect(createFieldDraft(ctrl, 1).defaultValue).toBe("false");
  });

  it("select/radio default value is 'option-1'", () => {
    const ctrl = makeControl({ controlType: "select", hasOptions: true });
    const field = createFieldDraft(ctrl, 1);
    expect(field.defaultValue).toBe("option-1");
    expect(field.options).toHaveLength(1);
    expect(field.options[0]?.isDefault).toBe(true);
  });

  it("non-option control has no options", () => {
    const ctrl = makeControl({ controlType: "text", hasOptions: false });
    expect(createFieldDraft(ctrl, 1).options).toHaveLength(0);
  });

  it("layoutColumn is null (inherits form default)", () => {
    expect(createFieldDraft(makeControl(), 1).layoutColumn).toBeNull();
  });

  it("displayOrder set correctly", () => {
    expect(createFieldDraft(makeControl(), 5).displayOrder).toBe(5);
  });

  it("requiredMessage uses sentence-cased label", () => {
    const ctrl = makeControl({ defaultLabel: "phone number" });
    expect(createFieldDraft(ctrl, 1).requiredMessage).toBe("Phone number is required.");
  });

  it("generates unique ids per call", () => {
    const a = createFieldDraft(makeControl(), 1);
    const b = createFieldDraft(makeControl(), 1);
    expect(a.id).not.toBe(b.id);
    expect(a.uniqueId).not.toBe(b.uniqueId);
  });
});

// ─── getPreviewDefaultValue ───────────────────────────────────────────────────

describe("getPreviewDefaultValue", () => {
  it("checkbox → boolean true when defaultValue truthy", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "checkbox", defaultValue: "true" }))).toBe(true);
    expect(getPreviewDefaultValue(makeField({ controlType: "checkbox", defaultValue: "1" }))).toBe(true);
  });

  it("checkbox → boolean false when defaultValue falsy", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "checkbox", defaultValue: "false" }))).toBe(false);
    expect(getPreviewDefaultValue(makeField({ controlType: "checkbox", defaultValue: "" }))).toBe(false);
  });

  it("multiselect → array of selected option values", () => {
    const field = makeField({
      controlType: "multiselect",
      options: [
        makeOption({ value: "a", isDefault: true }),
        makeOption({ value: "b", isDefault: false }),
      ],
    });
    expect(getPreviewDefaultValue(field)).toEqual(["a"]);
  });

  it("select → default option value", () => {
    const field = makeField({
      controlType: "select",
      options: [makeOption({ value: "x", isDefault: true })],
      defaultValue: "",
    });
    expect(getPreviewDefaultValue(field)).toBe("x");
  });

  it("country/state → defaultValue string", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "country", defaultValue: "US" }))).toBe("US");
    expect(getPreviewDefaultValue(makeField({ controlType: "state", defaultValue: "CA" }))).toBe("CA");
  });

  it("file → null", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "file" }))).toBeNull();
  });

  it("text/email/etc → defaultValue string", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "text", defaultValue: "hello" }))).toBe("hello");
    expect(getPreviewDefaultValue(makeField({ controlType: "email", defaultValue: "" }))).toBe("");
  });

  it("unknown controlType → defaultValue", () => {
    expect(getPreviewDefaultValue(makeField({ controlType: "custom-future-type", defaultValue: "x" }))).toBe("x");
  });
});

// ─── buildPreviewValues ───────────────────────────────────────────────────────

describe("buildPreviewValues", () => {
  it("builds map keyed by field id", () => {
    const fields = [
      makeField({ id: "f1", controlType: "text", defaultValue: "hello" }),
      makeField({ id: "f2", controlType: "checkbox", defaultValue: "true" }),
    ];
    const result = buildPreviewValues(fields);
    expect(result["f1"]).toBe("hello");
    expect(result["f2"]).toBe(true);
  });

  it("returns empty object for empty fields array", () => {
    expect(buildPreviewValues([])).toEqual({});
  });
});

// ─── getRowBoundsForIndex ─────────────────────────────────────────────────────

describe("getRowBoundsForIndex", () => {
  // Helper: build fields array with specific layoutColumns
  function makeRow(...layoutColumns: (number | null)[]): CustomFormFieldDraft[] {
    return layoutColumns.map((lc, i) => makeField({ id: `f${i}`, layoutColumn: lc }));
  }

  it("single row — all same width — every index returns {start:0, end:last}", () => {
    // 3x 1x3 fields (span4 each = 12 total, one row)
    const fields = makeRow(3, 3, 3);
    expect(getRowBoundsForIndex(fields, 0, 3)).toEqual({ start: 0, end: 2 });
    expect(getRowBoundsForIndex(fields, 1, 3)).toEqual({ start: 0, end: 2 });
    expect(getRowBoundsForIndex(fields, 2, 3)).toEqual({ start: 0, end: 2 });
  });

  it("1x1 above 3x 1x3 — dragging 1x1 down: target in row 2 → end=2", () => {
    // [A(1x1), B(1x3), C(1x3), D(1x3)]
    // A span=12, B/C/D span=4
    const fields = makeRow(1, 3, 3, 3);
    // Row 1: index 0 (span12). Row 2: indices 1,2,3 (span 4+4+4=12).
    expect(getRowBoundsForIndex(fields, 1, 3)).toEqual({ start: 1, end: 3 });
    expect(getRowBoundsForIndex(fields, 2, 3)).toEqual({ start: 1, end: 3 });
    expect(getRowBoundsForIndex(fields, 3, 3)).toEqual({ start: 1, end: 3 });
  });

  it("3x 1x3 above 1x1 — dragging 1x1 up: target in row 1 → start=0", () => {
    // [B(1x3), C(1x3), D(1x3), A(1x1)]
    const fields = makeRow(3, 3, 3, 1);
    // Row 1: 0,1,2. Row 2: 3.
    expect(getRowBoundsForIndex(fields, 0, 3)).toEqual({ start: 0, end: 2 });
    expect(getRowBoundsForIndex(fields, 1, 3)).toEqual({ start: 0, end: 2 });
    expect(getRowBoundsForIndex(fields, 2, 3)).toEqual({ start: 0, end: 2 });
    expect(getRowBoundsForIndex(fields, 3, 3)).toEqual({ start: 3, end: 3 });
  });

  it("two full rows of 1x2 fields", () => {
    // [A,B,C,D] each span6 — row1: 0,1  row2: 2,3
    const fields = makeRow(2, 2, 2, 2);
    expect(getRowBoundsForIndex(fields, 0, 2)).toEqual({ start: 0, end: 1 });
    expect(getRowBoundsForIndex(fields, 1, 2)).toEqual({ start: 0, end: 1 });
    expect(getRowBoundsForIndex(fields, 2, 2)).toEqual({ start: 2, end: 3 });
    expect(getRowBoundsForIndex(fields, 3, 2)).toEqual({ start: 2, end: 3 });
  });

  it("four 1x4 fields per row — two rows", () => {
    // span3 × 4 = 12 per row
    const fields = makeRow(4, 4, 4, 4, 4, 4, 4, 4);
    expect(getRowBoundsForIndex(fields, 0, 4)).toEqual({ start: 0, end: 3 });
    expect(getRowBoundsForIndex(fields, 3, 4)).toEqual({ start: 0, end: 3 });
    expect(getRowBoundsForIndex(fields, 4, 4)).toEqual({ start: 4, end: 7 });
    expect(getRowBoundsForIndex(fields, 7, 4)).toEqual({ start: 4, end: 7 });
  });

  it("field with no layout override uses form fallback", () => {
    // null layout, form=2 → span6. Two fields fill row.
    const fields = makeRow(null, null, null, null);
    expect(getRowBoundsForIndex(fields, 0, 2)).toEqual({ start: 0, end: 1 });
    expect(getRowBoundsForIndex(fields, 1, 2)).toEqual({ start: 0, end: 1 });
    expect(getRowBoundsForIndex(fields, 2, 2)).toEqual({ start: 2, end: 3 });
  });

  it("mixed: 1x1 then partial 1x2 row then 1x1", () => {
    // [A(1x1), B(1x2), C(1x2), D(1x1)]
    const fields = makeRow(1, 2, 2, 1);
    // A → row {0,0}. B,C → row {1,2}. D → row {3,3}.
    expect(getRowBoundsForIndex(fields, 0, 2)).toEqual({ start: 0, end: 0 });
    expect(getRowBoundsForIndex(fields, 1, 2)).toEqual({ start: 1, end: 2 });
    expect(getRowBoundsForIndex(fields, 2, 2)).toEqual({ start: 1, end: 2 });
    expect(getRowBoundsForIndex(fields, 3, 2)).toEqual({ start: 3, end: 3 });
  });

  it("single field → {start:0, end:0}", () => {
    expect(getRowBoundsForIndex([makeField({ layoutColumn: 1 })], 0, 1)).toEqual({ start: 0, end: 0 });
  });
});

// ─── Layout scenario matrix ───────────────────────────────────────────────────

describe("layout scenario matrix — form-level vs field-level", () => {
  const layouts = [1, 2, 3, 4] as const;
  const expectedSpans: Record<number, number> = { 1: 12, 2: 6, 3: 4, 4: 3 };

  it("all 4 form-level layouts produce correct spans with no field override", () => {
    layouts.forEach((layout) => {
      expect(getPreviewColumnSpan(makeField({ layoutColumn: null }), layout)).toBe(expectedSpans[layout]);
    });
  });

  it("field override always wins over form layout (all 4x4 combos)", () => {
    layouts.forEach((fieldLayout) => {
      layouts.forEach((formLayout) => {
        const span = getPreviewColumnSpan(makeField({ layoutColumn: fieldLayout }), formLayout);
        expect(span).toBe(expectedSpans[fieldLayout]);
      });
    });
  });
});
