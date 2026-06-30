import { createPortal } from "react-dom";
import type { PointerEvent, RefObject } from "react";
import type { MembershipTheme } from "../MembershipRegisterPage.types";
import { AVATAR_MIN_ZOOM, AVATAR_MAX_ZOOM, AVATAR_VIEWPORT_SIZE } from "./ProfilePhotoField.helpers";

export function AvatarSilhouetteIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.79-8 6.23V21h16v-.77C20 16.79 16.42 14 12 14Z" />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1H4l.7 9.1A2 2 0 0 0 6.7 17h6.6a2 2 0 0 0 2-1.9L16 6h.5a.5.5 0 0 0 0-1H14V4a1 1 0 0 0-1-1H7Zm1 2V4h4v1H8Zm-1.2 2h6.4L12.7 15H7.3L6.8 7Zm2 2.2a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Zm3 0a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Z" />
    </svg>
  );
}

export function DragHintIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="currentColor">
      <path d="M7 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

export function AvatarEditorModal({
  editorUrl,
  editorZoom,
  editorOffsetXPercent,
  editorOffsetYPercent,
  previewDimensions,
  isDragging,
  isSaving,
  cropViewportRef,
  theme,
  onClose,
  onSave,
  onZoomChange,
  onCropPointerDown,
}: {
  editorUrl: string;
  editorZoom: number;
  editorOffsetXPercent: number;
  editorOffsetYPercent: number;
  previewDimensions: { width: number; height: number } | null;
  isDragging: boolean;
  isSaving: boolean;
  cropViewportRef: RefObject<HTMLDivElement | null>;
  theme: MembershipTheme;
  onClose: () => void;
  onSave: () => void;
  onZoomChange: (zoom: number) => void;
  onCropPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close avatar editor"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Edit avatar"
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-4xl border bg-white p-0 shadow-2xl"
        style={{
          borderColor: "rgba(59, 130, 246, 0.15)",
          boxShadow: `0 30px 80px -30px ${theme.cardShadow}`,
        }}
      >
        <div className="border-b border-blue-50 bg-blue-50/60 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.level1 }}>
            Profile Photo
          </div>
          <h3 className="mt-1 text-2xl font-semibold" style={{ color: theme.titleColor }}>
            Adjust Avatar Crop
          </h3>
          <p className="mt-2 text-sm" style={{ color: theme.bodyColor }}>
            Choose the square area you want to use as your avatar before saving.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6">
          <div className="flex w-full items-center justify-center">
            <div className="rounded-4xl border border-blue-50 bg-blue-50/50 p-5">
          <div
            ref={cropViewportRef as RefObject<HTMLDivElement>}
            className={`relative h-60 w-60 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={onCropPointerDown}
          >
                <img
                  src={editorUrl}
                  alt="Avatar editor preview"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: previewDimensions
                      ? previewDimensions.width *
                        Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) *
                        editorZoom
                      : 0,
                    height: previewDimensions
                      ? previewDimensions.height *
                        Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) *
                        editorZoom
                      : 0,
                    transform: `translate(calc(-50% + ${editorOffsetXPercent}px), calc(-50% + ${editorOffsetYPercent}px))`,
                    userSelect: "none",
                  }}
                />
                {!isDragging ? (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-slate-950/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-sm">
                    <DragHintIcon className="h-3.5 w-3.5" />
                    Drag to reposition
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-3">
            <div>
              <div
                className="mb-2 flex items-center justify-between text-sm font-medium"
                style={{ color: theme.tileValueColor }}
              >
                <span>Zoom</span>
                <span style={{ color: theme.bodyColor }}>{editorZoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={AVATAR_MIN_ZOOM}
                max={AVATAR_MAX_ZOOM}
                step="0.01"
                value={editorZoom}
                onChange={(event) => onZoomChange(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              style={{ color: theme.bodyColor }}
            >
              Drag the image inside the circle to choose what stays visible in your avatar.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Use This Avatar"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function RemoveAvatarConfirmModal({
  theme,
  onCancel,
  onConfirm,
}: {
  theme: MembershipTheme;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-10000 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close remove avatar dialog"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Remove profile photo"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border bg-white shadow-2xl"
        style={{
          borderColor: theme.cardBorder,
          boxShadow: `0 24px 70px -28px ${theme.cardShadow}`,
        }}
      >
        <div className="space-y-3 px-6 py-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold" style={{ color: theme.titleColor }}>
              Remove profile photo?
            </h3>
            <p className="text-sm leading-6" style={{ color: theme.bodyColor }}>
              This will clear the selected avatar. You can add a new one anytime.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: theme.cardBorder, color: theme.titleColor }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: theme.level1 }}
            >
              Remove photo
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
