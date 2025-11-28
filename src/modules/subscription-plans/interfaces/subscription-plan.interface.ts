/**
 * Subscription Plan Interfaces
 * Defines the structure for subscription plans in the OnlyUsedTesla platform
 */

export interface PriceDetails {
  currency: string;
  amount: number; // Amount in minor units (cents)
  minorUnit: boolean; // true if amount is in cents
}

export interface StripeDetails {
  priceId: string; // Stripe Price ID for monthly billing
  productId: string; // Stripe Product ID
  yearlyPriceId?: string | null; // Stripe Price ID for yearly billing
  yearlyProductId?: string | null; // Stripe Product ID for yearly
}

export interface BillingDetails {
  cycle: "monthly" | "yearly"; // Current active billing cycle
  supportedCycles: ("monthly" | "yearly")[]; // Supported billing cycles
  trialDays: number; // Number of trial days
  stripe: StripeDetails;
}

export interface UIDetails {
  sortOrder: number; // Display order in UI
  badge: string; // UI badge/label
}

export interface PlanMetadata {
  createdAt: string; // ISO 8601 date
  updatedAt: string; // ISO 8601 date
}

/**
 * Subscription Plan Document
 * Stored in subscriptionPlans container
 */
export interface SubscriptionPlanDocument {
  id: string; // Unique plan ID (e.g., plan_cashoffer)
  name: string; // Plan name (e.g., "Cash offer")
  description: string; // Plan description
  category: "cashoffer" | "dealer_wholesale" | "dealer_advertising"; // Plan category (partition key)
  price: PriceDetails;
  billing: BillingDetails;
  features: string[]; // List of plan features
  ui: UIDetails;
  isActive: boolean; // Whether plan is currently available
  metadata: PlanMetadata;
}

/**
 * Public Subscription Plan
 * Returned to clients via API
 */
export interface PublicSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  price: {
    currency: string;
    amount: number;
    displayAmount: string; // Formatted amount (e.g., "$50.00")
  };
  billing: {
    cycle: string;
    supportedCycles: string[];
    trialDays: number;
  };
  features: string[];
  ui: {
    sortOrder: number;
    badge: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
