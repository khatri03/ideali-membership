import { useEffect, useState } from "react";
import type { CustomFormFieldDraft } from "../../types/customForms";
import { buildPreviewValues, getPreviewColumnSpan, getPreviewDefaultValue, type PreviewValue } from "./utils";
import { FormPreviewField } from "./form-preview-field";

export function PreviewFormCanvas({
  fields,
  spanCount,
  isCompactViewport,
}: {
  fields: CustomFormFieldDraft[];
  spanCount: number;
  isCompactViewport: boolean;
}) {
  const [previewValues, setPreviewValues] = useState<Record<string, PreviewValue>>(() => buildPreviewValues(fields));

  useEffect(() => {
    setPreviewValues(buildPreviewValues(fields));
  }, [fields]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
      {fields.map((field) => {
        const countryField = fields
          .filter((candidate) => candidate.displayOrder < field.displayOrder)
          .filter((candidate) => candidate.controlType.toLowerCase() === "country")
          .pop();

        const countryId =
          countryField && typeof previewValues[countryField.id] === "string"
            ? (previewValues[countryField.id] as string)
            : null;

        return (
          <FormPreviewField
            key={field.id}
            field={field}
            span={getPreviewColumnSpan(field, spanCount)}
            isCompactViewport={isCompactViewport}
            value={previewValues[field.id] ?? getPreviewDefaultValue(field)}
            countryId={countryId}
            onChange={(nextValue) =>
              setPreviewValues((current) => ({
                ...current,
                [field.id]: nextValue,
              }))
            }
          />
        );
      })}
    </div>
  );
}
