import { useEffect, useMemo, useState } from "react";
import { fetchCustomForms } from "../../lib/customForms";
import type { CustomFormSummary } from "../../types/customForms";

export function useCustomFormsPageData() {
  const [forms, setForms] = useState<CustomFormSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadForms() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchCustomForms();
        if (!cancelled) {
          setForms(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load custom forms.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadForms();

    return () => {
      cancelled = true;
    };
  }, []);

  const formCountLabel = useMemo(() => {
    if (forms.length === 0) {
      return "No forms yet";
    }

    return `${forms.length} custom form${forms.length === 1 ? "" : "s"}`;
  }, [forms.length]);

  return {
    forms,
    isLoading,
    error,
    formCountLabel,
  };
}
