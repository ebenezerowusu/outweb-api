/**
 * Subscription Plans Data
 * Defines all available subscription plans with their features, pricing, and metadata
 */

export interface SubscriptionPlanData {
  id: string;
  name: string;
  description: string;
  category: "cashoffer" | "dealer_wholesale" | "dealer_advertising";
  price: {
    currency: string;
    amount: number;
    minorUnit: boolean;
  };
  billing: {
    cycle: "monthly" | "yearly";
    supportedCycles: ("monthly" | "yearly")[];
    trialDays: number;
    stripe: {
      priceId: string;
      productId: string;
      yearlyPriceId: string | null;
      yearlyProductId: string | null;
    };
  };
  features: string[];
  ui: {
    sortOrder: number;
    badge: string;
  };
  isActive: boolean;
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanData[] = [
  {
    id: "plan_cashoffer",
    name: "Cash offer",
    description:
      "Subscription for accessing instant CashOffer leads and tools.",
    category: "cashoffer",
    price: {
      currency: "USD",
      amount: 5000, // $50.00
      minorUnit: true,
    },
    billing: {
      cycle: "monthly",
      supportedCycles: ["monthly", "yearly"],
      trialDays: 14,
      stripe: {
        priceId: "price_cashoffer_monthly",
        productId: "prod_cashoffer",
        yearlyPriceId: null,
        yearlyProductId: null,
      },
    },
    features: [
      "Access to CashOffer leads",
      "Receive instant cash offers from qualified dealers",
      "Basic reporting on CashOffer performance",
    ],
    ui: {
      sortOrder: 1,
      badge: "Cash Offers",
    },
    isActive: true,
    metadata: {
      createdAt: "2025-08-01T00:00:00Z",
      updatedAt: "2025-11-24T00:00:00Z",
    },
  },
  {
    id: "plan_dealer_wholesale",
    name: "Dealer wholesale",
    description:
      "Wholesale access for dealers to buy and sell Tesla inventory dealer-to-dealer.",
    category: "dealer_wholesale",
    price: {
      currency: "USD",
      amount: 5000, // $50.00
      minorUnit: true,
    },
    billing: {
      cycle: "monthly",
      supportedCycles: ["monthly", "yearly"],
      trialDays: 14,
      stripe: {
        priceId: "price_dealer_wholesale_monthly",
        productId: "prod_dealer_wholesale",
        yearlyPriceId: null,
        yearlyProductId: null,
      },
    },
    features: [
      "Access to dealer-only wholesale listings",
      "Ability to place wholesale offers on inventory",
      "Basic analytics on wholesale trades",
    ],
    ui: {
      sortOrder: 2,
      badge: "Wholesale",
    },
    isActive: true,
    metadata: {
      createdAt: "2025-08-01T00:00:00Z",
      updatedAt: "2025-11-24T00:00:00Z",
    },
  },
  {
    id: "plan_dealer_advertising",
    name: "Dealer advertising",
    description:
      "Advertising plan for dealers to run featured and boosted listings.",
    category: "dealer_advertising",
    price: {
      currency: "USD",
      amount: 1000, // $10.00
      minorUnit: true,
    },
    billing: {
      cycle: "monthly",
      supportedCycles: ["monthly", "yearly"],
      trialDays: 30,
      stripe: {
        priceId: "price_dealer_advertising_monthly",
        productId: "prod_dealer_advertising",
        yearlyPriceId: null,
        yearlyProductId: null,
      },
    },
    features: [
      "Featured placement for selected listings",
      "Boosted exposure in search results",
      "Promotional banner placements (where available)",
      "Priority support for advertising issues",
    ],
    ui: {
      sortOrder: 3,
      badge: "Advertising",
    },
    isActive: true,
    metadata: {
      createdAt: "2025-08-05T00:00:00Z",
      updatedAt: "2025-11-24T00:00:00Z",
    },
  },
];

/**
 * Cosmos DB Indexing Policy for subscription-plans container
 */
export const SUBSCRIPTION_PLANS_INDEXING_POLICY = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [
    {
      path: "/*",
    },
  ],
  excludedPaths: [
    {
      path: "/description/?",
    },
    {
      path: "/features/*",
    },
  ],
  fullTextIndexes: [],
};
