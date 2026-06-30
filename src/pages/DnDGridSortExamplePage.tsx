import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type GridCard = {
  id: string;
  title: string;
  subtitle: string;
  tone: "cyan" | "amber" | "rose" | "emerald" | "indigo" | "violet";
};

const INITIAL_CARDS: GridCard[] = [
  { id: "a", title: "Alpha", subtitle: "Primary tile", tone: "cyan" },
  { id: "b", title: "Beta", subtitle: "Secondary tile", tone: "amber" },
  { id: "c", title: "Gamma", subtitle: "Attention tile", tone: "rose" },
  { id: "d", title: "Delta", subtitle: "Success tile", tone: "emerald" },
  { id: "e", title: "Epsilon", subtitle: "System tile", tone: "indigo" },
  { id: "f", title: "Zeta", subtitle: "Support tile", tone: "violet" },
];

const TONE_CLASSES: Record<GridCard["tone"], string> = {
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  violet: "border-violet-200 bg-violet-50 text-violet-800",
};

function GridCardView({ card, dragging = false }: { card: GridCard; dragging?: boolean }) {
  return (
    <div
      className={[
        "h-full rounded-[1.75rem] border p-4 shadow-sm transition",
        TONE_CLASSES[card.tone],
        dragging ? "scale-[0.97] shadow-2xl shadow-slate-900/10" : "hover:-translate-y-0.5 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">Grid item</p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{card.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{card.subtitle}</p>
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">
            Drag
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="h-2 rounded-full bg-white/70" />
          <div className="h-2 rounded-full bg-white/50" />
          <div className="h-2 rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
}

function SortableGridCard({ card }: { card: GridCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
    >
      <GridCardView card={card} dragging={isDragging} />
    </div>
  );
}

export function DnDGridSortExamplePage() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const activeCard = useMemo(() => cards.find((card) => card.id === activeId) ?? null, [activeId, cards]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setCards((current) => {
      const oldIndex = current.findIndex((card) => card.id === active.id);
      const newIndex = current.findIndex((card) => card.id === over.id);

      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6fb_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Playground</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">DnD Grid Sort Example</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Drag tiles across the grid to see `@dnd-kit` handle live sorting in a responsive card layout.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">rectSortingStrategy</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Overlay</span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">Responsive</span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sortable grid</p>
                <p className="mt-1 text-sm text-slate-500">Cards reflow automatically while you drag.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {cards.length} items
              </span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={cards.map((card) => card.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cards.map((card) => (
                    <SortableGridCard key={card.id} card={card} />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeCard ? <GridCardView card={activeCard} dragging /> : null}
              </DragOverlay>
            </DndContext>
          </div>

          <div className="space-y-8 px-1 sm:px-2 lg:px-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Try this</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>• Drag a tile to another spot in the grid.</li>
                <li>• Watch the other tiles animate into place.</li>
                <li>• Resize the viewport to see the grid collapse responsively.</li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Implementation</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This example uses `rectSortingStrategy`, which is a good fit for drag-sort grids where items can
                move in both rows and columns.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
