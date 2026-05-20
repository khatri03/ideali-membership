import { useRef, useState } from "react";
import { CountrySelectInput } from "../../components/inputs/CountrySelectInput/CountrySelectInput";
import { MultiSelectInput } from "../../components/inputs/MultiSelectInput/MultiSelectInput";
import { PhoneInput } from "../../components/inputs/PhoneInput/PhoneInput";
import { StateSelectInput } from "../../components/inputs/StateSelectInput/StateSelectInput";
import type {
  MembershipRegistrationCustomFormField,
  MembershipRegistrationCustomFormSummary,
} from "../../types/membershipRegistration";
import type {
  CustomFormErrors,
  CustomFormValue,
  CustomFormValues,
} from "./MembershipRegisterWizard.types";
import type { MembershipTheme } from "./MembershipRegisterPage.types";
import {
  formatFileSize,
  getFieldBorderClass,
  getFieldDashedBorderClass,
} from "./MembershipRegisterWizard.utils";
import {
  FieldTooltip,
  WizardField,
} from "./MembershipRegisterWizard.parts";
import {
  buildCustomFormFieldKey,
  getCustomFormControlType,
  getCustomFormFieldSpanClass,
  getCustomFormGridClass,
} from "./MembershipRegisterWizard.logic";

function CustomFormFieldCard({
  field,
  value,
  error,
  onChange,
  countryId,
  theme,
  showBorders,
  formLayoutColumn,
}: {
  field: MembershipRegistrationCustomFormField;
  value: CustomFormValue;
  error: string;
  onChange: (value: CustomFormValue) => void;
  countryId?: string | null;
  theme: MembershipTheme;
  showBorders: boolean;
  formLayoutColumn: number;
}) {
  const controlType = getCustomFormControlType(field.formControlTypeId);
  const label = field.placeHolder || field.controlLabel;
  const defaultOptionValue = typeof value === "string" ? value : "";
  const multiSelectValue = Array.isArray(value) ? value : [];
  const checkboxValue = typeof value === "boolean" ? value : false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectedFile = value instanceof File ? value : null;
  const controlBorderClass = getFieldBorderClass(showBorders);
  const dashedBorderClass = getFieldDashedBorderClass(showBorders);
  const tooltipText = field.tooltip?.trim() || "";
  const spanClass = getCustomFormFieldSpanClass(
    formLayoutColumn,
    field.layoutColumn,
  );

  return (
    <div
      className={`group relative space-y-3 ${spanClass}`.trim()}
      style={{
        borderColor: theme.cardBorder,
        background: "transparent",
      }}
      title={tooltipText || undefined}
    >
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold tracking-tight" style={{ color: theme.titleColor }}>
            {field.controlLabel}
            {field.isMandatory ? <span className="ml-1 text-rose-600">*</span> : null}
          </p>
          {tooltipText ? <FieldTooltip text={tooltipText} theme={theme} /> : null}
        </div>
      </div>

      {controlType === "textarea" ? (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ color: theme.titleColor }}
        />
      ) : controlType === "select" && field.options.length > 0 ? (
        <select
          value={defaultOptionValue}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ color: theme.titleColor }}
        >
          <option value="">{label || "Select one"}</option>
          {field.options.map((option) => (
            <option key={option.uniqueId || option.value} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      ) : controlType === "multiselect" ? (
        <MultiSelectInput
          value={multiSelectValue}
          onChange={onChange}
          options={field.options.map((option) => ({
            label: option.displayText,
            value: option.value,
          }))}
          placeholder={label || "Select one or more"}
        />
      ) : controlType === "country" ? (
        <CountrySelectInput
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "Select country"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "state" ? (
        <StateSelectInput
          countryId={countryId}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "Select state"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "radio" && field.options.length > 0 ? (
        <div className="space-y-2">
          {field.options.map((option) => (
            <label
              key={option.uniqueId || option.value}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-black/5"
              style={{ color: theme.titleColor }}
            >
              <input
                type="radio"
                name={`custom-form-${field.uniqueId}`}
                checked={defaultOptionValue === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-cyan-600"
                style={{ accentColor: theme.level1 }}
              />
              <span className="text-sm font-medium">{option.displayText}</span>
            </label>
          ))}
        </div>
      ) : controlType === "checkbox" ? (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={checkboxValue}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-cyan-600"
          />
          <span className="text-sm font-medium" style={{ color: theme.titleColor }}>
            {field.controlLabel}
          </span>
        </label>
      ) : controlType === "file" ? (
        <div
          className="space-y-3"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            onChange(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={field.acceptedFileTypes || undefined}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition hover:shadow-sm sm:px-5 ${dashedBorderClass}`.trim()}
            style={{
              borderColor: isDragging ? theme.level1 : theme.cardBorder,
              background: isDragging ? theme.level3 : theme.cardBackground,
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: theme.level3,
                color: theme.level1,
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                <path d="M12 2.5a6.5 6.5 0 0 0-4.6 11.1l.1.1h-1a4.9 4.9 0 0 0 0 9.8h11a4.9 4.9 0 0 0 0-9.8h-1l.1-.1A6.5 6.5 0 0 0 12 2.5Zm0 2a4.5 4.5 0 0 1 3.2 7.7l-.8.8V9.2a1 1 0 1 0-2 0V13l-1.3-1.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l3-3a1 1 0 1 0-1.4-1.4L15 13V9.2l.8-.8A4.5 4.5 0 0 1 12 4.5Z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
                {selectedFile?.name || "Drop a file here or browse"}
              </p>
              <p className="text-xs leading-5" style={{ color: theme.bodyColor }}>
                Drag and drop a file here, or click to choose one from your device.
              </p>
            </div>
          </button>

          {selectedFile ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${controlBorderClass}`.trim()}
              style={{
                borderColor: theme.cardBorder,
                background: theme.cardBackground,
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: theme.titleColor }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: theme.bodyColor }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${controlBorderClass}`.trim()}
                style={{
                  borderColor: theme.cardBorder,
                  color: theme.titleColor,
                  background: theme.level3,
                }}
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : controlType === "number" ? (
        <input
          type="number"
          inputMode="numeric"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          min={0}
          step="1"
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "date" ? (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "phone" ? (
        <PhoneInput
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={label || "(555) 123-4567"}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "password" ? (
        <input
          type="password"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : controlType === "email" ? (
        <input
          type="email"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      ) : (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()}
          style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
        />
      )}

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

export function CustomFormSection({
  form,
  values,
  errors,
  onFieldChange,
  theme,
  showBorders,
}: {
  form: MembershipRegistrationCustomFormSummary;
  values: CustomFormValues;
  errors: CustomFormErrors;
  onFieldChange: (key: string, value: CustomFormValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
}) {
  const displayTitle = form.headerText || form.name;
  const displayDescription = form.description || "";
  const layoutColumn = form.layoutColumn || 2;
  const fields = [...(form.fields || [])].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );

  function getNearestCountryValue(targetField: MembershipRegistrationCustomFormField) {
    const countryField = fields
      .filter((candidate) => candidate.displayOrder < targetField.displayOrder)
      .filter((candidate) => getCustomFormControlType(candidate.formControlTypeId) === "country")
      .pop();

    if (!countryField) {
      return null;
    }

    const countryValue = values[buildCustomFormFieldKey(form.uniqueId, countryField.uniqueId)];
    return typeof countryValue === "string" && countryValue.trim().length > 0 ? countryValue : null;
  }

  function handleFieldChange(targetField: MembershipRegistrationCustomFormField, nextValue: CustomFormValue) {
    const key = buildCustomFormFieldKey(form.uniqueId, targetField.uniqueId);
    onFieldChange(key, nextValue);

    if (getCustomFormControlType(targetField.formControlTypeId) !== "country") {
      return;
    }

    fields.forEach((candidate) => {
      if (candidate.displayOrder <= targetField.displayOrder) {
        return;
      }

      if (getCustomFormControlType(candidate.formControlTypeId) === "state") {
        onFieldChange(buildCustomFormFieldKey(form.uniqueId, candidate.uniqueId), "");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: theme.titleColor }}>
          {displayTitle}
        </h3>
        {displayDescription ? (
          <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
            {displayDescription}
          </p>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-4 py-5 text-sm"
          style={{ borderColor: theme.cardBorder, color: theme.bodyColor }}
        >
          This custom form does not contain any fields.
        </div>
      ) : (
        <div className={getCustomFormGridClass()}>
          {fields.map((field) => (
            <CustomFormFieldCard
              key={field.uniqueId || `${field.formId}-${field.displayOrder}`}
              field={field}
              value={values[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ?? ""}
              error={errors[buildCustomFormFieldKey(form.uniqueId, field.uniqueId)] ?? ""}
              onChange={(nextValue) => handleFieldChange(field, nextValue)}
              countryId={getNearestCountryValue(field)}
              theme={theme}
              showBorders={showBorders}
              formLayoutColumn={layoutColumn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
