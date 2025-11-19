/**
 * Seller Review Document Interface
 * Represents a review/rating for a seller
 */
export interface SellerReviewDocument {
  id: string;
  type: 'seller_review';
  sellerId: string;
  reviewer: ReviewerInfo;
  transaction: TransactionInfo | null;
  rating: ReviewRating;
  content: ReviewContent;
  verification: ReviewVerification;
  moderation: ReviewModeration;
  engagement: ReviewEngagement;
  audit: ReviewAudit;
}

/**
 * Reviewer Information
 */
export interface ReviewerInfo {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  reviewCount: number;
}

/**
 * Transaction Information (for verified purchases)
 */
export interface TransactionInfo {
  orderId: string;
  listingId: string;
  vehicleName: string;
  completedAt: string;
}

/**
 * Review Rating
 */
export interface ReviewRating {
  overall: number; // 1-5
  communication: number | null; // 1-5
  vehicleCondition: number | null; // 1-5
  pricing: number | null; // 1-5
  processSmoothness: number | null; // 1-5
}

/**
 * Review Content
 */
export interface ReviewContent {
  title: string;
  body: string;
  pros: string[] | null;
  cons: string[] | null;
}

/**
 * Review Verification
 */
export interface ReviewVerification {
  isVerifiedPurchase: boolean;
  verificationMethod: 'order' | 'manual' | null;
  verifiedAt: string | null;
}

/**
 * Review Moderation
 */
export interface ReviewModeration {
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flaggedAt: string | null;
  flaggedBy: string | null;
  flagReason: string | null;
  moderatedAt: string | null;
  moderatedBy: string | null;
  moderationNotes: string | null;
}

/**
 * Review Engagement
 */
export interface ReviewEngagement {
  helpfulCount: number;
  notHelpfulCount: number;
  sellerResponse: SellerResponse | null;
}

/**
 * Seller Response to Review
 */
export interface SellerResponse {
  userId: string;
  displayName: string;
  message: string;
  respondedAt: string;
}

/**
 * Review Audit Trail
 */
export interface ReviewAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Public Seller Review (safe for API responses)
 */
export type PublicSellerReview = SellerReviewDocument;
