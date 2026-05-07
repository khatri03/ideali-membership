import type { CustomFormFieldDraft } from "../../types/customForms";
import type { PreviewValue } from "./utils";
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
