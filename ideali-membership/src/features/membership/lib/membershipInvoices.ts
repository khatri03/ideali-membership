import { getJson } from "../../../lib/api";
import { formatUtcToLocalDateTime } from "../../../lib/dateTime";
import { readResponseData, readText, readNumber } from "../../../lib/parseUtils";
import type {
  MembershipInvoiceDetailContact,
  MembershipInvoiceDetailItem,
  MembershipInvoiceDetailLineItem,
  MembershipInvoiceDetailPayment,
  MembershipInvoiceDetailNote,
  MembershipInvoiceDetailContext,
  MembershipInvoiceListItem,
  MembershipInvoiceSortBy,
  MembershipInvoiceStatus,
} from "../types/invoice";
import type { PageResult } from "../types/membership";

function readNullableText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function readStatus(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "PendingPayment";
}

export function isMembershipInvoiceStatus(value: string): value is MembershipInvoiceStatus {
  return value === "PendingPayment"
    || value === "PartiallyPaid"
    || value === "Paid"
    || value === "Cancelled"
    || value === "Refund"
    || value === "AdjustedInSystem";
}

function buildQueryString(
  pageNo: number,
  pageSize: number,
  status?: MembershipInvoiceStatus[] | "All" | null,
  searchTerm?: string | null,
  sortBy?: MembershipInvoiceSortBy | null,
  sortOrder?: "asc" | "desc" | null,
  membershipTypeUniqueIds?: string[] | null,
) {
  const searchParams = new URLSearchParams({
    pageNo: String(pageNo),
    pageSize: String(pageSize),
  });

  if (Array.isArray(status) && status.length > 0) {
    status.forEach((item) => searchParams.append("status", item));
  }

  const normalizedSearchTerm = searchTerm?.trim();
  if (normalizedSearchTerm) {
    searchParams.set("searchTerm", normalizedSearchTerm);
  }

  if (sortBy) {
    searchParams.set("sortBy", sortBy);
  }

  if (sortOrder) {
    searchParams.set("sortOrder", sortOrder);
  }

  if (Array.isArray(membershipTypeUniqueIds)) {
    membershipTypeUniqueIds
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .forEach((membershipTypeUniqueId) => {
        searchParams.append("membershipTypeUniqueIds", membershipTypeUniqueId);
      });
  }

  return searchParams.toString();
}

function readContactAddress(value: unknown) {
  const record = readRecord(value);

  return {
    streetLine1: readNullableText(record?.StreetLine1 ?? record?.streetLine1),
    streetLine2: readNullableText(record?.StreetLine2 ?? record?.streetLine2),
    zipCode: readNullableText(record?.ZipCode ?? record?.zipCode),
    city: readNullableText(record?.City ?? record?.city),
    state: readNullableText(record?.State ?? record?.state),
    country: readNullableText(record?.Country ?? record?.country),
  };
}

function readContact(value: unknown): MembershipInvoiceDetailContact | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const lastName = readText(record.LastName ?? record.lastName);
  if (!lastName) {
    return null;
  }

  return {
    uniqueId: readNullableText(record.UniqueId ?? record.uniqueId),
    prefix: readNullableText(record.Prefix ?? record.prefix),
    firstName: readNullableText(record.FirstName ?? record.firstName),
    middleName: readNullableText(record.MiddleName ?? record.middleName),
    lastName,
    primaryEmail: readNullableText(record.PrimaryEmail ?? record.primaryEmail),
    secondaryEmail: readNullableText(record.SecondaryEmail ?? record.secondaryEmail),
    workEmail: readNullableText(record.WorkEmail ?? record.workEmail),
    cellPhone: readNullableText(record.CellPhone ?? record.cellPhone),
    homePhone: readNullableText(record.HomePhone ?? record.homePhone),
    workPhone: readNullableText(record.WorkPhone ?? record.workPhone),
    address: readContactAddress(record.Address ?? record.address),
  };
}

function readDetailContext(value: unknown): MembershipInvoiceDetailContext | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const uniqueId = readNullableText(record.UniqueId ?? record.uniqueId);
  const name = readText(record.Name ?? record.name);
  const module = readText(record.Module ?? record.module);

  if (!uniqueId || !name || !module) {
    return null;
  }

  return {
    module,
    uniqueId,
    memberUniqueId: readNullableText(record.MemberUniqueId ?? record.memberUniqueId),
    name,
    isMemberInvoice: Boolean(record.IsMemberInvoice ?? record.isMemberInvoice),
  };
}

function readLineItems(value: unknown): MembershipInvoiceDetailLineItem[] {
  return readList(value)
    .map((item): MembershipInvoiceDetailLineItem | null => {
      const record = readRecord(item);
      if (!record) {
        return null;
      }

      const taxCharges = readRecord(record.TaxCharges ?? record.taxCharges);
      const serviceCharges = readRecord(record.ServiceCharges ?? record.serviceCharges);

      return {
        description: readText(record.Description ?? record.description),
        unitPrice: readNumber(record.UnitPrice ?? record.unitPrice) ?? 0,
        quantity: Math.trunc(readNumber(record.Quantity ?? record.quantity) ?? 0),
        total: readNumber(record.Total ?? record.total) ?? 0,
        invoiceItemStatus: readText(record.InvoiceItemStatus ?? record.invoiceItemStatus),
        discountAmount: readNullableNumber(record.DiscountAmount ?? record.discountAmount),
        discountRate: readNullableNumber(record.DiscountRate ?? record.discountRate),
        taxCharges: {
          rate: readNullableNumber(taxCharges?.Rate ?? taxCharges?.rate),
          description: readNullableText(taxCharges?.Description ?? taxCharges?.description),
          amount: readNullableNumber(taxCharges?.Amount ?? taxCharges?.amount),
        },
        serviceCharges: {
          rate: readNullableNumber(serviceCharges?.Rate ?? serviceCharges?.rate),
          description: readNullableText(serviceCharges?.Description ?? serviceCharges?.description),
          amount: readNullableNumber(serviceCharges?.Amount ?? serviceCharges?.amount),
        },
        itemType: Math.trunc(readNumber(record.ItemType ?? record.itemType) ?? 0),
      };
    })
    .filter((item): item is MembershipInvoiceDetailLineItem => Boolean(item?.description));
}

function readNotes(value: unknown): MembershipInvoiceDetailNote[] {
  return readList(value)
    .map((item): MembershipInvoiceDetailNote | null => {
      const record = readRecord(item);
      if (!record) {
        return null;
      }

      return {
        note: readText(record.Note ?? record.note),
        createdBy: readText(record.CreatedBy ?? record.createdBy),
        createdOnUtc: readText(record.CreatedOnUtc ?? record.createdOnUtc),
      };
    })
    .filter((item): item is MembershipInvoiceDetailNote => Boolean(item?.note));
}

function readPayments(value: unknown): MembershipInvoiceDetailPayment[] {
  return readList(value)
    .map((item): MembershipInvoiceDetailPayment | null => {
      const record = readRecord(item);
      if (!record) {
        return null;
      }

      return {
        amount: readNumber(record.Amount ?? record.amount) ?? 0,
        paymentMethod: readText(record.PaymentMethod ?? record.paymentMethod),
        paymentStatus: readText(record.PaymentStatus ?? record.paymentStatus),
        referenceNo: readNullableText(record.ReferenceNo ?? record.referenceNo),
        note: readNullableText(record.Note ?? record.note),
        paymentDateUtc: readText(record.PaymentDateUtc ?? record.paymentDateUtc),
        createdBy: readText(record.CreatedBy ?? record.createdBy),
        createdOnUtc: readText(record.CreatedOnUtc ?? record.createdOnUtc),
      };
    })
    .filter((item): item is MembershipInvoiceDetailPayment => item !== null);
}

function buildCurrencySymbol(value: unknown) {
  const text = readText(value).trim().toUpperCase();
  return text === "CAD" ? "C$" : "$";
}

function buildInvoiceListItem(record: Record<string, unknown>): MembershipInvoiceListItem {
  return {
    invoiceId: readText(record.InvoiceId ?? record.invoiceId),
    invoiceNo: readText(record.InvoiceNo ?? record.invoiceNo),
    memberUniqueId: readNullableText(record.MemberUniqueId ?? record.memberUniqueId),
    memberName: readText(record.MemberName ?? record.memberName),
    memberEmail: readText(record.MemberEmail ?? record.memberEmail),
    membershipName: readText(record.MembershipName ?? record.membershipName),
    invoiceStatus: readStatus(record.InvoiceStatus ?? record.invoiceStatus) as MembershipInvoiceStatus,
    invoiceDateUtc: readText(record.InvoiceDateUtc ?? record.invoiceDateUtc),
    discountAmount: readNullableNumber(record.DiscountAmount ?? record.discountAmount),
    taxAmount: readNullableNumber(record.TaxAmount ?? record.taxAmount),
    serviceCharges: readNullableNumber(record.ServiceCharges ?? record.serviceCharges),
    totalAmount: readNumber(record.TotalAmount ?? record.totalAmount) ?? 0,
    balanceAmount: readNullableNumber(record.BalanceAmount ?? record.balanceAmount),
    currencySymbol: buildCurrencySymbol(record.CurrencySymbol ?? record.currencySymbol),
    lastActivityUtc: readNullableText(record.LastActivityUtc ?? record.lastActivityUtc),
    quickBooksInvoiceId: readNullableText(record.QuickBooksInvoiceId ?? record.quickBooksInvoiceId),
    quickBooksDocNumber: readNullableText(record.QuickBooksDocNumber ?? record.quickBooksDocNumber),
  };
}

function buildInvoiceDetailItem(record: Record<string, unknown>): MembershipInvoiceDetailItem {
  return {
    uniqueId: readText(record.UniqueId ?? record.uniqueId),
    invoiceNo: readText(record.InvoiceNo ?? record.invoiceNo),
    invoiceDate: readText(record.InvoiceDate ?? record.invoiceDate),
    invoiceAmount: readNumber(record.InvoiceAmount ?? record.invoiceAmount) ?? 0,
    invoiceStatus: readText(record.InvoiceStatus ?? record.invoiceStatus),
    invoiceType: readText(record.InvoiceType ?? record.invoiceType),
    balanceAmount: readNullableNumber(record.BalanceAmount ?? record.balanceAmount),
    taxAmount: readNullableNumber(record.TaxAmount ?? record.taxAmount),
    serviceCharges: readNullableNumber(record.ServiceCharges ?? record.serviceCharges),
    discountAmount: readNullableNumber(record.DiscountAmount ?? record.discountAmount),
    createdBy: readText(record.CreatedBy ?? record.createdBy),
    createdOnUtc: readText(record.CreatedOnUtc ?? record.createdOnUtc),
    updatedBy: readNullableText(record.UpdatedBy ?? record.updatedBy),
    updatedOnUtc: readNullableText(record.UpdatedOnUtc ?? record.updatedOnUtc),
    logoUrl: readNullableText(record.LogoUrl ?? record.logoUrl),
    invoiceContext: readDetailContext(record.InvoiceContext ?? record.invoiceContext),
    contact: readContact(record.Contact ?? record.contact),
    invoiceItems: readLineItems(record.InvoiceItems ?? record.invoiceItems),
    notes: readNotes(record.Notes ?? record.notes),
    payments: readPayments(record.Payments ?? record.payments),
  };
}

export function getMembershipInvoiceStatusTone(status: MembershipInvoiceStatus | string) {
  switch (status) {
    case "Paid":
      return "emerald";
    case "PartiallyPaid":
      return "cyan";
    case "PendingPayment":
      return "amber";
    case "Cancelled":
    case "Refund":
    case "AdjustedInSystem":
      return "rose";
    default:
      return "slate";
  }
}

export function getMembershipInvoiceStatusLabel(status: MembershipInvoiceStatus | string) {
  switch (status) {
    case "PendingPayment":
      return "Pending Payment";
    case "PartiallyPaid":
      return "Partially Paid";
    case "AdjustedInSystem":
      return "Adjusted in System";
    default:
      return status;
  }
}

export function formatMembershipInvoiceAmount(amount: number | null | undefined, currencySymbol = "$") {
  const safeAmount = Number.isFinite(amount ?? NaN) ? Number(amount) : 0;
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(safeAmount));

  return safeAmount < 0 ? `-${currencySymbol}${formattedAmount}` : `${currencySymbol}${formattedAmount}`;
}

export function formatMembershipInvoiceDateLabel(value: string | null | undefined) {
  return formatUtcToLocalDateTime(value ?? null, { timeZone: null, fallbackLabel: "Not available" });
}

export function formatMembershipInvoiceContactName(contact: MembershipInvoiceDetailContact | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(" ").trim() || "Not available";
}

export function formatMembershipInvoiceContactAddress(contact: MembershipInvoiceDetailContact | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  const parts = [
    contact.address.streetLine1,
    contact.address.streetLine2,
    [contact.address.city, contact.address.state, contact.address.zipCode].filter(Boolean).join(", "),
    contact.address.country,
  ]
    .filter((part): part is string => Boolean(part && part.trim().length > 0));

  return parts.length > 0 ? parts.join("\n") : "Not available";
}

export function formatMembershipInvoicePrimaryEmail(contact: MembershipInvoiceDetailContact | null | undefined) {
  if (!contact) {
    return "Not available";
  }

  return contact.primaryEmail || contact.secondaryEmail || contact.workEmail || "Not available";
}

export function getMembershipInvoicePaymentMethodLabel(detail: MembershipInvoiceDetailItem) {
  const latestPayment = [...detail.payments].sort((left, right) => right.paymentDateUtc.localeCompare(left.paymentDateUtc))[0];
  return latestPayment?.paymentMethod || "Not available";
}

export async function fetchMembershipInvoices(
  pageNo: number,
  pageSize: number,
  status?: MembershipInvoiceStatus[] | "All" | null,
  searchTerm?: string | null,
  sortBy?: MembershipInvoiceSortBy | null,
  sortOrder?: "asc" | "desc" | null,
  membershipTypeUniqueIds?: string[] | null,
) {
  const payload = await getJson<unknown>(
    `/api/invoice/membership/list?${buildQueryString(pageNo, pageSize, status, searchTerm, sortBy, sortOrder, membershipTypeUniqueIds)}`,
  );
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  const items = readList(responseData?.PageData ?? responseData?.pageData).map((item) => buildInvoiceListItem(item as Record<string, unknown>));

  const pageResult: PageResult<MembershipInvoiceListItem> = {
    pageNo: readNumber(responseData?.PageNo ?? responseData?.pageNo) ?? pageNo,
    pageSize: readNumber(responseData?.PageSize ?? responseData?.pageSize) ?? pageSize,
    pageCount: readNumber(responseData?.PageCount ?? responseData?.pageCount) ?? 0,
    totalRecordsCount: readNumber(responseData?.TotalRecordsCount ?? responseData?.totalRecordsCount) ?? items.length,
    pageData: items,
  };

  return pageResult;
}

export async function fetchMembershipInvoiceStatusOptions() {
  const payload = await getJson<unknown>("/api/invoice/membership/status-options");
  const responseData = readResponseData(payload);

  return readList(responseData).flatMap((item) => {
    const record = readRecord(item);
    if (!record) {
      return [];
    }

    const label = readText(record.Text ?? record.text);
    const value = readText(record.Value ?? record.value);

    if (!label || !isMembershipInvoiceStatus(value)) {
      return [];
    }

    return [{ label, value }];
  });
}

export async function fetchMembershipInvoiceDetail(invoiceUniqueId: string) {
  const payload = await getJson<unknown>(`/api/invoice/membership/${invoiceUniqueId}/detail`);
  const responseData = readResponseData(payload) as Record<string, unknown> | null;

  if (!responseData) {
    throw new Error("Unable to load invoice detail.");
  }

  return buildInvoiceDetailItem(responseData);
}
