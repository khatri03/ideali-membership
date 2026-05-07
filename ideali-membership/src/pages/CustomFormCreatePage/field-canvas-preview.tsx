import { useEffect, useState } from "react";
import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../../components/inputs/MultiSelectInput/MultiSelectInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import { PasswordInput } from "../../components/inputs/PasswordInput/PasswordInput";
import type { CustomFormFieldDraft } from "../../types/customForms";
import { getDefaultMultiSelectValues, getDefaultOptionValue, isTruthyValue } from "./utils";
export function FieldCanvasPreview({ field }: { field: CustomFormFieldDraft }) {
  const controlType = field.controlType.toLowerCase();
  const placeholder = field.placeholder || field.label;
  const defaultOptionValue = getDefaultOptionValue(field);
  const [previewMultiSelectValue, setPreviewMultiSelectValue] = useState(() => getDefaultMultiSelectValues(field));
  const [previewCountryValue, setPreviewCountryValue] = useState(() => field.defaultValue || "");

  useEffect(() => {
    if (controlType === "multiselect") {
      setPreviewMultiSelectValue(getDefaultMultiSelectValues(field));
    }
  }, [controlType, field.defaultValue, field.options, field.id]);

  useEffect(() => {
    if (controlType === "country") {
      setPreviewCountryValue(field.defaultValue || "");
    }
  }, [controlType, field.defaultValue, field.id]);

  switch (controlType) {
    case "text":
    case "email":
    case "number":
    case "date":
    case "tel":
      return (
        <input
          type={controlType}
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "password":
      return (
        <PasswordInput
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "textarea":
      return (
        <textarea
          rows={4}
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
    case "select":
      return (
        <select
          value={defaultOptionValue}
          disabled
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        >
          <option value="" disabled>
            {placeholder || "Select one"}
          </option>
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
          value={previewMultiSelectValue}
          onChange={setPreviewMultiSelectValue}
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
          value={previewCountryValue}
          onChange={setPreviewCountryValue}
          placeholder={field.placeholder || "Select country"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "state":
      return (
        <StateSelectInput
          countryId={null}
          value={field.defaultValue}
          onChange={() => undefined}
          placeholder={field.placeholder || "Select state"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
      );
    case "checkbox":
      return (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={isTruthyValue(field.defaultValue)} readOnly className="h-4 w-4 accent-cyan-600" />
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
                name={field.id}
                checked={getDefaultOptionValue(field) === option.value}
                readOnly
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
          readOnly
          className="block w-full text-sm text-slate-500"
        />
      );
    case "range":
      return <input type="range" value={field.defaultValue || undefined} readOnly className="w-full accent-cyan-600" />;
    case "color":
      return <input type="color" value={field.defaultValue || "#0ea5e9"} readOnly className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1" />;
    case "submit":
      return (
        <button
          type="button"
          className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {field.label}
        </button>
      );
    default:
      return (
        <input
          type="text"
          value={field.defaultValue}
          readOnly
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none"
        />
      );
  }
}
