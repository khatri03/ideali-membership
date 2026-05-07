import { useRef, useState } from "react";
import { PhoneInput } from "../../../../components/inputs/PhoneInput/PhoneInput";
import type { MembershipRegistrationCustomQuestion } from "../../../../types/membershipRegistration";
import { FieldTooltip, MembershipTheme } from "./MembershipRegisterWizard.shared";
import {
  buildCustomQuestionKey,
  formatFileSize,
  getCustomQuestionControlType,
  getCustomQuestionGridClass,
  getFieldBorderClass,
  getFieldDashedBorderClass,
  type CustomQuestionErrors,
  type CustomQuestionValue,
  type CustomQuestionValues,
} from "./MembershipRegisterWizard.questionnaire.helpers";
import { getNearestCountryQuestionValue } from "./MembershipRegisterWizard.questionnaire.runtime";

type CustomQuestionFieldCardProps = {
  question: MembershipRegistrationCustomQuestion;
  value: CustomQuestionValue;
  error: string;
  onChange: (value: CustomQuestionValue) => void;
  onBlur: (value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
  countryId?: string | null;
};

type CustomQuestionsSectionProps = {
  questions: MembershipRegistrationCustomQuestion[];
  values: CustomQuestionValues;
  errors: CustomQuestionErrors;
  onFieldChange: (key: string, value: CustomQuestionValue) => void;
  onFieldBlur: (key: string, value: CustomQuestionValue) => void;
  theme: MembershipTheme;
  showBorders: boolean;
};

function CustomQuestionFieldCard({
  question,
  value,
  error,
  onChange,
  onBlur,
  theme,
  showBorders,
  countryId,
}: CustomQuestionFieldCardProps) {
  const controlType = getCustomQuestionControlType(question.controlType);
  const label = question.placeHolder || question.label;
  const defaultOptionValue = typeof value === "string" ? value : "";
  const multiSelectValue = Array.isArray(value) ? value : [];
  const checkboxValue = typeof value === "boolean" ? value : false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const selectedFile = value instanceof File ? value : null;
  const controlBorderClass = getFieldBorderClass(showBorders);
  const dashedBorderClass = getFieldDashedBorderClass(showBorders);
  const tooltipText = question.tooltip?.trim() || "";

  return (
    <div className={`group relative space-y-3 rounded-2xl p-4 sm:p-5 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, background: theme.tileBackground }} title={tooltipText || undefined}>
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
            {question.label}
            {question.required ? <span className="ml-1 text-rose-600">*</span> : null}
          </p>
          {tooltipText ? <FieldTooltip text={tooltipText} theme={theme} /> : null}
        </div>
      </div>
      {controlType === "textarea" ? (
        <textarea rows={4} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(typeof value === "string" ? value : "")} placeholder={label} className={`w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ color: theme.titleColor }} />
      ) : controlType === "select" && question.options.length > 0 ? (
        <select value={defaultOptionValue} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(defaultOptionValue)} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ color: theme.titleColor }}>
          <option value="">{label || "Select one"}</option>
          {question.options.map((option) => (
            <option key={option.uniqueId || option.value} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </select>
      ) : controlType === "radio" && question.options.length > 0 ? (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.uniqueId || option.value} className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-black/5" style={{ color: theme.titleColor }}>
              <input type="radio" name={`custom-question-${question.uniqueId}`} checked={defaultOptionValue === option.value} onChange={() => onChange(option.value)} onBlur={() => onBlur(defaultOptionValue)} className="h-4 w-4 accent-cyan-600" style={{ accentColor: theme.level1 }} />
              <span className="text-sm font-medium">{option.displayText}</span>
            </label>
          ))}
        </div>
      ) : controlType === "checkbox" ? (
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={checkboxValue} onChange={(event) => onChange(event.target.checked)} onBlur={() => onBlur(checkboxValue)} className="h-4 w-4 accent-cyan-600" />
          <span className="text-sm font-medium" style={{ color: theme.titleColor }}>
            {question.label}
          </span>
        </label>
      ) : controlType === "file" ? (
        <div className="space-y-3" onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); onChange(event.dataTransfer.files?.[0] ?? null); }}>
          <input ref={fileInputRef} type="file" accept={question.acceptedFileTypes || undefined} onChange={(event) => onChange(event.target.files?.[0] ?? null)} onBlur={() => onBlur(selectedFile)} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition hover:shadow-sm sm:px-5 ${dashedBorderClass}`.trim()} style={{ background: isDragging ? theme.level3 : theme.cardBackground }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: theme.level3, color: theme.level1 }}>
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
            <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: theme.titleColor }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: theme.bodyColor }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button type="button" onClick={() => onChange(null)} className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor, background: theme.level3 }}>
                Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : controlType === "number" ? (
        <input type="number" inputMode="numeric" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={label} min={0} step="1" className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      ) : controlType === "date" ? (
        <input type="date" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(typeof value === "string" ? value : "")} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      ) : controlType === "phone" ? (
        <PhoneInput value={typeof value === "string" ? value : ""} onChange={onChange} placeholder={label || "(555) 123-4567"} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${getFieldBorderClass(showBorders)}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      ) : controlType === "password" ? (
        <input type="password" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(typeof value === "string" ? value : "")} placeholder={label} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      ) : controlType === "email" ? (
        <input type="text" inputMode="email" autoComplete="email" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(typeof value === "string" ? value : "")} placeholder={label} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      ) : (
        <input type="text" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(typeof value === "string" ? value : "")} placeholder={label} className={`w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 ${controlBorderClass}`.trim()} style={{ borderColor: theme.cardBorder, color: theme.titleColor }} />
      )}

      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function CustomQuestionsSection({
  questions,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
  theme,
  showBorders,
}: CustomQuestionsSectionProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-4">
      <div className={getCustomQuestionGridClass()}>
        {questions
          .slice()
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((question, index, sortedQuestions) => {
            const key = buildCustomQuestionKey(question.uniqueId);
            const countryId = getNearestCountryQuestionValue(sortedQuestions, values, index);
            const controlType = getCustomQuestionControlType(question.controlType);

            function handleFieldChange(nextValue: CustomQuestionValue) {
              onFieldChange(key, nextValue);

              if (controlType !== "country") {
                return;
              }

              for (let nextIndex = index + 1; nextIndex < sortedQuestions.length; nextIndex += 1) {
                const nextQuestion = sortedQuestions[nextIndex];
                if (!nextQuestion) {
                  continue;
                }

                const nextType = getCustomQuestionControlType(nextQuestion.controlType);

                if (nextType === "country") {
                  break;
                }

                if (nextType === "state") {
                  onFieldChange(buildCustomQuestionKey(nextQuestion.uniqueId), "");
                }
              }
            }

            return (
              <CustomQuestionFieldCard
                key={question.uniqueId}
                question={question}
                value={values[key] ?? ""}
                error={errors[key] ?? ""}
                onChange={handleFieldChange}
                onBlur={(nextValue) => onFieldBlur(key, nextValue)}
                theme={theme}
                showBorders={showBorders}
                countryId={countryId}
              />
            );
          })}
      </div>
    </div>
  );
}

export { CustomQuestionsSection };

