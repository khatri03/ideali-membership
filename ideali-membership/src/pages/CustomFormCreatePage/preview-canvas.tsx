import { useEffect, useState } from "react";
import type { CustomFormFieldDraft } from "../../types/customForms";
import { buildPreviewValues, getPreviewColumnSpan, getPreviewDefaultValue, type PreviewValue } from "./utils";
import { PreviewFieldLabel, PreviewFieldRenderer } from "./preview-field";

export function FormPreviewField({
  field,
  span,
  isCompactViewport,
  value,
  onChange,
  countryId,
}: {
  field: CustomFormFieldDraft;
  span: number;
  isCompactViewport: boolean;
  value: PreviewValue;
  onChange: (value: PreviewValue) => void;
  countryId?: string | null;
}) {
  return (
    <div
      className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-4"
      style={{ gridColumn: isCompactViewport ? "1 / -1" : `span ${span} / span ${span}` }}
    >
      <div className="space-y-3">
        <PreviewFieldLabel field={field} />
        <PreviewFieldRenderer field={field} value={value} onChange={onChange} countryId={countryId} />
        {field.tooltip ? <p className="text-xs text-slate-500">{field.tooltip}</p> : null}
      </div>
    </div>
  );
}

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
