import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Box, HStack, Menu, Portal, Stack, Table, Text } from "@chakra-ui/react";
import { BadgeInfo, Check, ChevronRight, FileText, GripVertical, Info, Link2, UserPlus, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  APP_ROUTES,
  buildMembershipMembersPath,
  buildMembershipRegisterPath,
  buildMembershipWizardStepPath,
} from "../routes";
import { fetchActiveMemberCount, fetchPendingApprovalCount } from "../lib/membershipMembers";
import { saveMembershipReviewStep } from "../lib/membershipWizard";
import type { MembershipTypeListItem, MembershipTypeOrderListItem } from "../types/membership";
import {
  canCopyRegistrationLink,
  canShowMemberMenu,
  canShowStatusMenu,
  constrainOrderDragToParent,
  formatCurrencyAmount,
  getSetupStatePillTone,
  getSetupStatePillValue,
  getTenureDisplayLabel,
  getTenureExpiryCaseLabel,
  getTenureWindowLabel,
  showToast,
} from "./MembershipTypesPage.helpers";

export function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.586 3a2 2 0 0 1 2.828 0l.586.586a2 2 0 0 1 0 2.828l-8.95 8.95a2 2 0 0 1-.878.514l-3.18.795a1 1 0 0 1-1.212-1.212l.795-3.18a2 2 0 0 1 .515-.878zM12 4.586 4.332 12.254l-.456 1.823 1.823-.456L13.414 5.586z" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="m7.25 4.5 5.75 5.5-5.75 5.5a1 1 0 1 0 1.4 1.42l6.5-6.22a1 1 0 0 0 0-1.4l-6.5-6.22A1 1 0 1 0 7.25 4.5Z" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return <Check className="h-4 w-4" />;
}

function MenuCheckIcon() {
  return <Check className="h-4 w-4" />;
}

function StatusIcon() {
  return <BadgeInfo className="h-4 w-4" />;
}

function XBadgeIcon() {
  return <X className="h-4 w-4" />;
}

function readMembershipTypeUniqueId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record.value ?? record.Value ?? record.uniqueId ?? record.UniqueId;
    return typeof candidate === "string" ? candidate : "";
  }

  return "";
}

function CountCellSkeleton() {
  return (
    <span className="inline-flex min-w-14 items-center justify-center">
      <span className="h-5 w-10 animate-pulse rounded-full bg-slate-200/80" />
    </span>
  );
}

function InfoIcon() {
  return <Info className="h-5 w-5" />;
}

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

export function AvailabilityBadge({ value }: { value: boolean }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckBadgeIcon />
        Yes
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
      <XBadgeIcon />
      No
    </span>
  );
}

export function MembershipMetaPill({
  value,
  tone = "neutral",
}: {
  value: string | null | undefined;
  tone?: "neutral" | "success" | "warning";
}) {
  if (!value) {
    return null;
  }

  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses}`}>
      {value}
    </span>
  );
}

export function PendingApprovalCountCell({ membershipTypeUniqueId }: { membershipTypeUniqueId: unknown }) {
  const uniqueId = readMembershipTypeUniqueId(membershipTypeUniqueId);
  const pendingApprovalCountQuery = useQuery({
    queryKey: ["membership-pending-approval-count", uniqueId],
    queryFn: () => fetchPendingApprovalCount(uniqueId),
    staleTime: 60 * 1000,
    enabled: uniqueId.length > 0,
  });

  const pendingApprovalCount = pendingApprovalCountQuery.data ?? 0;

  if (pendingApprovalCountQuery.isLoading || pendingApprovalCountQuery.isFetching) {
    return <CountCellSkeleton />;
  }

  if (!uniqueId) {
    return <span className="inline-flex min-w-10 items-center justify-center text-sm font-semibold text-slate-400">-</span>;
  }

  if (pendingApprovalCount > 0) {
    return (
      <Link
        to={buildMembershipMembersPath({
          membershipStatuses: ["PendingApproval"],
          membershipTypeUniqueIds: [uniqueId],
        })}
        className="inline-flex min-w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
      >
        {pendingApprovalCount}
      </Link>
    );
  }

  return (
    <span className="inline-flex min-w-10 items-center justify-center text-sm font-semibold text-slate-400">
      No Pending Approvals
    </span>
  );
}

export function ActiveMemberCountCell({ membershipTypeUniqueId }: { membershipTypeUniqueId: unknown }) {
  const uniqueId = readMembershipTypeUniqueId(membershipTypeUniqueId);
  const activeMemberCountQuery = useQuery({
    queryKey: ["membership-active-member-count", uniqueId],
    queryFn: () => fetchActiveMemberCount(uniqueId),
    staleTime: 60 * 1000,
    enabled: uniqueId.length > 0,
  });

  const activeMemberCount = activeMemberCountQuery.data ?? 0;

  if (activeMemberCountQuery.isLoading || activeMemberCountQuery.isFetching) {
    return <CountCellSkeleton />;
  }

  if (!uniqueId) {
    return <span className="inline-flex min-w-10 items-center justify-center text-sm font-semibold text-slate-400">-</span>;
  }

  if (activeMemberCount > 0) {
    return (
      <Link
        to={buildMembershipMembersPath({
          membershipStatuses: ["Active"],
          membershipTypeUniqueIds: [uniqueId],
        })}
        className="inline-flex min-w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
      >
        {activeMemberCount}
      </Link>
    );
  }

  return (
    <span className="inline-flex min-w-10 items-center justify-center text-sm font-semibold text-slate-400">
      No Active Members
    </span>
  );
}

export function renderTenureExpiryCaseLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const renewalPrefix = "Renewal due on ";
  if (label.startsWith(renewalPrefix)) {
    return (
      <>
        {renewalPrefix}
        <span className="font-semibold text-slate-700">{label.slice(renewalPrefix.length)}</span>
      </>
    );
  }

  return label;
}

export function InlineSeparator() {
  return <span className="text-slate-300">|</span>;
}

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
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : items.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[constrainOrderDragToParent]}
                onDragEnd={handleDragEnd}
              >
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

export function StatusChangeConfirmModal({
  membershipTypeName,
  targetStatusLabel,
  onCancel,
  onConfirm,
  modalRef,
}: {
  membershipTypeName: string;
  targetStatusLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  modalRef: { current: HTMLDivElement | null };
}) {
  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <InfoIcon />
        </div>

        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Confirm status change</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Membership type <span className="font-semibold text-slate-900">{membershipTypeName}</span> will be marked as{" "}
          <span className="font-semibold text-slate-900">{targetStatusLabel}</span>.
          Please confirm if you want to continue.
        </p>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MembershipTypeActionsMenu({
  item,
  onRefresh,
}: {
  item: MembershipTypeListItem;
  onRefresh: () => Promise<void>;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);

  async function handleCopyRegistrationLink() {
    const registrationUrl = `${window.location.origin}${buildMembershipRegisterPath(item.value)}`;

    try {
      await navigator.clipboard.writeText(registrationUrl);
      showToast("Registration link copied to clipboard.");
    } catch {
      showToast("Unable to copy the registration link.");
    }
  }

  async function handleStatusChange(availableForSignUp: boolean) {
    setIsNavigating(true);

    try {
      await saveMembershipReviewStep({ availableForSignUp }, 11, item.value);
      await onRefresh();
    } finally {
      setIsNavigating(false);
    }
  }

  function requestStatusChange(availableForSignUp: boolean) {
    setPendingStatus(availableForSignUp);
  }

  function confirmStatusChange() {
    if (pendingStatus === null) {
      return;
    }

    void handleStatusChange(pendingStatus);
  }

  return (
    <Menu.Root positioning={{ placement: "bottom-start", gutter: 8 }}>
      <Menu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label={`Open actions for ${item.text}`}
        >
          <DotsIcon />
        </button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW="13rem"
            rounded="xl"
            borderWidth="1px"
            borderColor="slate.200"
            bg="white"
            p="1.5"
            shadow="xl"
          >
            <Menu.Item
              value={`edit-${item.value}`}
              rounded="lg"
              px="3"
              py="2.5"
              color="slate.700"
              _highlighted={{ bg: "slate.50", color: "slate.950" }}
              asChild
            >
              <Link to={buildMembershipWizardStepPath(APP_ROUTES.membershipWizardResume, item.value)}>
                <HStack gap="2.5">
                  <EditIcon />
                  <Text fontSize="sm" fontWeight="medium">Edit</Text>
                </HStack>
              </Link>
            </Menu.Item>

            {canShowMemberMenu(item.setupState) ? (
              <Menu.Root positioning={{ placement: "right-start", gutter: 6 }}>
                <Menu.TriggerItem
                  value={`member-${item.value}`}
                  rounded="lg"
                  px="3"
                  py="2.5"
                  color="slate.700"
                  _highlighted={{ bg: "slate.50", color: "slate.950" }}
                >
                  <HStack w="full" justify="space-between">
                    <HStack gap="2.5">
                      <Users size={15} />
                      <Text fontSize="sm" fontWeight="medium">Member</Text>
                    </HStack>
                    <ChevronRight size={14} />
                  </HStack>
                </Menu.TriggerItem>

                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      minW="14rem"
                      rounded="xl"
                      borderWidth="1px"
                      borderColor="slate.200"
                      bg="white"
                      p="1.5"
                      shadow="xl"
                    >
                      <Menu.Item
                        value={`members-active-${item.value}`}
                        rounded="lg"
                        px="3"
                        py="2.5"
                        color="slate.700"
                        _highlighted={{ bg: "slate.50", color: "slate.950" }}
                        asChild
                      >
                        <Link
                          to={buildMembershipMembersPath({
                            membershipStatuses: ["Active"],
                            membershipTypeUniqueIds: [item.value],
                          })}
                        >
                          <HStack gap="2.5">
                            <Users size={15} />
                            <Text fontSize="sm" fontWeight="medium">Active Members</Text>
                          </HStack>
                        </Link>
                      </Menu.Item>

                      <Menu.Item
                        value={`copy-signup-${item.value}`}
                        rounded="lg"
                        px="3"
                        py="2.5"
                        color="slate.700"
                        _highlighted={{ bg: "slate.50", color: "slate.950" }}
                        onSelect={() => {
                          void handleCopyRegistrationLink();
                        }}
                      >
                        <HStack gap="2.5">
                          <Link2 size={15} />
                          <Text fontSize="sm" fontWeight="medium">Copy Sign-Up Link</Text>
                        </HStack>
                      </Menu.Item>

                      <Menu.Separator my="1.5" borderColor="slate.200" />

                      <Menu.Item
                        value={`add-member-${item.value}`}
                        rounded="lg"
                        px="3"
                        py="2.5"
                        color={canCopyRegistrationLink(item) ? "slate.700" : "slate.400"}
                        disabled={!canCopyRegistrationLink(item)}
                        _highlighted={{ bg: "slate.50", color: "slate.950" }}
                        asChild={canCopyRegistrationLink(item)}
                      >
                        {canCopyRegistrationLink(item) ? (
                          <Link to={buildMembershipRegisterPath(item.value)} target="_blank" rel="noreferrer">
                            <HStack gap="2.5">
                              <UserPlus size={15} />
                              <Text fontSize="sm" fontWeight="medium">Add</Text>
                            </HStack>
                          </Link>
                        ) : (
                          <HStack gap="2.5">
                            <UserPlus size={15} />
                            <Text fontSize="sm" fontWeight="medium">Add</Text>
                          </HStack>
                        )}
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            ) : null}

            {canShowStatusMenu(item.setupState) ? (
              <>
                <Menu.Separator my="1.5" borderColor="slate.200" />
                <Menu.Root positioning={{ placement: "right-start", gutter: 6 }}>
                  <Menu.TriggerItem
                    value={`status-${item.value}`}
                    rounded="lg"
                    px="3"
                    py="2.5"
                    color="slate.700"
                    _highlighted={{ bg: "slate.50", color: "slate.950" }}
                  >
                    <HStack w="full" justify="space-between">
                      <HStack gap="2.5">
                        <StatusIcon />
                        <Text fontSize="sm" fontWeight="medium">Status</Text>
                      </HStack>
                      <ChevronRight size={14} />
                    </HStack>
                  </Menu.TriggerItem>

                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        minW="11rem"
                        rounded="xl"
                        borderWidth="1px"
                        borderColor="slate.200"
                        bg="white"
                        p="1.5"
                        shadow="xl"
                      >
                        <Menu.Item
                          value={`status-online-${item.value}`}
                          rounded="lg"
                          px="3"
                          py="2.5"
                          color="slate.700"
                          disabled={isNavigating}
                          _highlighted={{ bg: "slate.50", color: "slate.950" }}
                          onSelect={() => requestStatusChange(true)}
                        >
                          <HStack gap="2.5">
                            <Box color={item.availableForSignUp ? "emerald.600" : "transparent"}>
                              <MenuCheckIcon />
                            </Box>
                            <Text fontSize="sm" fontWeight="medium">Online</Text>
                          </HStack>
                        </Menu.Item>

                        <Menu.Item
                          value={`status-offline-${item.value}`}
                          rounded="lg"
                          px="3"
                          py="2.5"
                          color="slate.700"
                          disabled={isNavigating}
                          _highlighted={{ bg: "slate.50", color: "slate.950" }}
                          onSelect={() => requestStatusChange(false)}
                        >
                          <HStack gap="2.5">
                            <Box color={!item.availableForSignUp ? "slate.500" : "transparent"}>
                              <MenuCheckIcon />
                            </Box>
                            <Text fontSize="sm" fontWeight="medium">Offline</Text>
                          </HStack>
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>

      {pendingStatus !== null ? (
        <StatusChangeConfirmModal
          membershipTypeName={item.text}
          targetStatusLabel={pendingStatus ? "Online" : "Offline"}
          onCancel={() => setPendingStatus(null)}
          onConfirm={confirmStatusChange}
          modalRef={confirmModalRef}
        />
      ) : null}
    </Menu.Root>
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
    <Table.Row
      borderBottomWidth="1px"
      borderColor="slate.200"
      bg="white"
      _even={{ bg: "slate.50" }}
      _hover={{ bg: "cyan.50" }}
      _last={{ borderBottomWidth: 0 }}
    >
      <Table.Cell w="18" px={5} py={6} verticalAlign="middle">
        <MembershipTypeActionsMenu item={item} onRefresh={onRefresh} />
      </Table.Cell>
      <Table.Cell px={5} py={6} verticalAlign="middle">
        <Stack gap={2} align="start">
          <Text fontSize="md" fontWeight="semibold" color="slate.950" lineHeight="1.2">
            {item.text}
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Badge rounded="full" px={3} py={1} bg="cyan.50" color="cyan.800" fontSize="xs" fontWeight="semibold">
              {getSetupStatePillValue(item.setupState)}
            </Badge>
            <MembershipMetaPill value={item.paymentMerchant} />
            <MembershipMetaPill value={item.paymentCurrencyCode?.trim() || item.paymentCurrencySymbol?.trim() || null} />
          </HStack>
        </Stack>
      </Table.Cell>
      <Table.Cell px={5} py={6} verticalAlign="middle" textAlign="right">
        <Stack gap={1} align="end">
          <Text fontSize="md" fontWeight="semibold" color="slate.950">
            {price}
          </Text>
        </Stack>
      </Table.Cell>
      <Table.Cell px={5} py={6} verticalAlign="middle" textAlign="center">
        <Box display="flex" justifyContent="center">
          <ActiveMemberCountCell membershipTypeUniqueId={item.value} />
        </Box>
      </Table.Cell>
      <Table.Cell px={5} py={6} verticalAlign="middle" textAlign="center">
        <Box display="flex" justifyContent="center">
          <PendingApprovalCountCell membershipTypeUniqueId={item.value} />
        </Box>
      </Table.Cell>
      <Table.Cell px={5} py={6} verticalAlign="middle">
        <Stack gap={1.5}>
          <Text fontSize="sm" fontWeight="semibold" color="slate.800">
            {tenureDisplayLabel}
          </Text>
          {tenureExpiryCaseLabel ? <Text fontSize="xs" color="slate.500">{renderTenureExpiryCaseLabel(tenureExpiryCaseLabel)}</Text> : null}
          {tenureWindowLabel ? (
            <Badge rounded="full" px={3} py={1} bg="amber.50" color="amber.700" fontSize="xs" fontWeight="semibold" alignSelf="flex-start">
              {tenureWindowLabel}
            </Badge>
          ) : null}
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
}
