import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { MEMBERSHIP_DESCRIPTION_CONTENT } from "./MembershipDescriptionStepPage.fields";

function BoldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h3.7a3.05 3.05 0 0 1 3.05 3.05c0 1.02-.51 1.94-1.32 2.48.95.57 1.57 1.61 1.57 2.76A3.71 3.71 0 0 1 10.79 15H7.5A1.5 1.5 0 0 1 6 13.5v-9Zm2 3.5h2.7c.58 0 1.05-.47 1.05-1.05S11.28 5.9 10.7 5.9H8V8Zm0 2.1v2.3h3.2c.78 0 1.4-.62 1.4-1.4 0-.78-.62-1.4-1.4-1.4H8Z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7 4.5A1.5 1.5 0 0 1 8.5 3h6a1 1 0 1 1 0 2H12.7l-2.8 10H12a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2h1.8l2.8-10H8.5A1.5 1.5 0 0 1 7 4.5Z" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M5 5.25A1.25 1.25 0 1 1 5 2.75a1.25 1.25 0 0 1 0 2.5Zm3 0h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2ZM5 11.25A1.25 1.25 0 1 1 5 8.75a1.25 1.25 0 0 1 0 2.5Zm3 0h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2ZM5 17.25A1.25 1.25 0 1 1 5 14.75a1.25 1.25 0 0 1 0 2.5Zm3 0h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2Z" />
    </svg>
  );
}

function NumberListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M5 3.5h1v1H5v1H4v-1H3v-1h1v-1h1v1Zm3 0h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2Zm-2 6h1.5V8.5H4.5V8H7v3H5.5v.5H7v1H4.5v-.5H6v-1H4.5V10Zm2 2h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2Zm-2 6h1.5v-1H4.5v-.5H7v3H5.5v.5H7v1H4.5v-.5H6v-1H4.5V18Zm2-2h9a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2Z" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8.2 5.1 5.9 7.4a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.4L10.2 5.1v4.4a5.5 5.5 0 1 1-5.5 5.5 1 1 0 1 1 2 0 3.5 3.5 0 1 0 3.5-3.5h-2V5.1Z" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M11.8 5.1V9.5h-2a3.5 3.5 0 1 0 3.5 3.5 1 1 0 1 1 2 0 5.5 5.5 0 1 1-5.5-5.5V3.7a1 1 0 0 1 1.7-.7l4 4a1 1 0 1 1-1.4 1.4L11.8 5.1Z" />
    </svg>
  );
}

function ToolbarButton({
  editor,
  label,
  onClick,
  isActive,
  icon,
}: {
  editor: Editor | null;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  icon: JSX.Element;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!editor}
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        isActive
          ? "border-cyan-200 bg-cyan-50 text-cyan-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

function MembershipDescriptionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-[min(24rem,92%)] animate-pulse rounded-full bg-slate-200" />
      <div className="h-12 rounded-[1.5rem] border border-slate-200 bg-slate-100 animate-pulse" />
      <div className="h-[18rem] rounded-[1.75rem] border border-slate-200 bg-slate-100 animate-pulse" />
    </div>
  );
}

export function MembershipDescriptionStepPageContent({
  editor,
  isLoading,
  isSaving,
}: {
  editor: Editor | null;
  isLoading: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="mt-8 max-w-4xl space-y-4">
      {isLoading ? (
        <MembershipDescriptionSkeleton />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
            <ToolbarButton
              editor={editor}
              label="Bold"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive("bold")}
              icon={<BoldIcon />}
            />
            <ToolbarButton
              editor={editor}
              label="Italic"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive("italic")}
              icon={<ItalicIcon />}
            />
            <ToolbarButton
              editor={editor}
              label="Bullet list"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive("bulletList")}
              icon={<BulletListIcon />}
            />
            <ToolbarButton
              editor={editor}
              label="Numbered list"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive("orderedList")}
              icon={<NumberListIcon />}
            />
            <ToolbarButton editor={editor} label="Undo" onClick={() => editor?.chain().focus().undo().run()} icon={<UndoIcon />} />
            <ToolbarButton editor={editor} label="Redo" onClick={() => editor?.chain().focus().redo().run()} icon={<RedoIcon />} />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            <EditorContent editor={editor} />
          </div>

          <p className="text-sm text-slate-500">{MEMBERSHIP_DESCRIPTION_CONTENT.helper}</p>
          {isSaving ? <p className="text-sm font-medium text-cyan-700">Saving description...</p> : null}
        </>
      )}
    </div>
  );
}

export function MembershipDescriptionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/50 text-[10px] font-bold">
          !
        </div>
        <div className="space-y-2">
          <p>{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
