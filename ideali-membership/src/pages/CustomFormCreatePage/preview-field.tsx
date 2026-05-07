import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../../components/inputs/MultiSelectInput/MultiSelectInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import { PasswordInput } from "../../components/inputs/PasswordInput/PasswordInput";
import type { CustomFormFieldDraft } from "../../types/customForms";
import { getDefaultMultiSelectValues, getDefaultOptionValue, isTruthyValue, type PreviewValue } from "./utils";
export function PreviewFieldLabel({ field }: { field: CustomFormFieldDraft }) {
  if (field.controlType.toLowerCase() === "checkbox") {
    return null;
  }

  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-800">{field.label}</span>
      {field.required ? (
        <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
          *
        </span>
      ) : null}
    </div>
  );
}

export function PreviewFieldRenderer({
  field,
  value,
  onChange,
  countryId,
}: {
  field: CustomFormFieldDraft;
  value: PreviewValue;
  onChange: (value: PreviewValue) => void;
  countryId?: string | null;
}) {
  const controlType = field.controlType.toLowerCase();
  const placeholder = field.placeholder || field.label;
  const defaultOptionValue = getDefaultOptionValue(field);
  const multiSelectValue = Array.isArray(value) ? value : getDefaultMultiSelectValues(field);

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "tel":
      return (
        <input
          type={controlType}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "password":
      return (
        <PasswordInput
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "textarea":
      return (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        >
          <option value="">{field.placeholder || "Select one"}</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={(nextValue) => onChange(nextValue)}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={field.placeholder || "Select one or more"}
        />
      );
    case "country":
      return (
        <CountrySelectInput
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={field.placeholder || "Select country"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "state":
      return (
        <StateSelectInput
          countryId={countryId}
          value={typeof value === "string" ? value : ""}
          onChange={(nextValue) => onChange(nextValue)}
          placeholder={field.placeholder || "Select state"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={typeof value === "boolean" ? value : isTruthyValue(field.defaultValue)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-cyan-600"
          />
          <span className="text-sm font-medium text-slate-800">{field.label}</span>
        </label>
      );
    case "radio":
      return (
        <div className="space-y-3">
          {field.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="radio"
                name={`preview-${field.id}`}
                checked={typeof value === "string" ? value === option.value : defaultOptionValue === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-cyan-600"
              />
              <span>{option.displayText}</span>
            </label>
          ))}
        </div>
      );
    case "file":
      return (
        <input
          type="file"
          accept={field.acceptedFileTypes.length > 0 ? field.acceptedFileTypes.join(",") : undefined}
          onChange={() => onChange(null)}
          className="block w-full text-sm text-slate-500"
        />
      );
    case "range":
      return (
        <input
          type="range"
          value={typeof value === "string" ? value : field.defaultValue || ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full accent-cyan-600"
        />
      );
    case "color":
      return (
        <input
          type="color"
          value={typeof value === "string" ? value : field.defaultValue || "#0ea5e9"}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
        />
      );
    case "submit":
      return (
        <button
          type="button"
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
  }
}
