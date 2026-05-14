import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { ReactNode } from "react";
import { useRef } from "react";
import type { MembershipTypePlaceholderGroup } from "../../../types/membership";

function ToolbarButton({
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

type PlaceholderTokenSelectionAttrs = {
  label?: string;
  fontSize?: string | null;
  color?: string | null;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

function getSelectedPlaceholderTokenAttrs(editor: Editor | null) {
  const selection = editor?.state.selection;
  if (!editor || !(selection instanceof NodeSelection)) {
    return null;
  }

  if (selection.node.type.name !== "membershipPlaceholderToken") {
    return null;
  }

  return selection.node.attrs as PlaceholderTokenSelectionAttrs;
}

function updateSelectedPlaceholderToken(editor: Editor | null, nextAttrs: Partial<PlaceholderTokenSelectionAttrs>) {
  if (!editor) {
    return false;
  }

  const attrs = getSelectedPlaceholderTokenAttrs(editor);
  if (!attrs) {
    return false;
  }

  editor.chain().focus().updateAttributes("membershipPlaceholderToken", { ...attrs, ...nextAttrs }).run();
  return true;
}

function toggleSelectedPlaceholderTokenAttr(
  editor: Editor | null,
  attrName: keyof Pick<PlaceholderTokenSelectionAttrs, "bold" | "italic" | "underline" | "strike">,
) {
  const attrs = getSelectedPlaceholderTokenAttrs(editor);
  if (!attrs) {
    return false;
  }

  updateSelectedPlaceholderToken(editor, { [attrName]: !attrs[attrName] } as Partial<PlaceholderTokenSelectionAttrs>);
  return true;
}

function isSelectedPlaceholderFormatted(
  editor: Editor | null,
  attrName: keyof Pick<PlaceholderTokenSelectionAttrs, "bold" | "italic" | "underline" | "strike">,
) {
  return Boolean(getSelectedPlaceholderTokenAttrs(editor)?.[attrName]);
}

function SelectField({
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

function getPlaceholderLabel(value: string) {
  return value
    .replace(/[{}]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ColorButton({
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

function Divider() {
  return <span className="mx-1 hidden h-9 w-px bg-slate-200 md:inline-block" aria-hidden="true" />;
}

function Section({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">{children}</div>;
}

function TwoLineTextIcon({
  align,
}: {
  align: "left" | "center" | "right" | "justify";
}) {
  const widthSets = {
    left: ["12", "9", "6"],
    center: ["10", "12", "8"],
    right: ["6", "9", "12"],
    justify: ["12", "12", "12"],
  } as const;

  const xOffsets = {
    left: ["4", "4", "4"],
    center: ["5", "4", "6"],
    right: ["10", "7", "4"],
    justify: ["4", "4", "4"],
  } as const;

  const widths = widthSets[align];
  const xOffsetsForAlign = xOffsets[align];

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <rect x={xOffsetsForAlign[0]} y="4" width={widths[0]} height="1.5" rx="0.75" />
      <rect x={xOffsetsForAlign[1]} y="8.5" width={widths[1]} height="1.5" rx="0.75" />
      <rect x={xOffsetsForAlign[2]} y="13" width={widths[2]} height="1.5" rx="0.75" />
    </svg>
  );
}

function BulletListIcon() {
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

function TextLinesIcon({
  align,
}: {
  align: "left" | "center" | "right" | "justify";
}) {
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

function NumberListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M4.1 4.2h1V8h.8v1H3.7V8h.8V5.3L3.7 5l.4-1ZM4 10.4h1.9c1 0 1.7.6 1.7 1.6 0 .6-.3 1.1-.8 1.3.6.2.9.8.9 1.5 0 1-.7 1.8-1.9 1.8H4v-1h1.8c.6 0 1-.3 1-.8 0-.4-.3-.7-.9-.7H4.9v-1h.8c.5 0 .8-.2.8-.6 0-.4-.3-.6-.8-.6H4v-1Zm6-5.3h6v1.4h-6V5.1Zm0 5h6v1.4h-6v-1.4Zm0 5h6v1.4h-6v-1.4Z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.2 5.4H4.9L3.7 9.1v5.5h4.1V9.1H6.1l.1-.5.8-3.2Zm8.9 0h-1.3l-1.2 3.7v5.5h4.1V9.1h-1.3l.1-.5.8-3.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8 12.5a1 1 0 0 1 0-1.4l2.6-2.6a1 1 0 1 1 1.4 1.4L9.4 12.5a1 1 0 0 1-1.4 0Zm-2-1.1A3.3 3.3 0 0 1 6 6.7l1.4-1.4A3.3 3.3 0 0 1 11 4.8a1 1 0 1 1-1.4 1.4 1.4 1.4 0 0 0-1.9 0L6.3 7a1.4 1.4 0 0 0 0 1.9 1 1 0 1 1-1.4 1.4ZM14 4.8a3.3 3.3 0 0 1 4.6 0 1 1 0 0 1-1.4 1.4 1.4 1.4 0 0 0-1.9 0L14 7.4a1.4 1.4 0 0 0 0 1.9 1 1 0 1 1-1.4 1.4 3.3 3.3 0 0 1 0-4.6l1.4-1.4Zm-8 10.4a3.3 3.3 0 0 1-4.6 0 1 1 0 1 1 1.4-1.4 1.4 1.4 0 0 0 1.9 0L6 12.4a1.4 1.4 0 0 0 0-1.9 1 1 0 0 1 1.4-1.4 3.3 3.3 0 0 1 0 4.6l-1.4 1.4Zm8-5.3a3.3 3.3 0 0 1 0 4.6l-1.4 1.4a3.3 3.3 0 0 1-4.6 0 1 1 0 1 1 1.4-1.4 1.4 1.4 0 0 0 1.9 0l1.4-1.4a1.4 1.4 0 0 0 0-1.9 1 1 0 1 1 1.4-1.4Z" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8.4 5 5 8.4l3.4 3.4V9.8h2.1a3.7 3.7 0 1 1 0 7.4H8.7a1 1 0 1 1 0-2h1.8a1.7 1.7 0 1 0 0-3.4H8.4v1.6L5 9.8 8.4 6.4V8h1.6a5.7 5.7 0 1 1 0 11.4H8.7a1 1 0 1 1 0-2h1.3a3.7 3.7 0 1 0 0-7.4H8.4V5Z" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M11.6 5 15 8.4l-3.4 3.4V9.8H9.5a3.7 3.7 0 1 0 0 7.4h1.8a1 1 0 1 0 0-2h-1.8a1.7 1.7 0 1 1 0-3.4h2.1v1.6L15 9.8 11.6 6.4V8H10a5.7 5.7 0 1 0 0 11.4h1.3a1 1 0 1 0 0-2H10a3.7 3.7 0 1 1 0-7.4h1.6V5Z" />
    </svg>
  );
}

function MenuIcon() {
  return <span className="text-[12px] font-semibold tracking-wide">▼</span>;
}

export function MembershipThankYouEmailToolbar({
  editor,
  onInsertVariable,
  placeholders,
}: {
  editor: Editor | null;
  onInsertVariable: (value: { label: string; token: string }) => void;
  placeholders: MembershipTypePlaceholderGroup[];
}) {
  const variableGroups = placeholders.map((group) => ({
    label: group.label,
    options: group.items.map((item) => ({
      label: item.displayText || getPlaceholderLabel(item.placeHolderText) || item.placeHolderText,
      value: item.placeHolderText,
    })),
  }));

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Section>
          <ToolbarButton editor={editor} label="Undo" onClick={() => editor?.chain().focus().undo().run()} compact icon={<UndoIcon />} />
          <ToolbarButton editor={editor} label="Redo" onClick={() => editor?.chain().focus().redo().run()} compact icon={<RedoIcon />} />
        </Section>

        <Section>
          <SelectField
            label="Font size"
            className="min-w-[6rem]"
            onChange={(value) => {
              if (!value || !editor) {
                return;
              }

              if (!updateSelectedPlaceholderToken(editor, { fontSize: value })) {
                editor.chain().focus().setMark("textStyle", { fontSize: value }).run();
              }
            }}
            options={[
              { label: "12px", value: "12px" },
              { label: "14px", value: "14px" },
              { label: "16px", value: "16px" },
              { label: "18px", value: "18px" },
              { label: "20px", value: "20px" },
              { label: "24px", value: "24px" },
            ]}
          />
          <SelectField
            label="Line height"
            className="min-w-[6rem]"
            onChange={(value) => {
              if (!value || !editor) {
                return;
              }

              editor
                .chain()
                .focus()
                .updateAttributes("paragraph", { lineHeight: value })
                .updateAttributes("heading", { lineHeight: value })
                .run();
            }}
            options={[
              { label: "1", value: "1" },
              { label: "1.15", value: "1.15" },
              { label: "1.5", value: "1.5" },
              { label: "1.75", value: "1.75" },
              { label: "2", value: "2" },
            ]}
          />
          <ColorButton
            editor={editor}
            onApplyColor={(value) => {
              if (!editor) {
                return;
              }

              if (!updateSelectedPlaceholderToken(editor, { color: value })) {
                editor.chain().focus().setColor(value).run();
              }
            }}
          />
          <SelectField
            label="Variable"
            className="min-w-[9rem]"
            onChange={(value) => {
              if (!value) {
                return;
              }

              const placeholder = placeholders
                .flatMap((group) => group.items)
                .find((item) => item.placeHolderText === value);

              onInsertVariable({
                label: placeholder?.displayText || getPlaceholderLabel(value) || value,
                token: value,
              });
            }}
            groups={variableGroups.length > 0 ? variableGroups : undefined}
            options={variableGroups.length > 0 ? undefined : [{ label: "No variables available", value: "", disabled: true }]}
          />
          <SelectField
            label="Button"
            className="min-w-[7.5rem]"
            onChange={(value) => {
              if (!value || !editor) {
                return;
              }

              editor
                .chain()
                .focus()
                .insertContent(
                  `<a href="#" style="display:inline-block;padding:12px 20px;border-radius:9999px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:600;">${value}</a>`,
                )
                .run();
            }}
            options={[
              { label: "Primary button", value: "Click here" },
              { label: "Secondary button", value: "Learn more" },
            ]}
          />
          <SelectField
            label="Snippets"
            className="min-w-[7.5rem]"
            onChange={(value) => {
              if (!value || !editor) {
                return;
              }

              editor.chain().focus().insertContent(value).run();
            }}
            options={[
              { label: "Divider", value: "<hr />" },
              { label: "Greeting", value: "<p>Hi there,</p>" },
              { label: "Closing", value: "<p>Best regards,</p>" },
            ]}
          />
        </Section>

        <Section>
          <ToolbarButton
            editor={editor}
            label="Bold"
            onClick={() => {
              if (!toggleSelectedPlaceholderTokenAttr(editor, "bold")) {
                editor?.chain().focus().toggleBold().run();
              }
            }}
            isActive={isSelectedPlaceholderFormatted(editor, "bold") || editor?.isActive("bold")}
            icon={<span className="text-sm font-bold">B</span>}
          />
          <ToolbarButton
            editor={editor}
            label="Italic"
            onClick={() => {
              if (!toggleSelectedPlaceholderTokenAttr(editor, "italic")) {
                editor?.chain().focus().toggleItalic().run();
              }
            }}
            isActive={isSelectedPlaceholderFormatted(editor, "italic") || editor?.isActive("italic")}
            icon={<span className="text-sm italic">I</span>}
          />
          <ToolbarButton
            editor={editor}
            label="Underline"
            onClick={() => {
              if (!toggleSelectedPlaceholderTokenAttr(editor, "underline")) {
                editor?.chain().focus().toggleUnderline().run();
              }
            }}
            isActive={isSelectedPlaceholderFormatted(editor, "underline") || editor?.isActive("underline")}
            icon={<span className="text-sm underline">U</span>}
          />
          <ToolbarButton
            editor={editor}
            label="Strike"
            onClick={() => {
              if (!toggleSelectedPlaceholderTokenAttr(editor, "strike")) {
                editor?.chain().focus().toggleStrike().run();
              }
            }}
            isActive={isSelectedPlaceholderFormatted(editor, "strike") || editor?.isActive("strike")}
            icon={<span className="text-sm line-through">S</span>}
          />
          <Divider />
          <ToolbarButton editor={editor} label="Align left" onClick={() => editor?.chain().focus().setTextAlign("left").run()} isActive={editor?.isActive({ textAlign: "left" })} icon={<TextLinesIcon align="left" />} />
          <ToolbarButton editor={editor} label="Align center" onClick={() => editor?.chain().focus().setTextAlign("center").run()} isActive={editor?.isActive({ textAlign: "center" })} icon={<TextLinesIcon align="center" />} />
          <ToolbarButton editor={editor} label="Align right" onClick={() => editor?.chain().focus().setTextAlign("right").run()} isActive={editor?.isActive({ textAlign: "right" })} icon={<TextLinesIcon align="right" />} />
          <ToolbarButton editor={editor} label="Justify" onClick={() => editor?.chain().focus().setTextAlign("justify").run()} isActive={editor?.isActive({ textAlign: "justify" })} icon={<TextLinesIcon align="justify" />} />
          <Divider />
          <ToolbarButton editor={editor} label="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive("bulletList")} icon={<BulletListIcon />} />
          <ToolbarButton editor={editor} label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive("orderedList")} icon={<NumberListIcon />} />
          <ToolbarButton editor={editor} label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive("blockquote")} icon={<QuoteIcon />} />
          <ToolbarButton
            editor={editor}
            label="Insert link"
            onClick={() => {
              if (!editor) {
                return;
              }

              const url = window.prompt("Enter link URL");
              if (!url) {
                return;
              }

              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
            isActive={editor?.isActive("link")}
            icon={<LinkIcon />}
          />
        </Section>
      </div>
    </div>
  );
}

