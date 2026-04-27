import { Extension, Node } from "@tiptap/core";

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
          "inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs tracking-wide text-cyan-800 align-baseline",
        title: label,
        style: styles || undefined,
      },
      label,
    ];
  },
});
