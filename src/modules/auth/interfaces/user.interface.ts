/**
 * User Document (from Cosmos DB 'users' container)
 * Partition Key: /id
 */
export interface UserDocument {
  id: string;
  type: 'user';
  profile: UserProfile;
  market: UserMarket;
  auth: UserAuth;
  verification: UserVerification;
  status: UserStatus;
  sellerMemberships: SellerMembership[];
  roles: UserRole[];
  customPermissions: string[];
  preferences: UserPreferences;
  legal: UserLegal;
  metadata: UserMetadata;
}

export interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneE164: string | null;
  zipCode: string;
  avatarUrl: string | null;
}

export interface UserMarket {
  country: string;
  allowedCountries: string[];
  source: string;
}

export interface UserAuth {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  authProvider: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'authenticatorApp' | null;
}

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  verifiedAt: {
    email: string | null;
    phone: string | null;
  };
}

export interface UserStatus {
  blocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
}

export interface SellerMembership {
  sellerId: string;
  role: string;
  isPrimary: boolean;
}

export interface UserRole {
  roleId: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface UserLegal {
  membershipConsent: boolean;
  consentDate: string | null;
}

export interface UserMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Public User Projection (safe for API responses)
 * Excludes sensitive auth fields (passwordHash, passwordSalt)
 */
export interface PublicUser {
  id: string;
  type: 'user';
  profile: UserProfile;
  market: UserMarket;
  verification: UserVerification;
  status: UserStatus;
  sellerMemberships: SellerMembership[];
  roles: UserRole[];
  customPermissions: string[];
  preferences: UserPreferences;
  legal: UserLegal;
  metadata: Omit<UserMetadata, 'createdBy' | 'updatedBy'>;
}
