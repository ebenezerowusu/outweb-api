/**
 * Order Document Interface
 * Represents a purchase transaction for a vehicle listing
 */
export interface OrderDocument {
  id: string;
  type: "order";

  // Parties
  buyerId: string;
  sellerId: string;

  // Vehicle Information
  listing: OrderListing;

  // Pricing
  pricing: OrderPricing;

  // Status and Timeline
  status: OrderStatus;
  timeline: OrderTimeline;

  // Delivery
  delivery: OrderDelivery | null;

  // Documents and Notes
  documents: OrderDocumentAttachment[];
  notes: OrderNote[];

  // Audit
  audit: OrderAudit;
}

/**
 * Listing information snapshot at time of order
 */
export interface OrderListing {
  listingId: string;
  title: string;
  vehicle: {
    vin: string;
    vinLastFour: string;
    make: string;
    model: string;
    year: number;
    trim: string | null;
    mileage: number;
    exteriorColor: string;
    interiorColor: string;
  };
}

/**
 * Order pricing details
 */
export interface OrderPricing {
  listPrice: number;
  agreedPrice: number;
  depositAmount: number;
  depositPaidAt: string | null;
  balanceAmount: number;
  balancePaidAt: string | null;
  taxAmount: number;
  feeAmount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Order status tracking
 */
export interface OrderStatus {
  state: OrderState;
  substatus: string | null;
  canceledBy: string | null;
  cancelReason: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
}

export type OrderState =
  | "pending_deposit" // Waiting for buyer deposit
  | "deposit_paid" // Deposit received, pending inspection
  | "inspection_scheduled" // Inspection arranged
  | "inspection_completed" // Inspection done, awaiting approval
  | "pending_payment" // Awaiting balance payment
  | "payment_completed" // Full payment received
  | "ready_for_delivery" // Vehicle ready for handover
  | "in_transit" // Vehicle being delivered
  | "delivered" // Vehicle delivered to buyer
  | "completed" // Order fully completed
  | "canceled" // Order canceled
  | "disputed"; // Dispute raised

/**
 * Order timeline events
 */
export interface OrderTimeline {
  createdAt: string;
  depositDueAt: string;
  inspectionScheduledAt: string | null;
  inspectionCompletedAt: string | null;
  paymentDueAt: string | null;
  deliveryScheduledAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  events: OrderEvent[];
}

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  description: string;
  performedBy: string | null;
  metadata: Record<string, any>;
  occurredAt: string;
}

export type OrderEventType =
  | "order_created"
  | "deposit_received"
  | "inspection_scheduled"
  | "inspection_approved"
  | "inspection_rejected"
  | "payment_received"
  | "delivery_scheduled"
  | "in_transit"
  | "delivered"
  | "completed"
  | "canceled"
  | "dispute_raised"
  | "dispute_resolved";

/**
 * Delivery information
 */
export interface OrderDelivery {
  method: DeliveryMethod;
  address: DeliveryAddress | null;
  scheduledDate: string | null;
  estimatedArrival: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  specialInstructions: string | null;
}

export type DeliveryMethod = "pickup" | "delivery" | "shipping";

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Order documents (contracts, inspection reports, etc.)
 */
export interface OrderDocumentAttachment {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Order notes for internal communication
 */
export interface OrderNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
}

/**
 * Audit information
 */
export interface OrderAudit {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

/**
 * Public Order (excludes sensitive information)
 */
export type PublicOrder = Omit<OrderDocument, "listing"> & {
  listing: Omit<OrderListing, "vehicle"> & {
    vehicle: Omit<OrderListing["vehicle"], "vin">;
  };
};

/**
 * Order Transaction Document Interface
 * Represents individual payment transactions within an order
 */
export interface OrderTransactionDocument {
  id: string;
  type: "order_transaction";

  // Order reference
  orderId: string;

  // Transaction details
  transaction: TransactionDetails;

  // Payment provider (Stripe, etc.)
  payment: PaymentDetails;

  // Status
  status: TransactionStatus;

  // Audit
  audit: TransactionAudit;
}

export interface TransactionDetails {
  transactionType: TransactionType;
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, any>;
}

export type TransactionType = "deposit" | "balance" | "refund" | "fee" | "tax";

export interface PaymentDetails {
  provider: "stripe" | "manual" | "other";
  paymentIntentId: string | null;
  chargeId: string | null;
  paymentMethodType: string | null;
  last4: string | null;
  receiptUrl: string | null;
}

export interface TransactionStatus {
  state: TransactionState;
  failureCode: string | null;
  failureMessage: string | null;
  processedAt: string | null;
}

export type TransactionState =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded";

export interface TransactionAudit {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Public Transaction
 */
export type PublicTransaction = OrderTransactionDocument;
