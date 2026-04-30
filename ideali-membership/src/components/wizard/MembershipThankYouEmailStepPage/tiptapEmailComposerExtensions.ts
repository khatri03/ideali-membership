import { Extension, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { createElement, type MouseEvent } from "react";

function MembershipPlaceholderTokenNodeView({ node, selected, deleteNode }: NodeViewProps) {
  const label = node.attrs.label || node.attrs["data-placeholder-label"] || "";
  const styles = [
    node.attrs.fontSize ? `font-size: ${node.attrs.fontSize}` : "",
    node.attrs.color ? `color: ${node.attrs.color}` : "",
    node.attrs.bold ? "font-weight: 700" : "",
    node.attrs.italic ? "font-style: italic" : "",
    node.attrs.underline ? "text-decoration: underline" : "",
    node.attrs.strike ? "text-decoration: line-through" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const handleDeleteMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const trashIcon = createElement(
    "svg",
    {
      viewBox: "0 0 20 20",
      "aria-hidden": "true",
      className: "h-3 w-3 fill-current",
    },
    createElement("path", {
      d: "M7 3.8h6l.5 1.2H16v1.5h-1.1L14 16H6l-.9-9.5H4V5h2.5L7 3.8Zm1.2 3.7h1.3v6.2H8.2V7.5Zm2.3 0h1.3v6.2h-1.3V7.5Z",
    }),
  );

  return createElement(
    NodeViewWrapper,
    {
      as: "span",
      className: [
        "membership-placeholder-token inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs tracking-wide align-baseline transition-colors",
        selected
          ? "cursor-pointer border-cyan-300 bg-cyan-100 text-cyan-900 shadow-[0_0_0_3px_rgba(103,232,249,0.18)]"
          : "cursor-pointer border-cyan-200 bg-cyan-50 text-cyan-800",
      ].join(" "),
      "data-placeholder-label": label,
      contentEditable: false,
      style: styles || undefined,
      title: label,
    },
    createElement("span", null, label),
    createElement(
      "button",
      {
        type: "button",
        onMouseDown: handleDeleteMouseDown,
        onClick: deleteNode,
        className:
          "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-rose-600 transition hover:text-rose-700",
        "aria-label": `Delete ${label}`,
        title: `Delete ${label}`,
      },
      trashIcon,
    ),
  );
}

export const FontSizeExtension = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => (element as HTMLElement).style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

export const LineHeightExtension = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => (element as HTMLElement).style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }

              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
});

export const MembershipPlaceholderTokenExtension = Node.create({
  name: "membershipPlaceholderToken",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      label: {
        default: "",
        parseHTML: (element) =>
          (element as HTMLElement).getAttribute("data-placeholder-label") ||
          (element as HTMLElement).textContent ||
          "",
      },
      fontSize: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).style.fontSize || null,
      },
      color: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).style.color || null,
      },
      bold: {
        default: false,
        parseHTML: (element) => (element as HTMLElement).style.fontWeight === "700",
      },
      italic: {
        default: false,
        parseHTML: (element) => (element as HTMLElement).style.fontStyle === "italic",
      },
      underline: {
        default: false,
        parseHTML: (element) => (element as HTMLElement).style.textDecoration.includes("underline"),
      },
      strike: {
        default: false,
        parseHTML: (element) => (element as HTMLElement).style.textDecoration.includes("line-through"),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-placeholder-label]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.label || HTMLAttributes["data-placeholder-label"] || "";
    const styles = [
      HTMLAttributes.fontSize ? `font-size: ${HTMLAttributes.fontSize}` : "",
      HTMLAttributes.color ? `color: ${HTMLAttributes.color}` : "",
      HTMLAttributes.bold ? "font-weight: 700" : "",
      HTMLAttributes.italic ? "font-style: italic" : "",
      HTMLAttributes.underline ? "text-decoration: underline" : "",
      HTMLAttributes.strike ? "text-decoration: line-through" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      "span",
      {
        "data-placeholder-label": label,
        contenteditable: "false",
        class:
          "membership-placeholder-token inline-flex cursor-pointer items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs tracking-wide text-cyan-800 align-baseline transition-colors",
        title: label,
        style: styles || undefined,
      },
      label,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MembershipPlaceholderTokenNodeView);
  },
});
