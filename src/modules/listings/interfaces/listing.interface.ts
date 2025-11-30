import { VehicleDocument } from "../../vehicles/interfaces/vehicle.interface";

/**
 * Listing Document Interface
 * Matches the exact structure from the specification
 */
export interface ListingDocument {
  id: string;
  shortId: string; // Human-friendly short code (unique)
  slug: string; // SEO slug (unique)
  vehicleId: string; // Links to vehicles container

  seller: ListingSeller;

  // Listing-level commercial state
  status: string; // from taxonomies.listingStatus
  saleTypes: string; // from taxonomies.saleTypes (singular field, plural name)
  publishTypes: string; // from taxonomies.publishTypes (singular field, plural name)

  price: ListingPrice;
  location: ListingLocation;
  market: ListingMarket;

  // Listing-level dynamic vehicle state
  state: ListingState;

  content: ListingContent;
  media: ListingMedia;

  offerSummary: ListingOfferSummary;
  timeline: ListingTimeline;
  flags: ListingFlags;

  // Denormalized search index
  searchIndex: ListingSearchIndex;

  audit: ListingAudit;

  // Populated vehicle data (not stored in DB, populated at runtime)
  vehicle?: VehicleDocument;
}

/**
 * Listing Seller
 */
export interface ListingSeller {
  id: string;
  type: "dealer" | "private";
  displayName: string;
}

/**
 * Listing Price
 */
export interface ListingPrice {
  currency: string; // e.g., "USD"
  amount: number; // Price in cents or smallest currency unit
}

/**
 * Listing Location
 */
export interface ListingLocation {
  city: string;
  state: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
}

/**
 * Listing Market
 */
export interface ListingMarket {
  country: string; // Primary market country
  allowedCountries: string[]; // Countries where listing is visible
  source: "web" | "user" | "phone" | "kyc" | string;
}

/**
 * Listing State (dynamic vehicle state at listing time)
 */
export interface ListingState {
  condition: string; // from taxonomies.condition
  mileage: ListingMileage;
  titleStatus: string; // from taxonomies.insuranceCategory / vehicle history
  previousOwners: number;
  insuranceCategory: string; // from taxonomies.insuranceCategory
  lease: ListingLease;
}

/**
 * Listing Mileage
 */
export interface ListingMileage {
  value: number;
  unit: "miles" | "km";
}

/**
 * Listing Lease
 */
export interface ListingLease {
  isLeased: boolean;
  monthsRemaining: number;
}

/**
 * Listing Content
 */
export interface ListingContent {
  title: string;
  description: string;
  extra: string;
  seo: ListingSEO;
}

/**
 * Listing SEO
 */
export interface ListingSEO {
  canonicalUrl: string;
  metaTitle: string;
  metaDescription: string;
  openGraphImage: string;
}

/**
 * Listing Media
 */
export interface ListingMedia {
  images: ListingImage[];
  video: ListingVideo;
}

/**
 * Listing Image
 */
export interface ListingImage {
  id: string;
  type: "featured" | "standard";
  sizes: ListingImageSizes;
}

/**
 * Listing Image Sizes
 */
export interface ListingImageSizes {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
}

/**
 * Listing Video
 */
export interface ListingVideo {
  title: string | null;
  description: string | null;
  url: string;
}

/**
 * Listing Offer Summary
 */
export interface ListingOfferSummary {
  totalOffers: number;
  highestOffer: ListingHighestOffer | null;
  lastOfferAt: string | null;
}

/**
 * Listing Highest Offer
 */
export interface ListingHighestOffer {
  amount: number;
  buyerId: string;
  buyerName: string;
  status: string; // e.g., "Pending", "Accepted", "Rejected"
}

/**
 * Listing Timeline
 */
export interface ListingTimeline {
  publishedOn: string | null;
  soldOn: string | null;
  expireOn: string | null;
}

/**
 * Listing Flags
 */
export interface ListingFlags {
  isTest: boolean;
  isFeatured: boolean;
  isBoosted: boolean;
}

/**
 * Listing Search Index (denormalized for query optimization)
 */
export interface ListingSearchIndex {
  version: number;

  // From vehicles container
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  bodyStyle: string;
  driveTrain: string;
  batteryCapacityKWh: number;
  rangeEPA: number;
  chargingPort: string;
  chargerType: string;
  enginePowerHP: number;
  topSpeedMph: number;

  // From listing.state
  condition: string;
  titleStatus: string;
  previousOwners: number;
  mileage: number;
  mileageBucket: string; // e.g., "25k-50k"
  exteriorColor: string;
  interiorColor: string;
  seats: number;
  autopilotGen: string;
  hasFSD: boolean;
  hasEnhancedAP: boolean;
  premiumPackage: boolean;
  wheelsCode: string;
  isLeased: boolean;
  monthsRemaining: number;

  // Listing commercial data
  status: string;
  saleType: string;
  publishType: string;
  price: number;
  priceCurrency: string;
  priceBucket: string; // e.g., "45k-50k"

  sellerType: string;
  sellerId: string;
  sellerDisplayName: string;
  dealerGroupId?: string;

  countryCode: string;
  state: string;
  city: string;
  marketCountry: string;

  publishedOn: string | null;
  publishedYearMonth: string | null; // e.g., "2025-04"
  soldOn: string | null;
  expireOn: string | null;

  isFeatured: boolean;
  isBoosted: boolean;
  hasVideo: boolean;
  imageCount: number;

  totalOffers: number;
  highestOffer: number | null;
  lastOfferAt: string | null;
}

/**
 * Listing Audit
 */
export interface ListingAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Listing with populated vehicle
 */
export type ListingWithVehicle = ListingDocument & {
  vehicle: VehicleDocument;
};
