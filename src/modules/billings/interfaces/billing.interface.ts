/**
 * Billing Status Enum
 * 0 = pending, 1 = success, 2 = failed, 3 = canceled,
 * 4 = expired, 5 = refunded, 6 = chargeback, 7 = disputed
 */
export enum BillingStatus {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
  CANCELED = 3,
  EXPIRED = 4,
  REFUNDED = 5,
  CHARGEBACK = 6,
  DISPUTED = 7,
}

/**
 * Product Type for One-Time Payments
 */
export type ProductType =
  | "featured_listing"
  | "bump_listing"
  | "highlight_listing";

/**
 * Payment Gateway
 */
export type PaymentGateway = "stripe";

/**
 * Payment Mode
 */
export type PaymentMode = "payment" | "subscription";

/**
 * Billing Item
 */
export interface BillingItem {
  price: string; // Stripe price ID
  quantity: number;
  listingId: string;
}

/**
 * Bill Details
 */
export interface BillDetails {
  userId: string; // Auth0 user ID
  status: BillingStatus;
  items: BillingItem[];
}

/**
 * Refund Details
 */
export interface RefundDetails {
  provider: PaymentGateway;
  id: string; // Stripe refund ID
  amount: number; // Amount refunded in minor units
  reason?: string;
  createdAt: string;
}

/**
 * Billing Document (from Cosmos DB 'billings' container)
 * Partition Key: /id
 */
export interface BillingDocument {
  id: string;
  mode: PaymentMode;
  gateway: PaymentGateway;
  productType: ProductType;
  sellerId: string;
  listingId: string;
  currency: string; // ISO 4217 currency code (e.g., "USD")
  amount: number; // Amount in minor units (e.g., 1000 = $10.00)
  bill: BillDetails;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  returnUrl: string;
  cancelUrl: string;
  refund?: RefundDetails;
  metadata?: Record<string, any>;
  created: string; // ISO 8601
  updated: string; // ISO 8601
}

/**
 * Public Billing (what API returns)
 */
export type PublicBilling = BillingDocument;

/**
 * Billing Stats for Seller
 */
export interface SellerBillingStats {
  sellerId: string;
  currency: string;
  totalBillings: number;
  totalAmount: number;
  successfulAmount: number;
  failedAmount: number;
  refundedAmount: number;
  byStatus: Record<number, number>; // Status -> count
  byProductType: Record<ProductType, number>; // ProductType -> count
}
