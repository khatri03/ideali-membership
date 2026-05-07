import { createPortal } from "react-dom";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { MembershipTypeListItem, MembershipTypeOrderListItem } from "../../../../types/membership";
import {
  OrderListSkeletonRow,
  SortableOrderItem,
  constrainOrderDragToParent,
} from "./MembershipTypesPage.order";
import {
  formatCurrencyAmount,
  getSetupStatePillTone,
  getSetupStatePillValue,
  getTenureDisplayLabel,
  getTenureExpiryCaseLabel,
  getTenureWindowLabel,
  renderTenureExpiryCaseLabel,
} from "./MembershipTypesPage.utils";
import { AvailabilityBadge, MembershipMetaPill } from "./MembershipTypesPage.display";
import { MembershipTypeActionsMenu } from "./MembershipTypesPage.actions";

export function OrderConfirmModal({
  onCancel,
  modalRef,
  isLoading,
  items,
  error,
  isSaving,
  onMoveItem,
  onSave,
}: {
  onCancel: () => void;
  modalRef: { current: HTMLDivElement | null };
  isLoading: boolean;
  items: MembershipTypeOrderListItem[];
  error: string;
  isSaving: boolean;
  onMoveItem: (sourceUniqueId: string, targetUniqueId: string) => void;
  onSave: () => Promise<void>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onMoveItem(String(active.id), String(over.id));
  }

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm" onClick={onCancel}>
      <div
        ref={modalRef}
        className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Change order</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Review the current sort order and drag items into place when the ordering action is connected.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Membership Title
          </div>

          <div className={["space-y-3 p-4", isSaving ? "pointer-events-none opacity-60" : ""].join(" ")}>
            {isLoading ? (
              <>
                <OrderListSkeletonRow />
                <OrderListSkeletonRow />
                <OrderListSkeletonRow />
              </>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
            ) : items.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[constrainOrderDragToParent]} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((item) => item.uniqueId)} strategy={verticalListSortingStrategy}>
                  {items.map((item) => (
                    <SortableOrderItem key={item.uniqueId} item={item} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                No membership types found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving || isLoading || items.length === 0 || !!error}
            className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}


export function MembershipTypeRow({
  item,
  onRefresh,
}: {
  item: MembershipTypeListItem;
  onRefresh: () => Promise<void>;
}) {
  const price = formatCurrencyAmount(item.membershipCharges, item.paymentCurrencyCode, item.paymentCurrencySymbol);
  const tenureWindowLabel = getTenureWindowLabel(item);
  const tenureDisplayLabel = getTenureDisplayLabel(item);
  const tenureExpiryCaseLabel = getTenureExpiryCaseLabel(item);

  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-16 border-r border-slate-200 px-4 py-4 align-middle">
        <MembershipTypeActionsMenu item={item} onRefresh={onRefresh} />
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <MembershipMetaPill
              value={getSetupStatePillValue(item.setupState)}
              tone={getSetupStatePillTone(item.setupState)}
            />
            <MembershipMetaPill value={item.paymentMerchant} />
            <MembershipMetaPill value={item.paymentCurrencyCode?.trim() || item.paymentCurrencySymbol?.trim() || null} />
          </div>
        </div>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 text-right align-middle">
        <p className="text-sm font-semibold tabular-nums text-slate-900">{price}</p>
      </td>
      <td className="border-r border-slate-200 px-4 py-4 align-middle">
        <AvailabilityBadge value={item.availableForSignUp} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-700">{tenureDisplayLabel}</p>
          {tenureExpiryCaseLabel ? (
            <p className="text-xs font-medium text-slate-500">{renderTenureExpiryCaseLabel(tenureExpiryCaseLabel)}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {tenureWindowLabel ? <MembershipMetaPill value={tenureWindowLabel} tone="warning" /> : null}
          </div>
        </div>
      </td>
    </tr>
  );
}



