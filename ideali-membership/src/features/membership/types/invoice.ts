export type MembershipInvoiceStatus =
  | "PendingPayment"
  | "PartiallyPaid"
  | "Paid"
  | "Cancelled"
  | "Refund"
  | "AdjustedInSystem";

export type MembershipInvoiceSortBy =
  | "invoiceNumber"
  | "memberName"
  | "membershipName"
  | "status"
  | "invoiceDateUtc"
  | "totalAmount"
  | "balanceAmount"
  | "lastActivityUtc";

export interface MembershipInvoiceListItem {
  invoiceId: string;
  invoiceNo: string;
  memberUniqueId: string | null;
  memberName: string;
  memberEmail: string;
  membershipName: string;
  invoiceStatus: MembershipInvoiceStatus;
  invoiceDateUtc: string;
  discountAmount: number | null;
  taxAmount: number | null;
  serviceCharges: number | null;
  totalAmount: number;
  balanceAmount: number | null;
  currencySymbol: string;
  lastActivityUtc: string | null;
  quickBooksInvoiceId: string | null;
  quickBooksDocNumber: string | null;
}

export interface MembershipInvoiceDetailContactAddress {
  streetLine1: string | null;
  streetLine2: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface MembershipInvoiceDetailContact {
  uniqueId: string | null;
  prefix: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  workEmail: string | null;
  cellPhone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  address: MembershipInvoiceDetailContactAddress;
}

export interface MembershipInvoiceDetailContext {
  module: string;
  uniqueId: string;
  memberUniqueId: string | null;
  name: string;
  isMemberInvoice: boolean;
}

export interface MembershipInvoiceDetailLineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
  invoiceItemStatus: string;
  discountAmount: number | null;
  discountRate: number | null;
  taxCharges: {
    rate: number | null;
    description: string | null;
    amount: number | null;
  };
  serviceCharges: {
    rate: number | null;
    description: string | null;
    amount: number | null;
  };
  itemType: number;
}

export interface MembershipInvoiceDetailNote {
  note: string;
  createdBy: string;
  createdOnUtc: string;
}

export interface MembershipInvoiceDetailPayment {
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  referenceNo: string | null;
  note: string | null;
  paymentDateUtc: string;
  createdBy: string;
  createdOnUtc: string;
}

export interface MembershipInvoiceDetailItem {
  uniqueId: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  invoiceStatus: string;
  invoiceType: string;
  balanceAmount: number | null;
  taxAmount: number | null;
  serviceCharges: number | null;
  discountAmount: number | null;
  createdBy: string;
  createdOnUtc: string;
  updatedBy: string | null;
  updatedOnUtc: string | null;
  logoUrl: string | null;
  invoiceContext: MembershipInvoiceDetailContext | null;
  contact: MembershipInvoiceDetailContact | null;
  invoiceItems: MembershipInvoiceDetailLineItem[];
  notes: MembershipInvoiceDetailNote[];
  payments: MembershipInvoiceDetailPayment[];
}
