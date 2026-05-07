import { createPortal } from "react-dom";
import type { MutableRefObject, PointerEvent } from "react";
import { type MembershipTheme } from "./MembershipRegisterWizard.shared";
import { AVATAR_MAX_ZOOM, AVATAR_MIN_ZOOM, AVATAR_VIEWPORT_SIZE, DragHintIcon } from "./MembershipRegisterWizard.helpers";

export function ProfilePhotoEditorDialog({
  isOpen,
  editorUrl,
  previewDimensions,
  isDragging,
  editorZoom,
  setEditorZoom,
  editorOffsetXPercent,
  editorOffsetYPercent,
  cropViewportRef,
  closeEditor,
  applyEditorChanges,
  handleCropPointerDown,
  isSaving,
  theme,
}: {
  isOpen: boolean;
  editorUrl: string | null;
  previewDimensions: { width: number; height: number } | null;
  isDragging: boolean;
  editorZoom: number;
  setEditorZoom: (value: number) => void;
  editorOffsetXPercent: number;
  editorOffsetYPercent: number;
  cropViewportRef: MutableRefObject<HTMLDivElement | null>;
  closeEditor: () => void;
  applyEditorChanges: () => Promise<void>;
  handleCropPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  isSaving: boolean;
  theme: MembershipTheme;
}) {
  if (!isOpen || !editorUrl) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close avatar editor"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={closeEditor}
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
                ref={cropViewportRef}
                className={`relative h-60 w-60 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-inner ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onPointerDown={handleCropPointerDown}
              >
                <img
                  src={editorUrl}
                  alt="Avatar editor preview"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: previewDimensions
                      ? previewDimensions.width * Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) * editorZoom
                      : 0,
                    height: previewDimensions
                      ? previewDimensions.height * Math.max(AVATAR_VIEWPORT_SIZE / previewDimensions.width, AVATAR_VIEWPORT_SIZE / previewDimensions.height) * editorZoom
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
              <div className="mb-2 flex items-center justify-between text-sm font-medium" style={{ color: theme.tileValueColor }}>
                <span>Zoom</span>
                <span style={{ color: theme.bodyColor }}>{editorZoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={AVATAR_MIN_ZOOM}
                max={AVATAR_MAX_ZOOM}
                step="0.01"
                value={editorZoom}
                onChange={(event) => setEditorZoom(Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" style={{ color: theme.bodyColor }}>
              Drag the image inside the circle to choose what stays visible in your avatar.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void applyEditorChanges()}
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
