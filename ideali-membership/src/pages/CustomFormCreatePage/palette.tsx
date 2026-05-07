import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import type { CustomFormControl } from "../../types/customForms";
import { getControlIcon, getControlTooltip, toSentenceCase } from "./utils";

function ControlIcon({
  controlType,
  label,
}: {
  controlType: string;
  label: string;
}) {
  const Icon = getControlIcon(controlType);

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-700">
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{toSentenceCase(label)}</span>
    </div>
  );
}

export function ControlPaletteItem({
  control,
  count,
  onDoubleClick,
}: {
  control: CustomFormControl;
  count: number;
  onDoubleClick: (control: CustomFormControl) => void;
}) {
  const Icon = getControlIcon(control.controlType);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${control.id}`,
    data: {
      source: "palette",
      control,
    },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onDoubleClick={() => onDoubleClick(control)}
      title={getControlTooltip(control)}
      {...listeners}
      {...attributes}
      style={isDragging ? undefined : style}
      className={[
        "group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition",
        "cursor-pointer hover:cursor-pointer hover:border-cyan-300 hover:shadow-md select-none touch-none",
        isDragging ? "scale-[0.98] opacity-60 cursor-grabbing" : "",
      ].join(" ")}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-sm font-bold text-cyan-700 cursor-pointer hover:cursor-pointer select-none touch-none">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{control.name}</p>
      <span
        className={[
          "ml-auto inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
          count > 0 ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-400",
        ].join(" ")}
        title={`${count} field${count === 1 ? "" : "s"} on canvas`}
      >
        {count}
      </span>
    </button>
  );
}

export { ControlIcon };
