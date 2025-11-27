/**
 * Listing Offer Document Interface
 * Represents an offer on a vehicle listing
 */
export interface ListingOfferDocument {
  id: string;
  type: "listing_offer";

  // Related entities
  listingId: string;
  buyerId: string;
  sellerId: string;

  // Offer details
  offer: OfferDetails;

  // Status
  status: OfferStatus;

  // Negotiation history
  history: OfferHistoryEntry[];

  // Terms
  terms: OfferTerms | null;

  // Audit
  audit: OfferAudit;
}

/**
 * Offer details
 */
export interface OfferDetails {
  amount: number;
  currency: string;
  message: string | null;
  isCounterOffer: boolean;
  parentOfferId: string | null; // If this is a counter-offer
  expiresAt: string;
}

/**
 * Offer status
 */
export interface OfferStatus {
  state: OfferState;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  expiredAt: string | null;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
}

export type OfferState =
  | "pending" // Waiting for response
  | "accepted" // Accepted by seller
  | "rejected" // Rejected by seller
  | "countered" // Seller made a counter-offer
  | "withdrawn" // Withdrawn by buyer
  | "expired"; // Expired without response

/**
 * Offer history entry
 */
export interface OfferHistoryEntry {
  id: string;
  action: OfferAction;
  performedBy: string;
  performedByRole: "buyer" | "seller";
  amount: number | null;
  message: string | null;
  timestamp: string;
}

export type OfferAction =
  | "created"
  | "viewed"
  | "accepted"
  | "rejected"
  | "countered"
  | "withdrawn"
  | "expired";

/**
 * Offer terms (optional conditions)
 */
export interface OfferTerms {
  inspectionContingent: boolean;
  financingContingent: boolean;
  tradeInRequired: boolean;
  tradeInDetails: string | null;
  deliveryRequired: boolean;
  deliveryLocation: string | null;
  additionalTerms: string | null;
}

/**
 * Audit information
 */
export interface OfferAudit {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  viewedBySeller: boolean;
  viewedAt: string | null;
}

/**
 * Public Offer
 */
export type PublicOffer = ListingOfferDocument;

/**
 * Offer Statistics (for sellers)
 */
export interface OfferStatistics {
  totalOffers: number;
  pendingOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  averageOfferAmount: number;
  highestOfferAmount: number;
  lowestOfferAmount: number;
}
