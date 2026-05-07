import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import type { Modifier } from "@dnd-kit/core";
import type { MembershipTypeOrderListItem } from "../../types/membership";

export const constrainOrderDragToParent: Modifier = ({ activeNodeRect, containerNodeRect, transform }) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  const minX = containerNodeRect.left - activeNodeRect.left;
  const maxX = containerNodeRect.right - activeNodeRect.right;
  const minY = containerNodeRect.top - activeNodeRect.top;
  const maxY = containerNodeRect.bottom - activeNodeRect.bottom;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
};

export function OrderListSkeletonRow() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="block h-3 w-20 rounded-full bg-slate-200/80 animate-pulse" />
      <span className="mt-2 block h-4 w-40 max-w-full rounded-full bg-slate-200/80 animate-pulse" />
    </div>
  );
}

export function SortableOrderItem({ item }: { item: MembershipTypeOrderListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uniqueId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 shadow-sm",
        isDragging ? "border-cyan-300 bg-cyan-50/70 opacity-80 shadow-lg" : "border-slate-200",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
      <button
        type="button"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 active:cursor-grabbing"
        aria-label={`Drag ${item.name} to sort`}
        title="Drag to sort"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </div>
  );
}
