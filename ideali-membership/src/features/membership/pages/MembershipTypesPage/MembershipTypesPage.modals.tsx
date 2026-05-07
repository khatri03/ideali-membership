import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export function StatusChangeConfirmModal({
  membershipTypeName,
  targetStatusLabel,
  onCancel,
  onConfirm,
  modalRef,
}: {
  membershipTypeName: string;
  targetStatusLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  modalRef: { current: HTMLDivElement | null };
}) {
  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Info className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Confirm status change</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Membership type <span className="font-semibold text-slate-900">{membershipTypeName}</span> will be marked as{" "}
          <span className="font-semibold text-slate-900">{targetStatusLabel}</span>.
          Please confirm if you want to continue.
        </p>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
