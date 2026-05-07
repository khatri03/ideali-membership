import { useEffect, useState } from "react";
import { fetchCustomFormControls, fetchCustomFormPreview } from "../../services/customForms";
import type { CustomFormControl, CustomFormDraft, CustomFormFieldDraft } from "../../types/customForms";
import { buildEmptyDraft, mapPreviewFieldToDraft } from "./index";

export function useCustomFormCreatePageData(customFormUniqueId?: string) {
  const [controls, setControls] = useState<CustomFormControl[]>([]);
  const [isLoadingControls, setIsLoadingControls] = useState(true);
  const [controlsError, setControlsError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomFormDraft>(buildEmptyDraft());
  const [fields, setFields] = useState<CustomFormFieldDraft[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(Boolean(customFormUniqueId));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadControls() {
      setIsLoadingControls(true);
      setControlsError(null);

      try {
        const response = await fetchCustomFormControls();
        if (!cancelled) {
          setControls(response);
        }
      } catch (error) {
        if (!cancelled) {
          setControlsError(error instanceof Error ? error.message : "Unable to load controls.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingControls(false);
        }
      }
    }

    void loadControls();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!customFormUniqueId) {
      setIsLoadingForm(false);
      setLoadError(null);
      setDraft(buildEmptyDraft());
      setFields([]);
      return;
    }

    let cancelled = false;

    async function loadCustomForm(formUniqueId: string) {
      setIsLoadingForm(true);
      setLoadError(null);

      try {
        const preview = await fetchCustomFormPreview(formUniqueId);
        if (cancelled) {
          return;
        }

        setDraft({
          name: preview.name,
          headerText: preview.headerText,
          description: preview.description ?? "",
          layoutColumn: preview.layoutColumn ?? 1,
        });
        setFields(preview.fields.map((field) => mapPreviewFieldToDraft(field)));
      } catch (formError) {
        if (!cancelled) {
          setLoadError(formError instanceof Error ? formError.message : "Unable to load custom form.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingForm(false);
        }
      }
    }

    void loadCustomForm(customFormUniqueId);

    return () => {
      cancelled = true;
    };
  }, [customFormUniqueId]);

  return {
    controls,
    controlsError,
    draft,
    fields,
    isLoadingControls,
    isLoadingForm,
    loadError,
    setControls,
    setDraft,
    setFields,
  };
}
