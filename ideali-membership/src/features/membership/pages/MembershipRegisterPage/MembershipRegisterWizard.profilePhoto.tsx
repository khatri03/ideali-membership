import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AvatarSilhouetteIcon, type MembershipTheme } from "./MembershipRegisterWizard.shared";
import {
  AVATAR_DEFAULT_ZOOM,
  clampAvatarOffset,
  cropAvatarFile,
  TrashIcon,
  AVATAR_VIEWPORT_SIZE,
} from "./MembershipRegisterWizard.helpers";
import { ProfilePhotoEditorDialog } from "./MembershipRegisterWizard.profilePhoto.editor";
import { ProfilePhotoRemoveConfirmDialog } from "./MembershipRegisterWizard.profilePhoto.remove-confirm";

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
  const dragStateRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);
  const dropCounterRef = useRef(0);
  const cropViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);
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
      const deltaXPercent = ((event.clientX - dragStateRef.current.startX) / width) * 100;
      const deltaYPercent = ((event.clientY - dragStateRef.current.startY) / height) * 100;
      setEditorOffsetXPercent(clampAvatarOffset(dragStateRef.current.startOffsetX + deltaXPercent, -40, 40));
      setEditorOffsetYPercent(clampAvatarOffset(dragStateRef.current.startOffsetY + deltaYPercent, -40, 40));
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
        editorOffsetXPercent * AVATAR_VIEWPORT_SIZE / 100,
        editorOffsetYPercent * AVATAR_VIEWPORT_SIZE / 100,
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

  function handleAvatarDragEnter(event: import("react").DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current += 1;
    setIsDropActive(true);
  }

  function handleAvatarDragOver(event: import("react").DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropActive(true);
  }

  function handleAvatarDragLeave(event: import("react").DragEvent<HTMLButtonElement>) {
    if (![...event.dataTransfer.types].includes("Files")) {
      return;
    }

    event.preventDefault();
    dropCounterRef.current = Math.max(0, dropCounterRef.current - 1);
    if (dropCounterRef.current === 0) {
      setIsDropActive(false);
    }
  }

  function handleAvatarDrop(event: import("react").DragEvent<HTMLButtonElement>) {
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
            <div className={`flex h-full w-full items-center justify-center ${previewUrl ? "p-0" : "p-4"}`}>
              {previewUrl ? (
                <img src={previewUrl} alt="Selected avatar preview" className="h-full w-full rounded-full object-cover" />
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
                  <span className="block text-[11px] uppercase tracking-[0.2em]" style={{ color: theme.tileLabelColor }}>
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

        <p className="text-center text-sm font-semibold" style={{ color: theme.tileValueColor }}>
          Profile Photo / Avatar
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
      />

      <ProfilePhotoEditorDialog
        isOpen={editorOpen}
        editorUrl={editorUrl}
        previewDimensions={previewDimensions}
        isDragging={isDragging}
        editorZoom={editorZoom}
        setEditorZoom={setEditorZoom}
        editorOffsetXPercent={editorOffsetXPercent}
        editorOffsetYPercent={editorOffsetYPercent}
        cropViewportRef={cropViewportRef}
        closeEditor={closeEditor}
        applyEditorChanges={applyEditorChanges}
        handleCropPointerDown={handleCropPointerDown}
        isSaving={isSaving}
        theme={theme}
      />

      <ProfilePhotoRemoveConfirmDialog
        isOpen={isRemoveConfirmOpen}
        closeRemoveConfirm={closeRemoveConfirm}
        confirmAvatarRemove={confirmAvatarRemove}
        theme={theme}
      />
    </div>
  );
}
