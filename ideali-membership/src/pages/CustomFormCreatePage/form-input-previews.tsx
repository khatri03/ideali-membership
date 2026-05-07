import { type RefObject } from "react";

export function FieldPreview({
  title,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  error,
  inputRef,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  inputRef?: RefObject<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{title}</span>
        {required ? (
          <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
            *
          </span>
        ) : null}
      </span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100",
          error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200",
        ].join(" ")}
      />
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

export function SelectFieldPreview({
  title,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{title}</span>
        {required ? (
          <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
            *
          </span>
        ) : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
