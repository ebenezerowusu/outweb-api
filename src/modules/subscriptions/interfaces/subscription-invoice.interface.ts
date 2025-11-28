/**
 * Subscription Invoice Interfaces
 * Defines the structure for subscription invoice records
 */

export interface AmountDetails {
  currency: string;
  total: number; // Total amount charged
  tax: number; // Tax amount
  net: number; // Net amount (total - tax)
}

export interface BillingPeriod {
  start: string; // ISO 8601 date
  end: string; // ISO 8601 date
}

export interface StripeInvoiceDetails {
  invoiceId: string; // Stripe invoice ID
  paymentIntentId: string; // Stripe payment intent ID
  chargeId: string; // Stripe charge ID
}

/**
 * Invoice Status Enum
 */
export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

/**
 * Subscription Invoice Document
 * Stored in subscriptionInvoices container
 */
export interface SubscriptionInvoiceDocument {
  id: string; // Unique invoice ID
  subscriptionId: string; // Links to subscription
  sellerId: string; // Partition key - seller who owns this invoice
  amount: AmountDetails;
  status: InvoiceStatus;
  paymentMethod: string; // e.g., "credit_card", "debit_card"
  transactionRef: string; // Unique transaction reference
  billingPeriod: BillingPeriod;
  stripe: StripeInvoiceDetails;
  idempotencyKey: string; // Prevents duplicate writes
  createdAt: string; // ISO 8601 date
}

/**
 * Public Subscription Invoice
 * Returned to clients via API
 */
export interface PublicSubscriptionInvoice {
  id: string;
  subscriptionId: string;
  sellerId: string;
  amount: {
    currency: string;
    total: number;
    tax: number;
    net: number;
    displayTotal: string; // Formatted amount (e.g., "$49.00")
  };
  status: string;
  paymentMethod: string;
  transactionRef: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  createdAt: string;
}

/**
 * Seller Invoice Stats
 * Aggregated statistics for a seller's invoices
 */
export interface SellerInvoiceStats {
  sellerId: string;
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  totalRefunded: number;
  totalRevenue: number; // Sum of all paid invoices
  currency: string;
}
