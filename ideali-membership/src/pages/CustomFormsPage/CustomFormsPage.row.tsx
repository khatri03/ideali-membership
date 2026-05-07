import type { CustomFormSummary } from "../../types/customForms";
import { CustomFormActionsMenu } from "./CustomFormsPage.actions";

export function CustomFormTableRow({
  form,
  onEdit,
}: {
  form: CustomFormSummary;
  onEdit: (uniqueId: string) => void;
}) {
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="px-4 py-4 align-top">
        <CustomFormActionsMenu itemName={form.name} onEdit={() => onEdit(form.uniqueId)} />
      </td>
      <td className="px-4 py-4 align-top">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">{form.name}</p>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">{form.headerText}</td>
      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">{form.totalFields}</td>
    </tr>
  );
}
