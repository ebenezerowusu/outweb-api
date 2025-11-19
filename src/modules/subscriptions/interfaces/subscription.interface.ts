/**
 * Subscription Document Interface
 * Represents a dealer subscription in the system
 */
export interface SubscriptionDocument {
  id: string;
  type: 'subscription';
  userId: string;
  sellerId: string | null;
  plan: SubscriptionPlan;
  stripe: SubscriptionStripe;
  billing: SubscriptionBilling;
  status: SubscriptionStatus;
  features: SubscriptionFeatures;
  usage: SubscriptionUsage;
  audit: SubscriptionAudit;
}

/**
 * Subscription Plan
 */
export interface SubscriptionPlan {
  tier: 'basic' | 'pro' | 'enterprise';
  interval: 'monthly' | 'yearly';
  productId: string;
  priceId: string;
  amount: number;
  currency: string;
}

/**
 * Stripe Subscription Data
 */
export interface SubscriptionStripe {
  customerId: string;
  subscriptionId: string;
  checkoutSessionId: string | null;
  paymentMethodId: string | null;
  latestInvoiceId: string | null;
}

/**
 * Subscription Billing
 */
export interface SubscriptionBilling {
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt: string | null;
  canceledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  nextBillingDate: string | null;
}

/**
 * Subscription Status
 */
export interface SubscriptionStatus {
  state: SubscriptionState;
  paymentStatus: PaymentStatus;
  autoRenew: boolean;
  scheduledChanges: ScheduledChange | null;
}

/**
 * Subscription State
 */
export type SubscriptionState =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

/**
 * Payment Status
 */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

/**
 * Scheduled Change (for upgrades/downgrades)
 */
export interface ScheduledChange {
  newTier: 'basic' | 'pro' | 'enterprise';
  newInterval: 'monthly' | 'yearly';
  newPriceId: string;
  effectiveDate: string;
}

/**
 * Subscription Features (based on plan tier)
 */
export interface SubscriptionFeatures {
  maxListings: number;
  maxPhotosPerListing: number;
  maxVideosPerListing: number;
  featuredListings: number;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  multiLocation: boolean;
}

/**
 * Subscription Usage
 */
export interface SubscriptionUsage {
  currentListings: number;
  listingsThisPeriod: number;
  featuredListingsUsed: number;
}

/**
 * Subscription Audit Trail
 */
export interface SubscriptionAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Invoice Document Interface
 */
export interface InvoiceDocument {
  id: string;
  type: 'invoice';
  subscriptionId: string;
  userId: string;
  stripe: InvoiceStripe;
  invoice: InvoiceDetails;
  payment: InvoicePayment;
  audit: InvoiceAudit;
}

/**
 * Stripe Invoice Data
 */
export interface InvoiceStripe {
  invoiceId: string;
  invoiceNumber: string;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

/**
 * Invoice Details
 */
export interface InvoiceDetails {
  amount: number;
  amountDue: number;
  amountPaid: number;
  currency: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  lineItems: InvoiceLineItem[];
}

/**
 * Invoice Line Item
 */
export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
  priceId: string;
}

/**
 * Invoice Payment
 */
export interface InvoicePayment {
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  paidAt: string | null;
  attemptCount: number;
  nextAttempt: string | null;
}

/**
 * Invoice Audit Trail
 */
export interface InvoiceAudit {
  createdAt: string;
  updatedAt: string;
}

/**
 * Public Subscription (safe for API responses)
 */
export type PublicSubscription = SubscriptionDocument;

/**
 * Public Invoice (safe for API responses)
 */
export type PublicInvoice = InvoiceDocument;
