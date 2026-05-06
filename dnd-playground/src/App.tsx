import { useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type GridCard = {
  id: string
  title: string
  spanClassName: string
}

const INITIAL_CARDS: GridCard[] = []

function shuffleCards(cards: GridCard[]) {
  const next = [...cards]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

const GRID_SPAN_CLASSES: Record<string, string> = {
  '1x1': 'col-span-12',
  '1x2': 'col-span-6',
  '1x3': 'col-span-4',
  '1x4': 'col-span-3',
}

function createControlCard(position: number, gridSize: string): GridCard {
  return {
    id: `control-${crypto.randomUUID()}`,
    title: `Control ${position + 1}`,
    spanClassName: GRID_SPAN_CLASSES[gridSize] ?? 'col-span-12',
  }
}

function CardView({ card, dragging = false }: { card: GridCard; dragging?: boolean }) {
  return (
    <div
      className={[
        'h-full w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm transition',
        dragging ? 'scale-[0.97] shadow-2xl shadow-slate-900/10' : 'hover:-translate-y-0.5 hover:shadow-md',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{card.title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Drag
        </span>
      </div>
    </div>
  )
}

function SortableCard({ card }: { card: GridCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={['w-full', isDragging ? 'opacity-40' : ''].join(' ')}
      {...attributes}
      {...listeners}
    >
      <div className="grid grid-cols-12 gap-4">
        <div className={card.spanClassName}>
          <CardView card={card} dragging={isDragging} />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastMovedId, setLastMovedId] = useState<string | null>(null)
  const [gridSize, setGridSize] = useState('1x3')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeId) ?? null,
    [activeId, cards],
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    setCards((current) => {
      const oldIndex = current.findIndex((card) => card.id === active.id)
      const newIndex = current.findIndex((card) => card.id === over.id)

      if (oldIndex < 0 || newIndex < 0) {
        return current
      }

      setLastMovedId(String(active.id))

      return arrayMove(current, oldIndex, newIndex)
    })
  }

  function handleShuffle() {
    setCards((current) => shuffleCards(current))
    setLastMovedId(null)
  }

  function handleReset() {
    setCards(INITIAL_CARDS)
    setActiveId(null)
    setLastMovedId(null)
  }

  function handleAddControl() {
    console.log({ gridSize })

    setCards((current) => {
      const nextCard = createControlCard(current.length, gridSize)
      return [...current, nextCard]
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_32%),radial-gradient(circle_at_85%_20%,_rgba(251,191,36,0.18),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef6fb_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[120rem] rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Playground</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">DnD Kit Lab</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Drag tiles across the grid, shuffle them into a new order, or use the keyboard to move items with
              `@dnd-kit`.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Shuffle
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-900 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              Reset
            </button>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              rectSortingStrategy
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
              KeyboardSensor
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sortable grid</p>
                <p className="mt-1 text-sm text-slate-500">Cards reflow automatically while you drag.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Grid
                  <select
                    value={gridSize}
                    onChange={(event) => setGridSize(event.target.value)}
                    className="bg-transparent text-sm font-semibold tracking-normal text-slate-900 outline-none"
                    aria-label="Grid size"
                  >
                    <option value="1x1">1x1</option>
                    <option value="1x2">1x2</option>
                    <option value="1x3">1x3</option>
                    <option value="1x4">1x4</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleAddControl}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                >
                  Add Control
                </button>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {cards.length} items
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Last move: {lastMovedId ?? 'none'}
                </span>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={cards.map((card) => card.id)} strategy={rectSortingStrategy}>
                <div className="space-y-4">
                  {cards.length === 0 ? (
                    <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
                      No sortable items yet. Use Add Control to build the board.
                    </div>
                  ) : (
                    cards.map((card) => <SortableCard key={card.id} card={card} />)
                  )}
                </div>
              </SortableContext>

              <DragOverlay>{activeCard ? <CardView card={activeCard} dragging /> : null}</DragOverlay>
            </DndContext>
          </div>
        </div>
      </section>
    </main>
  )
}
