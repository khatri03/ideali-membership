import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Link2, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { APP_ROUTES, buildMembershipRegisterPath, buildMembershipWizardStepPath } from "../../../../app/routes";
import { getMembershipTypeOrderList, getMembershipWizardProgress, getMembershipTypes, saveMembershipReviewStep, saveMembershipTypeOrderList } from "../../../../services/membershipWizard";
import { MEMBERSHIP_WIZARD_STEPS } from "../../wizard/membershipWizardSteps";
import type { MembershipTypeListItem, MembershipTypeOrderListItem } from "../../../../types/membership";
import { AvailabilityBadge, MembershipMetaPill } from "./MembershipTypesPage.display";
import { formatCurrencyAmount, getSetupStatePillTone, getSetupStatePillValue, getTenureDisplayLabel, getTenureExpiryCaseLabel, getTenureWindowLabel, renderTenureExpiryCaseLabel } from "./MembershipTypesPage.utils";
import { OrderConfirmModal, MembershipTypeRow } from "./MembershipTypesPage.components";
import { showToast } from "./MembershipTypesPage.utils";



export function MembershipTypesPage() {
  const [types, setTypes] = useState<MembershipTypeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderModalLoading, setIsOrderModalLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderItems, setOrderItems] = useState<MembershipTypeOrderListItem[]>([]);
  const [orderError, setOrderError] = useState("");
  const orderModalRef = useRef<HTMLDivElement>(null);

  const loadTypes = useCallback(async () => {
    setIsLoading(true);

    try {
      const items = await getMembershipTypes();
      setTypes(items);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load membership types.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openOrderModal = useCallback(() => {
    setIsOrderModalOpen(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
  }, []);

  const moveOrderItem = useCallback((sourceUniqueId: string, targetUniqueId: string) => {
    setOrderItems((currentItems) => {
      const sourceIndex = currentItems.findIndex((item) => item.uniqueId === sourceUniqueId);
      const targetIndex = currentItems.findIndex((item) => item.uniqueId === targetUniqueId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentItems;
      }

      return arrayMove(currentItems, sourceIndex, targetIndex);
    });
  }, []);

  const saveOrder = useCallback(async () => {
    if (orderItems.length === 0) {
      return;
    }

    setIsSavingOrder(true);

    try {
      await saveMembershipTypeOrderList(orderItems.map((item) => item.uniqueId));
      await loadTypes();
      showToast("Membership order saved successfully.");
      setIsOrderModalOpen(false);
    } finally {
      setIsSavingOrder(false);
    }
  }, [loadTypes, orderItems]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    if (!isOrderModalOpen) {
      return;
    }

    let isMounted = true;

    async function loadOrderItems() {
      setIsOrderModalLoading(true);
      setOrderError("");

      try {
        const items = await getMembershipTypeOrderList();
        if (isMounted) {
          setOrderItems(items);
        }
      } catch (loadOrderError) {
        if (isMounted) {
          setOrderError(loadOrderError instanceof Error ? loadOrderError.message : "Unable to load membership order.");
        }
      } finally {
        if (isMounted) {
          setIsOrderModalLoading(false);
        }
      }
    }

    void loadOrderItems();

    return () => {
      isMounted = false;
    };
  }, [isOrderModalOpen]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Types</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Membership types will be managed here.
          </p>
        </div>

        <Link
          to={APP_ROUTES.membershipWizardTitle}
          className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          Create
        </Link>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={openOrderModal}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Change order"
          title="Change order"
        >
          <ArrowUpDown className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            Loading membership types...
          </div>
        ) : error ? (
          <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : types.length > 0 ? (
          <div className="overflow-visible rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th scope="col" className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Membership Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Pricing
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Signup
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Tenure
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {types.map((item) => (
                    <MembershipTypeRow key={item.value} item={item} onRefresh={loadTypes} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No membership types found.
          </div>
        )}
      </div>
      {isOrderModalOpen ? (
        <OrderConfirmModal
          onCancel={closeOrderModal}
          modalRef={orderModalRef}
          isLoading={isOrderModalLoading}
          items={orderItems}
          error={orderError}
          isSaving={isSavingOrder}
          onMoveItem={moveOrderItem}
          onSave={saveOrder}
        />
      ) : null}
    </section>
  );
}



