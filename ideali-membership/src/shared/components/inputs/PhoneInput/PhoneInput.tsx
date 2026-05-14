import type { CSSProperties, InputHTMLAttributes } from "react";

export function extractPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneInputValue(value: string) {
  const digits = extractPhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isPhoneInputNavigationKey(key: string) {
  return key === "Backspace" || key === "Delete" || key === "Tab" || key === "Enter" || key === "Escape" || key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End";
}

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className: string;
  style?: CSSProperties;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
};

export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  style,
  autoComplete = "tel",
  inputMode = "numeric",
  pattern,
}: PhoneInputProps) {
  return (
    <input
      type="tel"
      inputMode={inputMode}
      autoComplete={autoComplete}
      pattern={pattern}
      value={formatPhoneInputValue(value)}
      onChange={(event) => onChange(formatPhoneInputValue(event.target.value))}
      onKeyDown={(event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }

        if (isPhoneInputNavigationKey(event.key)) {
          return;
        }

        if (/^\d$/.test(event.key)) {
          return;
        }

        event.preventDefault();
      }}
      onPaste={(event) => {
        event.preventDefault();
        const pastedText = event.clipboardData.getData("text");
        onChange(formatPhoneInputValue(`${value}${pastedText}`));
      }}
      onBlur={onBlur}
      placeholder={placeholder || "(555) 123-4567"}
      className={className}
      style={style}
    />
  );
}
