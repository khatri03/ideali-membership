import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { MembershipTheme } from "../MembershipRegisterPage.types";

const AVATAR_VIEWPORT_SIZE = 240;
const AVATAR_OUTPUT_SIZE = 400;
const AVATAR_DEFAULT_ZOOM = 1.15;
const AVATAR_MIN_ZOOM = 1.05;
const AVATAR_MAX_ZOOM = 3;

function clampAvatarOffset(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to load the selected image."));
    image.src = src;
  });
}

function buildAvatarFileName(sourceName: string, mimeType: string) {
  const extension =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/png"
          ? "png"
          : "png";
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}-avatar.${extension}`;
}

async function cropAvatarFile(
  file: File,
  previewUrl: string,
  dimensions: { width: number; height: number },
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadImageElement(previewUrl);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  const baseScale = Math.max(
    AVATAR_VIEWPORT_SIZE / dimensions.width,
    AVATAR_VIEWPORT_SIZE / dimensions.height,
  );
  const scale = baseScale * zoom;
  const sourceWidth = AVATAR_VIEWPORT_SIZE / scale;
  const sourceHeight = AVATAR_VIEWPORT_SIZE / scale;
  const sourceX = clampAvatarOffset(
    (dimensions.width - sourceWidth) / 2 - offsetX / scale,
    0,
    Math.max(0, dimensions.width - sourceWidth),
  );
  const sourceY = clampAvatarOffset(
    (dimensions.height - sourceHeight) / 2 - offsetY / scale,
    0,
    Math.max(0, dimensions.height - sourceHeight),
  );

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );

  const mimeType = file.type || "image/png";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], buildAvatarFileName(file.name, mimeType), {
    type: mimeType,
  });
}

function AvatarSilhouetteIcon({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.79-8 6.23V21h16v-.77C20 16.79 16.42 14 12 14Z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M7 3a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1H4l.7 9.1A2 2 0 0 0 6.7 17h6.6a2 2 0 0 0 2-1.9L16 6h.5a.5.5 0 0 0 0-1H14V4a1 1 0 0 0-1-1H7Zm1 2V4h4v1H8Zm-1.2 2h6.4L12.7 15H7.3L6.8 7Zm2 2.2a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Zm3 0a.8.8 0 0 0-.8.8v2.8a.8.8 0 0 0 1.6 0v-2.8a.8.8 0 0 0-.8-.8Z" />
    </svg>
  );
}

function DragHintIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M7 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

export function ProfilePhotoField({
  value,
  onChange,
  theme,
}: {
  value: File | null;
  onChange: (value: File | null) => void;
  theme: MembershipTheme;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const dropCounterRef = useRef(0);
  const cropViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [editorSource, setEditorSource] = useState<File | null>(null);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorZoom, setEditorZoom] = useState(AVATAR_DEFAULT_ZOOM);
  const [editorOffsetXPercent, setEditorOffsetXPercent] = useState(0);
  const [editorOffsetYPercent, setEditorOffsetYPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      setPreviewDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);

    const image = new Image();
    image.onload = () => {
      setPreviewDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  useEffect(() => {
    if (!editorSource) {
      setEditorUrl(null);
      setPreviewDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(editorSource);
    setEditorUrl(objectUrl);

    const image = new Image();
    image.onload = () => {
      setPreviewDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [editorSource]);

  useEffect(() => {
    if (!editorOpen || !isDragging) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!dragStateRef.current || !cropViewportRef.current) {
        return;
      }

      const width = cropViewportRef.current.clientWidth || 1;
      const height = cropViewportRef.current.clientHeight || 1;
      const deltaXPercent =
        ((event.clientX - dragStateRef.current.startX) / width) * 100;
      const deltaYPercent =
        ((event.clientY - dragStateRef.current.startY) / height) * 100;
      setEditorOffsetXPercent(
        clampAvatarOffset(
          dragStateRef.current.startOffsetX + deltaXPercent,
          -40,
          40,
        ),
      );
      setEditorOffsetYPercent(
        clampAvatarOffset(
          dragStateRef.current.startOffsetY + deltaYPercent,
          -40,
          40,
        ),
      );
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [editorOpen, isDragging]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function openEditor(file: File) {
    setEditorSource(file);
    setEditorZoom(AVATAR_DEFAULT_ZOOM);
    setEditorOffsetXPercent(0);
    setEditorOffsetYPercent(0);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (isSaving) {
      return;
    }

    setEditorOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function applyEditorChanges() {
    if (!editorSource) {
      return;
    }

    setIsSaving(true);

    try {
      if (!editorUrl || !previewDimensions) {
        return;
      }

      const croppedFile = await cropAvatarFile(
        editorSource,
        editorUrl,
        previewDimensions,
        editorZoom,
        (editorOffsetXPercent * AVATAR_VIEWPORT_SIZE) / 100,
        (editorOffsetYPercent * AVATAR_VIEWPORT_SIZE) / 100,
      );
      onChange(croppedFile);
      setEditorOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarClick() {
    if (value) {
      openEditor(value);
      return;
    }

    openFilePicker();
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    openEditor(file);
  }

  function openRemoveConfirm() {
    setIsRemoveConfirmOpen(true);
  }

  function closeRemoveConfirm() {
    setIsRemoveConfirmOpen(false);
  }

  function confirmAvatarRemove() {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsRemoveConfirmOpen(false);
  }

  function isImageFile(file: File | null) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function resetDropState() {
    dropCounterRef.current = 0;
    setIsDropActive(false);
  }

  function handleAvatarDragEnter(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current += 1;
    setIsDropActive(true);
  }

  function handleAvatarDragOver(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropActive(true);
  }

  function handleAvatarDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current = Math.max(0, dropCounterRef.current - 1);
    if (dropCounterRef.current === 0) {
      setIsDropActive(false);
    }
  }

  function handleAvatarDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    resetDropState();

    if (!isImageFile(file)) {
      return;
    }

    handleFileSelection(file);
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!cropViewportRef.current) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: editorOffsetXPercent,
      startOffsetY: editorOffsetYPercent,
    };
    setIsDragging(true);
  }

  return (
    <div className="relative isolate grid h-full w-full justify-items-center gap-4 p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-8 h-48 rounded-full bg-cyan-100/40 blur-3xl"
      />
      <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
        <div className="group relative mx-auto">
          <button
            type="button"
            onClick={handleAvatarClick}
            onDragEnter={handleAvatarDragEnter}
            onDragOver={handleAvatarDragOver}
            onDragLeave={handleAvatarDragLeave}
            onDrop={handleAvatarDrop}
            aria-label={value ? "Change profile photo" : "Choose profile photo"}
            title={value ? "Change profile photo" : "Choose profile photo"}
            className={`mx-auto flex aspect-square w-24 items-center justify-center overflow-hidden rounded-full border text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:opacity-95 sm:w-28 lg:w-32 ${isDropActive ? "scale-[1.01] ring-4 ring-cyan-200/70" : ""}`}
            style={{
              borderColor: theme.cardBorder,
              background: theme.tileBackground,
              color: theme.tileValueColor,
            }}
          >
            <div
              className={`flex h-full w-full items-center justify-center ${previewUrl ? "p-0" : "p-4"}`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected avatar preview"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="space-y-2">
                  <span
                    className="mx-auto flex items-center justify-center"
                    style={{
                      color: theme.tileLabelColor,
                    }}
                  >
                    <AvatarSilhouetteIcon className="h-12 w-12" />
                  </span>
                  <span
                    className="block text-[11px] uppercase tracking-[0.2em]"
                    style={{ color: theme.tileLabelColor }}
                  >
                    Click to select
                  </span>
                </div>
              )}
            </div>
          </button>

          {value ? (
            <button
              type="button"
              onClick={openRemoveConfirm}
              aria-label="Remove profile photo"
              title="Remove profile photo"
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-slate-700 opacity-0 transition duration-200 hover:scale-110 hover:text-rose-600 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>

        <p
          className="text-center text-sm font-semibold"
          style={{ color: theme.tileValueColor }}
        >
          Profile Photo / Avatar
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) =>
          handleFileSelection(event.target.files?.[0] ?? null)
        }
      />

      {editorOpen && editorUrl && editorSource
        ? createPortal(
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
                  <div
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: theme.level1 }}
                  >
                    Profile Photo
                  </div>
                  <h3
                    className="mt-1 text-2xl font-semibold"
                    style={{ color: theme.titleColor }}
                  >
                    Adjust Avatar Crop
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: theme.bodyColor }}
                  >
                    Choose the square area you want to use as your avatar before
                    saving.
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
                              ? previewDimensions.width *
                                Math.max(
                                  AVATAR_VIEWPORT_SIZE /
                                    previewDimensions.width,
                                  AVATAR_VIEWPORT_SIZE /
                                    previewDimensions.height,
                                ) *
                                editorZoom
                              : 0,
                            height: previewDimensions
                              ? previewDimensions.height *
                                Math.max(
                                  AVATAR_VIEWPORT_SIZE /
                                    previewDimensions.width,
                                  AVATAR_VIEWPORT_SIZE /
                                    previewDimensions.height,
                                ) *
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
                        <span style={{ color: theme.bodyColor }}>
                          {editorZoom.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min={AVATAR_MIN_ZOOM}
                        max={AVATAR_MAX_ZOOM}
                        step="0.01"
                        value={editorZoom}
                        onChange={(event) =>
                          setEditorZoom(Number(event.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                      style={{ color: theme.bodyColor }}
                    >
                      Drag the image inside the circle to choose what stays
                      visible in your avatar.
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
          )
        : null}

      {isRemoveConfirmOpen
        ? createPortal(
            <div className="fixed inset-0 z-10000 flex items-center justify-center px-4 py-6">
              <button
                type="button"
                aria-label="Close remove avatar dialog"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
                onClick={closeRemoveConfirm}
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
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: theme.titleColor }}
                    >
                      Remove profile photo?
                    </h3>
                    <p
                      className="text-sm leading-6"
                      style={{ color: theme.bodyColor }}
                    >
                      This will clear the selected avatar. You can add a new one
                      anytime.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeRemoveConfirm}
                      className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                      style={{
                        borderColor: theme.cardBorder,
                        color: theme.titleColor,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmAvatarRemove}
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
          )
        : null}
    </div>
  );
}
