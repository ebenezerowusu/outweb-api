/**
 * Seller Group Document Interface
 * Represents a dealer group with multiple locations/sellers
 */
export interface SellerGroupDocument {
  id: string;
  type: 'seller_group';
  profile: SellerGroupProfile;
  headquarters: SellerGroupHeadquarters;
  members: SellerGroupMember[];
  settings: SellerGroupSettings;
  meta: SellerGroupMeta;
  audit: SellerGroupAudit;
}

/**
 * Seller Group Profile
 */
export interface SellerGroupProfile {
  name: string;
  description: string | null;
  media: {
    logo: string | null;
    banner: string | null;
  };
  website: string | null;
  phone: string;
  email: string;
}

/**
 * Seller Group Headquarters Information
 */
export interface SellerGroupHeadquarters {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

/**
 * Seller Group Member (Individual Dealer/Location)
 */
export interface SellerGroupMember {
  sellerId: string;
  role: 'primary' | 'member';
  joinedAt: string;
  addedBy: string;
}

/**
 * Seller Group Settings
 */
export interface SellerGroupSettings {
  sharedInventory: boolean;
  sharedPricing: boolean;
  sharedBranding: boolean;
  allowCrossLocationTransfers: boolean;
  centralizedPayments: boolean;
}

/**
 * Seller Group Metadata
 */
export interface SellerGroupMeta {
  totalLocations: number;
  totalListings: number;
  totalSales: number;
  averageRating: number;
  totalReviews: number;
}

/**
 * Seller Group Audit Trail
 */
export interface SellerGroupAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Public Seller Group (safe for API responses)
 */
export type PublicSellerGroup = SellerGroupDocument;
