import { useState } from "react";
import type { Modifier } from "@dnd-kit/core";
import { PhoneInput } from "../../../components/inputs/PhoneInput/PhoneInput";

export function DragGripIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
      <circle cx="5" cy="4" r="1" />
      <circle cx="11" cy="4" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="11" cy="12" r="1" />
    </svg>
  );
}

export function PreviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5l4 4L8 20l-5 1 1-5 12.5-12.5Z" />
    </svg>
  );
}

export const constrainSelectedFormDragToParent: Modifier = ({
  activeNodeRect,
  containerNodeRect,
  transform,
}) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  const minX = containerNodeRect.left - activeNodeRect.left;
  const maxX = containerNodeRect.right - activeNodeRect.right;
  const minY = containerNodeRect.top - activeNodeRect.top;
  const maxY = containerNodeRect.bottom - activeNodeRect.bottom;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

export function getPreviewDefaultOptionValue(options: Array<{ value: string }>, defaultValue: string | null) {
  return defaultValue || options[0]?.value || "";
}

export function parseDelimitedValues(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function toSentenceCase(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return "Field";
  }

  const normalized = trimmed.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function toggleAcceptedFileType(acceptedFileTypes: string[], fileType: string, checked: boolean) {
  return checked
    ? Array.from(new Set([...acceptedFileTypes, fileType]))
    : acceptedFileTypes.filter((value) => value !== fileType);
}

export function normalizePreviewLayoutColumn(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(4, Math.floor(value)));
}

export function PhonePreviewInput({
  value,
  placeholder,
}: {
  value: string;
  placeholder: string;
}) {
  const [phoneValue, setPhoneValue] = useState(() => value);

  return (
    <PhoneInput
      value={phoneValue}
      onChange={setPhoneValue}
      placeholder={placeholder}
      inputMode="tel"
      pattern="[0-9()\\-\\s]*"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
    />
  );
}
