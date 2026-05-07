import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CustomFormControl, CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";
import {
  clearDefaultOption,
  createFieldDraft,
  createOptionId,
  getPreviewColumnSpan,
  getLayoutPresetLabel,
  normalizeFields,
  normalizeLayoutColumn,
} from "./index";

export function useCustomFormCreatePageEditor({
  controls,
  draft,
  fields,
  selectedFieldId,
  selectedOptionId,
  fieldLayoutMenu,
  fieldToRemoveId,
  optionToRemoveId,
  controlSearch,
  showCreateValidation,
  previewColumnCount,
  setDraft,
  setFields,
  setFieldLayoutMenu,
  setFieldToRemoveId,
  setOptionToRemoveId,
  setSelectedFieldId,
  setSelectedOptionId,
  setIsClearConfirmOpen,
  setIsPreviewOpen,
}: {
  controls: CustomFormControl[];
  draft: CustomFormDraft;
  fields: CustomFormFieldDraft[];
  selectedFieldId: string | null;
  selectedOptionId: string | null;
  fieldLayoutMenu: { fieldId: string; x: number; y: number } | null;
  fieldToRemoveId: string | null;
  optionToRemoveId: string | null;
  controlSearch: string;
  showCreateValidation: boolean;
  previewColumnCount: number;
  setDraft: Dispatch<SetStateAction<CustomFormDraft>>;
  setFields: Dispatch<SetStateAction<CustomFormFieldDraft[]>>;
  setFieldLayoutMenu: Dispatch<SetStateAction<{ fieldId: string; x: number; y: number } | null>>;
  setFieldToRemoveId: Dispatch<SetStateAction<string | null>>;
  setOptionToRemoveId: Dispatch<SetStateAction<string | null>>;
  setSelectedFieldId: Dispatch<SetStateAction<string | null>>;
  setSelectedOptionId: Dispatch<SetStateAction<string | null>>;
  setIsClearConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );

  const selectedControl = useMemo(
    () => controls.find((control) => control.id === selectedField?.controlId) ?? null,
    [controls, selectedField?.controlId],
  );

  const fieldToRemove = useMemo(
    () => fields.find((field) => field.id === fieldToRemoveId) ?? null,
    [fieldToRemoveId, fields],
  );

  const optionToRemove = useMemo(() => {
    if (!selectedField || !optionToRemoveId) {
      return null;
    }

    return selectedField.options.find((option) => option.id === optionToRemoveId) ?? null;
  }, [optionToRemoveId, selectedField]);

  const selectedOption = useMemo(() => {
    if (!selectedField || !selectedOptionId) {
      return (
        selectedField?.options.find((option) => option.isDefault) ??
        selectedField?.options.find((option) => option.value === selectedField.defaultValue) ??
        selectedField?.options[0] ??
        null
      );
    }

    return (
      selectedField.options.find((option) => option.id === selectedOptionId) ??
      selectedField.options.find((option) => option.isDefault) ??
      selectedField.options[0] ??
      null
    );
  }, [selectedField, selectedOptionId]);

  const createFormIssues = useMemo(() => {
    const issues: string[] = [];

    if (!draft.name.trim()) {
      issues.push("Name");
    }

    if (!draft.headerText.trim()) {
      issues.push("Header Text");
    }

    return issues;
  }, [draft.headerText, draft.name]);

  const canCreateForm = createFormIssues.length === 0;
  const nameError = showCreateValidation && !draft.name.trim() ? "Name is required." : "";
  const headerTextError =
    showCreateValidation && !draft.headerText.trim() ? "Header Text is required." : "";
  const layoutColumnError =
    showCreateValidation && (!Number.isInteger(draft.layoutColumn) || draft.layoutColumn < 1)
      ? "Layout Columns is required."
      : "";
  const canvasFieldError = showCreateValidation && fields.length === 0
    ? "Add at least one field to the canvas."
    : "";

  const previewFieldCount = fields.length;
  const fieldLayoutMenuStyle = useMemo(() => {
    if (!fieldLayoutMenu || typeof window === "undefined") {
      return null;
    }

    const estimatedWidth = 172;
    const estimatedHeight = 228;

    return {
      left: Math.max(16, Math.min(fieldLayoutMenu.x, window.innerWidth - estimatedWidth - 16)),
      top: Math.max(16, Math.min(fieldLayoutMenu.y, window.innerHeight - estimatedHeight - 16)),
    };
  }, [fieldLayoutMenu]);

  const controlUsageCounts = useMemo(() => {
    const counts = new Map<number, number>();

    for (const field of fields) {
      counts.set(field.controlId, (counts.get(field.controlId) ?? 0) + 1);
    }

    return counts;
  }, [fields]);

  const fieldIdSet = useMemo(() => new Set(fields.map((field) => field.id)), [fields]);

  const filteredControls = useMemo(() => {
    const query = controlSearch.trim().toLowerCase();

    if (!query) {
      return controls;
    }

    return controls.filter((control) => {
      const haystack = [control.name, control.defaultLabel, control.controlType, control.iconClass]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [controlSearch, controls]);

  function updateSelectedField(updater: (field: CustomFormFieldDraft) => CustomFormFieldDraft) {
    if (!selectedFieldId) {
      return;
    }

    setFields((current) => current.map((field) => (field.id === selectedFieldId ? updater(field) : field)));
  }

  function setFieldLayoutPreset(fieldId: string, layoutColumn: number) {
    setFields((current) =>
      normalizeFields(
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                layoutColumn,
              }
            : field,
        ),
      ),
    );
    setSelectedFieldId(fieldId);
    setFieldLayoutMenu(null);
  }

  function clearFieldLayoutPreset(fieldId: string) {
    setFields((current) =>
      normalizeFields(
        current.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                layoutColumn: null,
              }
            : field,
        ),
      ),
    );
    setSelectedFieldId(fieldId);
    setFieldLayoutMenu((current) => (current?.fieldId === fieldId ? null : current));
  }

  function deleteField(fieldId: string) {
    setFields((current) => normalizeFields(current.filter((field) => field.id !== fieldId)));
    setFieldLayoutMenu((current) => (current?.fieldId === fieldId ? null : current));

    setSelectedFieldId((current) => {
      if (current !== fieldId) {
        return current;
      }

      return fields.find((field) => field.id !== fieldId)?.id ?? null;
    });
  }

  function removeField(fieldId: string) {
    setFieldToRemoveId(fieldId);
    setFieldLayoutMenu(null);
  }

  function confirmRemoveField() {
    if (!fieldToRemoveId) {
      return;
    }

    deleteField(fieldToRemoveId);
    setFieldToRemoveId(null);
    setOptionToRemoveId(null);
    setSelectedOptionId(null);
  }

  function cancelRemoveField() {
    setFieldToRemoveId(null);
  }

  function addFieldFromControl(control: CustomFormControl, index?: number) {
    const nextField = createFieldDraft(control, fields.length + 1);
    setFields((current) => {
      const next = [...current];
      const insertAt = typeof index === "number" && index >= 0 ? index : next.length;
      next.splice(insertAt, 0, nextField);
      return normalizeFields(next);
    });
    setSelectedFieldId(nextField.id);
  }

  function appendFieldToCanvas(control: CustomFormControl) {
    addFieldFromControl(control, fields.length);
  }

  function clearAllCanvasFields() {
    setFields([]);
    setSelectedFieldId(null);
    setFieldLayoutMenu(null);
    setIsClearConfirmOpen(false);
    setFieldToRemoveId(null);
    setOptionToRemoveId(null);
    setIsPreviewOpen(false);
  }

  function addOption() {
    updateSelectedField((field) => ({
      ...field,
      options: [
        ...field.options,
        {
          id: createOptionId(),
          displayText: `Option ${field.options.length + 1}`,
          value: `option-${field.options.length + 1}`,
          isDefault: field.options.length === 0,
        },
      ],
    }));
  }

  function updateOption(optionId: string, key: "displayText" | "value", value: string) {
    updateSelectedField((field) => ({
      ...field,
      options: field.options.map((option) => (option.id === optionId ? { ...option, [key]: value } : option)),
    }));
  }

  function setDefaultOption(optionId: string) {
    updateSelectedField((field) => {
      if (field.controlType.toLowerCase() === "multiselect") {
        const nextOptions = field.options.map((option) =>
          option.id === optionId ? { ...option, isDefault: !option.isDefault } : option,
        );
        const nextDefaultValues = nextOptions.filter((option) => option.isDefault).map((option) => option.value);

        return {
          ...field,
          defaultValue: nextDefaultValues.join(", "),
          options: nextOptions,
        };
      }

      const nextOptions = clearDefaultOption(field.options, optionId);
      const nextDefault = nextOptions.find((option) => option.id === optionId);

      return {
        ...field,
        defaultValue: nextDefault?.value || "",
        options: nextOptions,
      };
    });
    setSelectedOptionId(optionId);
  }

  function removeOption(optionId: string) {
    setOptionToRemoveId(optionId);
  }

  function confirmRemoveOption() {
    if (!optionToRemoveId) {
      return;
    }

    updateSelectedField((field) => ({
      ...field,
      options: (() => {
        const next = field.options.filter((option) => option.id !== optionToRemoveId);

        if (field.controlType.toLowerCase() !== "multiselect" && next.length > 0 && !next.some((option) => option.isDefault)) {
          const firstOption = next[0];
          if (firstOption) {
            next[0] = { ...firstOption, isDefault: true };
          }
        }

        return next;
      })(),
      defaultValue: (() => {
        const next = field.options.filter((option) => option.id !== optionToRemoveId);

        if (next.length === 0) {
          return "";
        }

        if (field.controlType.toLowerCase() === "multiselect") {
          return next.filter((option) => option.isDefault).map((option) => option.value).join(", ");
        }

        const nextDefault = next.find((option) => option.isDefault) ?? next[0];
        return nextDefault?.value || "";
      })(),
    }));

    setSelectedOptionId((current) => (current === optionToRemoveId ? null : current));
    setOptionToRemoveId(null);
  }

  function cancelRemoveOption() {
    setOptionToRemoveId(null);
  }

  function selectOption(optionId: string) {
    setSelectedOptionId(optionId);
  }

  return {
    selectedField,
    selectedControl,
    fieldToRemove,
    optionToRemove,
    selectedOption,
    canCreateForm,
    nameError,
    headerTextError,
    layoutColumnError,
    canvasFieldError,
    fieldLayoutMenuStyle,
    controlUsageCounts,
    fieldIdSet,
    filteredControls,
    previewFieldCount,
    setFieldLayoutPreset,
    clearFieldLayoutPreset,
    removeField,
    confirmRemoveField,
    cancelRemoveField,
    addFieldFromControl,
    appendFieldToCanvas,
    clearAllCanvasFields,
    addOption,
    updateOption,
    setDefaultOption,
    removeOption,
    confirmRemoveOption,
    cancelRemoveOption,
    selectOption,
    updateSelectedField,
    getPreviewColumnSpan,
    getLayoutPresetLabel,
    normalizeLayoutColumn,
  };
}
