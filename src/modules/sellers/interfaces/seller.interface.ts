/**
 * Seller Document (from Cosmos DB 'sellers' container)
 * Partition Key: /id
 */
export interface SellerDocument {
  id: string;
  sellerType: "Dealer" | "Private Seller";
  profile: SellerProfile;
  market: SellerMarket;
  dealerDetails: DealerDetails | null;
  privateDetails: PrivateDetails | null;
  users: SellerUser[];
  listings: SellerListing[];
  status: SellerStatus;
  meta: SellerMeta;
  audit: SellerAudit;
}

export interface SellerProfile {
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface SellerMarket {
  country: string;
  allowedCountries: string[];
  source: string;
}

export interface DealerDetails {
  companyName: string;
  media: {
    logo: string | null;
    banner: string | null;
  };
  dealerType: string; // "single_dealership" | "dealer_group"
  dealerGroupId: string | null;
  businessType: string; // "franchise_dealership" | "group_affiliated_dealership" | etc
  licensePhoto: string | null;
  licenseNumber: string | null;
  licenseExpiration: string | null;
  licenseStatus: string | null;
  resaleCertificatePhoto: string | null;
  sellersPermitPhoto: string | null;
  owner: {
    isOwner: boolean;
    name: string;
    email: string;
  };
  insuranceDetails: {
    provider: string | null;
    policyNumber: string | null;
    expirationDate: string | null;
  };
  syndicationSystem: string;
  syndicationApiKey: string | null;
  businessSite: {
    [key: string]: string; // site1, site2, site3, etc.
  };
  businessSiteLocations: string[];
}

export interface PrivateDetails {
  fullName: string;
  idVerificationPhoto: string | null;
}

export interface SellerUser {
  userId: string;
  role: string; // "owner" | "sales_manager" | "finance_manager" | etc
  joinedAt: string;
  invitedBy: string;
}

export interface SellerListing {
  listingId: string;
  status: string;
  vehicleId: string;
}

export interface SellerStatus {
  verified: boolean;
  approved: boolean;
  blocked: boolean;
  blockedReason: string | null;
}

export interface SellerMeta {
  rating: number | null;
  reviewsCount: number;
  tags: string[];
  totalListings: number;
  activeListings: number;
  soldListings: number;
  averageRating: number;
  totalReviews: number;
  totalSales: number;
}

export interface SellerAudit {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Public Seller (excludes sensitive data like syndicationApiKey and syndicationSystem)
 */
export type PublicSeller = Omit<SellerDocument, "dealerDetails"> & {
  dealerDetails: Omit<
    DealerDetails,
    "syndicationSystem" | "syndicationApiKey"
  > | null;
};
