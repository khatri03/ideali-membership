import type { ChangeEvent } from "react";
import { AvatarSilhouetteIcon, CameraIcon, type MembershipTheme } from "./MembershipRegisterWizard.shared";

export function getFieldBorderClass(showBorders: boolean) {
  return showBorders ? "border" : "";
}

export function buildDummyAvatarFile() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">',
    '<rect width="320" height="320" rx="160" fill="#0ea5e9"/>',
    '<circle cx="160" cy="120" r="52" fill="#ffffff" fill-opacity="0.96"/>',
    '<path d="M78 268c18-46 58-72 82-72s64 26 82 72" fill="#ffffff" fill-opacity="0.96"/>',
    '<text x="160" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">AV</text>',
    "</svg>",
  ].join("");

  return new File([svg], "dummy-avatar.svg", { type: "image/svg+xml" });
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
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  return (
    <div className="space-y-3 rounded-[2rem] border p-4" style={{ borderColor: theme.cardBorder, background: theme.cardBackground }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: theme.level3, color: theme.level1 }}
        >
          {value ? <CameraIcon className="h-5 w-5" /> : <AvatarSilhouetteIcon className="h-10 w-10" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: theme.tileValueColor }}>
            Profile photo
          </p>
          <p className="text-xs leading-5" style={{ color: theme.bodyColor }}>
            Add a member photo to personalize the registration record.
          </p>
        </div>
      </div>

      <label className="block">
        <input type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
        <span
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
          style={{ borderColor: theme.cardBorder, color: theme.titleColor, background: theme.level3 }}
        >
          Choose file
        </span>
      </label>

      {value ? (
        <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: theme.cardBorder, color: theme.titleColor }}>
          {value.name}
        </div>
      ) : null}
    </div>
  );
}

