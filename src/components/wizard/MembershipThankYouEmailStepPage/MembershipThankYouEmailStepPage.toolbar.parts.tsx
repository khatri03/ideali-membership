import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { getSelectedPlaceholderTokenAttrs } from "./MembershipThankYouEmailStepPage.toolbar.helpers";

export function ToolbarButton({
  editor,
  label,
  onClick,
  isActive,
  icon,
  compact,
}: {
  editor: Editor | null;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!editor}
      title={label}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-50",
        compact ? "h-9 w-9" : "h-10 min-w-10 px-3",
        isActive
          ? "border-cyan-200 bg-cyan-50 text-cyan-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

export function SelectField({
  label,
  onChange,
  options,
  groups,
  className = "",
}: {
  label: string;
  onChange: (value: string) => void;
  options?: Array<{ label: string; value: string; disabled?: boolean }>;
  groups?: Array<{
    label: string;
    options: Array<{ label: string; value: string; disabled?: boolean }>;
  }>;
  className?: string;
}) {
  return (
    <label className={["inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700", className].join(" ")}>
      <span className="sr-only">{label}</span>
      <select
        defaultValue=""
        onChange={(event) => {
          onChange(event.target.value);
          event.currentTarget.value = "";
        }}
        className="w-full bg-transparent text-sm outline-none"
      >
        <option value="">{label}</option>
        {groups && groups.length > 0
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
      </select>
    </label>
  );
}

export function ColorButton({
  editor,
  onApplyColor,
}: {
  editor: Editor | null;
  onApplyColor: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentColor = getSelectedPlaceholderTokenAttrs(editor)?.color || editor?.getAttributes("textStyle")?.color || "#111827";

  return (
    <button
      type="button"
      disabled={!editor}
      onClick={() => inputRef.current?.click()}
      className="inline-flex h-10 min-w-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      title="Text color"
      aria-label="Text color"
    >
      <span className="text-base font-semibold">A</span>
      <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: currentColor }} />
      <input
        ref={inputRef}
        type="color"
        value={currentColor}
        onChange={(event) => onApplyColor(event.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </button>
  );
}

export function Divider() {
  return <span className="mx-1 hidden h-9 w-px bg-slate-200 md:inline-block" aria-hidden="true" />;
}

export function Section({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">{children}</div>;
}

export function BulletListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <circle cx="4.5" cy="5" r="1.1" />
      <circle cx="4.5" cy="10" r="1.1" />
      <circle cx="4.5" cy="15" r="1.1" />
      <rect x="7" y="4.25" width="9" height="1.5" rx="0.75" />
      <rect x="7" y="9.25" width="9" height="1.5" rx="0.75" />
      <rect x="7" y="14.25" width="9" height="1.5" rx="0.75" />
    </svg>
  );
}

export function TextLinesIcon({ align }: { align: "left" | "center" | "right" | "justify" }) {
  const x1 = align === "left" ? 4 : align === "center" ? 5 : align === "right" ? 7 : 4;
  const x2 = align === "left" ? 4 : align === "center" ? 4 : align === "right" ? 5 : 4;
  const x3 = align === "left" ? 4 : align === "center" ? 6 : align === "right" ? 4 : 4;
  const w1 = align === "left" ? 12 : align === "center" ? 10 : align === "right" ? 9 : 12;
  const w2 = align === "left" ? 9 : align === "center" ? 12 : align === "right" ? 11 : 12;
  const w3 = align === "left" ? 6 : align === "center" ? 8 : align === "right" ? 12 : 12;

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <rect x={x1} y="4" width={w1} height="1.5" rx="0.75" />
      <rect x={x2} y="8.5" width={w2} height="1.5" rx="0.75" />
      <rect x={x3} y="13" width={w3} height="1.5" rx="0.75" />
    </svg>
  );
}

export function NumberListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M4.1 4.2h1V8h.8v1H3.7V8h.8V5.3L3.7 5l.4-1ZM4 10.4h1.9c1 0 1.7.6 1.7 1.6 0 .6-.3 1.1-.8 1.3.6.2.9.8.9 1.5 0 1-.7 1.8-1.9 1.8H4v-1h1.8c.6 0 1-.3 1-.8 0-.4-.3-.7-.9-.7H4.9v-1h.8c.5 0 .8-.2.8-.6 0-.4-.3-.6-.8-.6H4v-1Zm6-5.3h6v1.4h-6V5.1Zm0 5h6v1.4h-6v-1.4Zm0 5h6v1.4h-6v-1.4Z" />
    </svg>
  );
}

export function QuoteIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.2 5.4H4.9L3.7 9.1v5.5h4.1V9.1H6.1l.1-.5.8-3.2Zm8.9 0h-1.3l-1.2 3.7v5.5h4.1V9.1h-1.3l.1-.5.8-3.2Z" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8 12.5a1 1 0 0 1 0-1.4l2.6-2.6a1 1 0 1 1 1.4 1.4L9.4 12.5a1 1 0 0 1-1.4 0Zm-2-1.1A3.3 3.3 0 0 1 6 6.7l1.4-1.4A3.3 3.3 0 0 1 11 4.8a1 1 0 1 1-1.4 1.4 1.4 1.4 0 0 0-1.9 0L6.3 7a1.4 1.4 0 0 0 0 1.9 1 1 0 1 1-1.4 1.4ZM14 4.8a3.3 3.3 0 0 1 4.6 0 1 1 0 0 1-1.4 1.4 1.4 1.4 0 0 0-1.9 0L14 7.4a1.4 1.4 0 0 0 0 1.9 1 1 0 1 1-1.4 1.4 3.3 3.3 0 0 1 0-4.6l1.4-1.4Zm-8 10.4a3.3 3.3 0 0 1-4.6 0 1 1 0 1 1 1.4-1.4 1.4 1.4 0 0 0 1.9 0L6 12.4a1.4 1.4 0 0 0 0-1.9 1 1 0 0 1 1.4-1.4 3.3 3.3 0 0 1 0 4.6l-1.4 1.4Zm8-5.3a3.3 3.3 0 0 1 0 4.6l-1.4 1.4a3.3 3.3 0 0 1-4.6 0 1 1 0 1 1 1.4-1.4 1.4 1.4 0 0 0 1.9 0l1.4-1.4a1.4 1.4 0 0 0 0-1.9 1 1 0 1 1 1.4-1.4Z" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8.4 5 5 8.4l3.4 3.4V9.8h2.1a3.7 3.7 0 1 1 0 7.4H8.7a1 1 0 1 1 0-2h1.8a1.7 1.7 0 1 0 0-3.4H8.4v1.6L5 9.8 8.4 6.4V8h1.6a5.7 5.7 0 1 1 0 11.4H8.7a1 1 0 1 1 0-2h1.3a3.7 3.7 0 1 0 0-7.4H8.4V5Z" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M11.6 5 15 8.4l-3.4 3.4V9.8H9.5a3.7 3.7 0 1 0 0 7.4h1.8a1 1 0 1 0 0-2h-1.8a1.7 1.7 0 1 1 0-3.4h2.1v1.6L15 9.8 11.6 6.4V8H10a5.7 5.7 0 1 0 0 11.4h1.3a1 1 0 1 0 0-2H10a3.7 3.7 0 1 1 0-7.4h1.6V5Z" />
    </svg>
  );
}
