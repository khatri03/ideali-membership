import { useId, useState, type CSSProperties, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
  inputClassName?: string;
  style?: CSSProperties;
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
      <path d="M6.6 6.8C4.3 8.6 2.5 12 2.5 12s3.5 7 9.5 7c1.5 0 2.9-.3 4.1-.8" />
      <path d="M9.7 4.8A10.6 10.6 0 0 1 12 4.5c6 0 9.5 7.5 9.5 7.5s-1.4 2.9-4 5.1" />
    </svg>
  );
}

export function PasswordInput({
  wrapperClassName,
  inputClassName,
  style,
  id,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <div className={`relative w-full ${wrapperClassName ?? ""}`.trim()}>
      <input
        id={inputId}
        {...props}
        type={isVisible ? "text" : "password"}
        className={`${props.className ?? ""} ${inputClassName ?? ""} pr-12`.trim()}
        style={style}
      />
      <button
        type="button"
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-700 focus:outline-none"
      >
        <EyeIcon open={isVisible} />
      </button>
    </div>
  );
}
