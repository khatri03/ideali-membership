import { createPortal } from "react-dom";
import { type MembershipTheme } from "./MembershipRegisterWizard.shared";

export function ProfilePhotoRemoveConfirmDialog({
  isOpen,
  closeRemoveConfirm,
  confirmAvatarRemove,
  theme,
}: {
  isOpen: boolean;
  closeRemoveConfirm: () => void;
  confirmAvatarRemove: () => void;
  theme: MembershipTheme;
}) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
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
  );
}
