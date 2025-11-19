/**
 * Listing Document Interface
 * Represents a vehicle listing in the marketplace
 */
export interface ListingDocument {
  id: string;
  type: 'listing';
  sellerId: string;
  seller: ListingSeller;
  vehicle: ListingVehicle;
  pricing: ListingPricing;
  media: ListingMedia;
  location: ListingLocation;
  features: ListingFeatures;
  condition: ListingCondition;
  status: ListingStatus;
  visibility: ListingVisibility;
  performance: ListingPerformance;
  audit: ListingAudit;
}

/**
 * Listing Seller Info
 */
export interface ListingSeller {
  id: string;
  name: string;
  type: 'dealer' | 'private';
  rating: number | null;
  reviewCount: number;
}

/**
 * Listing Vehicle Data
 */
export interface ListingVehicle {
  vin: string;
  make: string;
  makeId: string;
  model: string;
  modelId: string;
  trim: string | null;
  trimId: string | null;
  year: number;
  mileage: number;
  exteriorColor: string;
  exteriorColorId: string;
  interiorColor: string;
  interiorColorId: string;
  bodyType: string;
  bodyTypeId: string;
  drivetrain: string;
  drivetrainId: string;
  batterySize: string | null;
  batterySizeId: string | null;
  batteryHealth: number | null;
  range: number | null;
  autopilotVersion: string | null;
  fsdCapable: boolean;
  specifications: Record<string, any>;
}

/**
 * Listing Pricing
 */
export interface ListingPricing {
  listPrice: number;
  originalPrice: number | null;
  currency: string;
  priceHistory: PriceChange[];
  negotiable: boolean;
  acceptsOffers: boolean;
  tradeinAccepted: boolean;
  financingAvailable: boolean;
}

/**
 * Price Change History
 */
export interface PriceChange {
  price: number;
  changedAt: string;
  changedBy: string;
  reason: string | null;
}

/**
 * Listing Media
 */
export interface ListingMedia {
  photos: ListingPhoto[];
  videos: ListingVideo[];
  documents: ListingDocument[];
}

/**
 * Listing Photo
 */
export interface ListingPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  order: number;
  isPrimary: boolean;
  uploadedAt: string;
}

/**
 * Listing Video
 */
export interface ListingVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  duration: number | null;
  uploadedAt: string;
}

/**
 * Listing Document (inspection reports, etc.)
 */
export interface ListingDocument {
  id: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Listing Location
 */
export interface ListingLocation {
  country: string;
  state: string;
  city: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Listing Features
 */
export interface ListingFeatures {
  standard: string[];
  optional: string[];
  highlights: string[];
}

/**
 * Listing Condition
 */
export interface ListingCondition {
  overall: 'excellent' | 'good' | 'fair' | 'needs_work';
  exteriorRating: number;
  interiorRating: number;
  mechanicalRating: number;
  description: string;
  knownIssues: string[];
  modifications: string[];
  serviceHistory: ServiceRecord[];
  accidentHistory: AccidentRecord[];
}

/**
 * Service Record
 */
export interface ServiceRecord {
  date: string;
  mileage: number;
  description: string;
  cost: number | null;
  provider: string | null;
}

/**
 * Accident Record
 */
export interface AccidentRecord {
  date: string;
  description: string;
  damage: string;
  repaired: boolean;
  cost: number | null;
}

/**
 * Listing Status
 */
export interface ListingStatus {
  state: ListingState;
  substatus: string | null;
  publishedAt: string | null;
  soldAt: string | null;
  expiresAt: string | null;
  featured: boolean;
  featuredUntil: string | null;
  verified: boolean;
  verifiedAt: string | null;
}

/**
 * Listing State
 */
export type ListingState =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'sold'
  | 'expired'
  | 'suspended'
  | 'archived';

/**
 * Listing Visibility
 */
export interface ListingVisibility {
  isPublic: boolean;
  showSellerInfo: boolean;
  showPricing: boolean;
  allowMessages: boolean;
  allowOffers: boolean;
}

/**
 * Listing Performance
 */
export interface ListingPerformance {
  views: number;
  uniqueViews: number;
  favorites: number;
  shares: number;
  inquiries: number;
  offers: number;
  lastViewedAt: string | null;
}

/**
 * Listing Audit Trail
 */
export interface ListingAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Public Listing (safe for API responses)
 */
export type PublicListing = Omit<ListingDocument, 'vehicle'> & {
  vehicle: Omit<ListingVehicle, 'vin'> & { vinLastFour?: string };
};
