import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { CosmosService } from '@/common/services/cosmos.service';
import { EmailService } from '@/common/services/email.service';
import { JwtService } from './jwt.service';
import { TokenResponse } from '@/common/types/token.type';
import { ValidationException } from '@/common/exceptions/validation.exception';
import {
  UserDocument,
  PublicUser,
} from '../interfaces/user.interface';
import { SellerDocument } from '@/modules/sellers/interfaces/seller.interface';
import { SellerGroupDocument } from '@/modules/seller-groups/interfaces/seller-group.interface';
import { SignInDto } from '../dto/signin.dto';
import { SignUpPrivateDto } from '../dto/signup-private.dto';
import { SignUpDealerDto } from '../dto/signup-dealer.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RequestEmailVerificationDto, ConfirmEmailVerificationDto } from '../dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/password-reset.dto';
import { Setup2FaDto, Disable2FaDto, TwoFactorMethod } from '../dto/two-factor.dto';
import { AppConfig } from '@/config/app.config';

/**
 * Auth Service
 * Handles authentication, user creation, and token management
 */
@Injectable()
export class AuthService {
  private readonly USERS_CONTAINER = 'users';
  private readonly SELLERS_CONTAINER = 'sellers';
  private readonly SELLER_GROUPS_CONTAINER = 'sellerGroups';

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  /**
   * Sign in user with email and password
   */
  async signIn(dto: SignInDto): Promise<{ user: PublicUser } & TokenResponse> {
    // Find user by email
    const query = 'SELECT * FROM c WHERE c.profile.email = @email';
    const { items } = await this.cosmosService.queryItems<UserDocument>(
      this.USERS_CONTAINER,
      query,
      [{ name: '@email', value: dto.email.toLowerCase() }],
    );

    const user = items[0];

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.auth.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if user is blocked
    if (user.status.blocked) {
      throw new UnauthorizedException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is blocked',
      });
    }

    // Check if user is active
    if (!user.status.isActive) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Account is inactive',
      });
    }

    // Update last login time
    user.status.lastLoginAt = new Date().toISOString();
    user.metadata.updatedAt = new Date().toISOString();

    await this.cosmosService.updateItem(this.USERS_CONTAINER, user, user.id);

    // Generate tokens
    const tokens = await this.jwtService.generateTokens({
      sub: user.id,
      email: user.profile.email,
      roles: user.roles.map((r) => r.roleId),
      permissions: user.customPermissions,
    });

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  /**
   * Sign up private user
   */
  async signUpPrivate(
    dto: SignUpPrivateDto,
    country: string,
  ): Promise<{ user: PublicUser } & TokenResponse> {
    // Validate passwords match
    if (dto.password !== dto.confirmPassword) {
      throw new ValidationException({
        confirmPassword: ['Passwords do not match'],
      });
    }

    // Validate terms acceptance
    if (!dto.acceptTermsOfService) {
      throw new ValidationException({
        acceptTermsOfService: ['You must accept the terms of service'],
      });
    }

    // Check if email already exists
    await this.checkEmailExists(dto.email);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user document
    const now = new Date().toISOString();
    const userId = this.generateUserId();
    const sellerId = this.generateSellerId();

    const user: UserDocument = {
      id: userId,
      type: 'user',
      profile: {
        displayName: `${dto.firstName} ${dto.lastName}`,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phone,
        phoneE164: null,
        zipCode: dto.zipCode || '',
        avatarUrl: null,
      },
      market: {
        country: country,
        allowedCountries: [country],
        source: 'user',
      },
      auth: {
        username: dto.email.toLowerCase(),
        passwordHash,
        passwordSalt: salt,
        authProvider: 'local',
        twoFactorEnabled: false,
        twoFactorMethod: null,
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        verifiedAt: {
          email: null,
          phone: null,
        },
      },
      status: {
        blocked: false,
        blockedReason: null,
        blockedAt: null,
        lastLoginAt: null,
        isActive: true,
      },
      sellerMemberships: [
        {
          sellerId: sellerId,
          role: 'owner',
          isPrimary: true,
        },
      ],
      roles: [{ roleId: 'role_private' }],
      customPermissions: [],
      preferences: {
        language: 'en-US',
        timezone: 'America/Los_Angeles',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
      legal: {
        membershipConsent: dto.acceptTermsOfService,
        consentDate: now,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
      },
    };

    // Save user to Cosmos DB
    await this.cosmosService.createItem(this.USERS_CONTAINER, user);

    // Create seller document for private seller
    const seller: SellerDocument = {
      id: sellerId,
      sellerType: 'private',
      profile: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        address: {
          street: '',
          city: '',
          state: '',
          country: country,
        },
      },
      market: {
        country: country,
        allowedCountries: [country],
        source: 'user',
      },
      dealerDetails: null,
      privateDetails: {
        fullName: `${dto.firstName} ${dto.lastName}`,
        idVerificationPhoto: null,
      },
      users: [
        {
          userId: userId,
          role: 'owner',
          joinedAt: now,
          invitedBy: 'system',
        },
      ],
      listings: [],
      status: {
        verified: false,
        approved: false,
        blocked: false,
        blockedReason: null,
      },
      meta: {
        rating: null,
        reviewsCount: 0,
        tags: [],
        totalListings: 0,
        activeListings: 0,
        soldListings: 0,
        averageRating: 0,
        totalReviews: 0,
        totalSales: 0,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      },
    };

    // Save seller to Cosmos DB
    await this.cosmosService.createItem(this.SELLERS_CONTAINER, seller);

    // Send welcome email
    const dashboardUrl = 'https://app.onlyusedtesla.com/dashboard';
    await this.emailService.sendWelcomePrivateEmail(user.profile.email, {
      firstName: user.profile.firstName,
      dashboardUrl,
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
      // Don't block signup if email fails
    });

    // Generate tokens
    const tokens = await this.jwtService.generateTokens({
      sub: user.id,
      email: user.profile.email,
      roles: user.roles.map((r) => r.roleId),
      permissions: user.customPermissions,
    });

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  /**
   * Sign up dealer user
   */
  async signUpDealer(
    dto: SignUpDealerDto,
    country: string,
  ): Promise<{
    user: PublicUser;
    stripe: {
      checkoutSessionId: string;
      subscriptionIds: string[];
      checkoutUrl: string;
    };
    seller: {
      sellerId: string;
      representing: string;
      groupName?: string;
    };
  } & TokenResponse> {
    // Validate passwords match
    if (dto.password !== dto.confirmPassword) {
      throw new ValidationException({
        confirmPassword: ['Passwords do not match'],
      });
    }

    // Validate terms acceptance
    if (!dto.acceptTermsOfService) {
      throw new ValidationException({
        acceptTermsOfService: ['You must accept the terms of service'],
      });
    }

    // Validate dealer-specific fields
    if (dto.whoAreYouRepresenting === 'dealer_group' && !dto.groupName) {
      throw new ValidationException({
        groupName: ['Group name is required when representing a dealer group'],
      });
    }

    if (!dto.subscriptionIds || dto.subscriptionIds.length === 0) {
      throw new ValidationException({
        subscriptionIds: ['At least one subscription id is required'],
      });
    }

    // Check if email already exists
    await this.checkEmailExists(dto.email);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user document
    const now = new Date().toISOString();
    const userId = this.generateUserId();
    const sellerId = this.generateSellerId();

    const user: UserDocument = {
      id: userId,
      type: 'user',
      profile: {
        displayName: `${dto.firstName} ${dto.lastName}`,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phone,
        phoneE164: null,
        zipCode: '00233',
        avatarUrl: null,
      },
      market: {
        country: country,
        allowedCountries: [country],
        source: 'user|phone|kyc',
      },
      auth: {
        username: dto.email.toLowerCase(),
        passwordHash,
        passwordSalt: salt,
        authProvider: 'local',
        twoFactorEnabled: false,
        twoFactorMethod: null,
      },
      verification: {
        emailVerified: false,
        phoneVerified: false,
        verifiedAt: {
          email: null,
          phone: null,
        },
      },
      status: {
        blocked: false,
        blockedReason: null,
        blockedAt: null,
        lastLoginAt: null,
        isActive: true,
      },
      sellerMemberships: [
        {
          sellerId: sellerId,
          role: 'owner',
          isPrimary: true,
        },
      ],
      roles: [{ roleId: 'role_dealer' }],
      customPermissions: ['perm_manage_inventory'],
      preferences: {
        language: 'en-US',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          sms: true,
          push: false,
        },
      },
      legal: {
        membershipConsent: dto.acceptTermsOfService,
        consentDate: now,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      },
    };

    // Save user to Cosmos DB
    await this.cosmosService.createItem(this.USERS_CONTAINER, user);

    // Create seller document for dealer
    // Build businessSite object from businessSiteLocations array
    const businessSite: { [key: string]: string } = {};
    dto.businessSiteLocations.forEach((location, index) => {
      businessSite[`site${index + 1}`] = location;
    });

    const seller: SellerDocument = {
      id: sellerId,
      sellerType: 'dealer',
      profile: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        address: {
          street: dto.address,
          city: '',
          state: '',
          country: country,
        },
      },
      market: {
        country: country,
        allowedCountries: [country],
        source: 'user|phone|kyc',
      },
      dealerDetails: {
        companyName: dto.companyName,
        media: {
          logo: null,
          banner: null,
        },
        dealerType: dto.whoAreYouRepresenting,
        dealerGroupId: null, // Will be set if creating a dealer group
        businessType: dto.businessType,
        licensePhoto: null,
        licenseNumber: null,
        licenseExpiration: null,
        licenseStatus: null,
        resaleCertificatePhoto: null,
        sellersPermitPhoto: null,
        owner: {
          isOwner: dto.owner,
          name: `${dto.firstName} ${dto.lastName}`,
          email: dto.email.toLowerCase(),
        },
        insuranceDetails: {
          provider: null,
          policyNumber: null,
          expirationDate: null,
        },
        syndicationSystem: dto.syndicationSystem,
        syndicationApiKey: null,
        businessSite: businessSite,
        businessSiteLocations: dto.businessSiteLocations,
      },
      privateDetails: null,
      users: [
        {
          userId: userId,
          role: 'owner',
          joinedAt: now,
          invitedBy: 'system',
        },
      ],
      listings: [],
      status: {
        verified: false,
        approved: false,
        blocked: false,
        blockedReason: null,
      },
      meta: {
        rating: null,
        reviewsCount: 0,
        tags: [],
        totalListings: 0,
        activeListings: 0,
        soldListings: 0,
        averageRating: 0,
        totalReviews: 0,
        totalSales: 0,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      },
    };

    // Save seller to Cosmos DB
    await this.cosmosService.createItem(this.SELLERS_CONTAINER, seller);

    // Create seller group if representing a dealer group
    if (dto.whoAreYouRepresenting === 'dealer_group' && dto.groupName) {
      const sellerGroupId = this.generateSellerGroupId();

      const sellerGroup: SellerGroupDocument = {
        id: sellerGroupId,
        type: 'seller_group',
        profile: {
          name: dto.groupName,
          description: null,
          media: {
            logo: null,
            banner: null,
          },
          website: null,
          phone: dto.phone,
          email: dto.email.toLowerCase(),
        },
        headquarters: {
          address: {
            street: dto.address,
            city: '',
            state: '',
            zipCode: '',
            country: country,
          },
          contactPerson: `${dto.firstName} ${dto.lastName}`,
          contactEmail: dto.email.toLowerCase(),
          contactPhone: dto.phone,
        },
        members: [
          {
            sellerId: sellerId,
            role: 'primary',
            joinedAt: now,
            addedBy: userId,
          },
        ],
        settings: {
          sharedInventory: false,
          sharedPricing: false,
          sharedBranding: false,
          allowCrossLocationTransfers: false,
          centralizedPayments: false,
        },
        meta: {
          totalLocations: dto.rooftop ? parseInt(dto.rooftop, 10) : 1,
          totalListings: 0,
          totalSales: 0,
          averageRating: 0,
          totalReviews: 0,
        },
        audit: {
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        },
      };

      // Save seller group to Cosmos DB
      await this.cosmosService.createItem(this.SELLER_GROUPS_CONTAINER, sellerGroup);

      // Update seller's dealerGroupId to reference the group
      seller.dealerDetails!.dealerGroupId = sellerGroupId;
      await this.cosmosService.updateItem(this.SELLERS_CONTAINER, seller, sellerId);
    }

    // TODO: Create Stripe checkout session for subscriptions

    // Mock Stripe response for now
    const stripeCheckout = {
      checkoutSessionId: `cs_test_${Date.now()}`,
      subscriptionIds: dto.subscriptionIds,
      checkoutUrl: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
    };

    // Send welcome dealer email
    const dealerDashboardUrl = 'https://app.onlyusedtesla.com/dealer';
    await this.emailService.sendWelcomeDealerEmail(user.profile.email, {
      firstName: user.profile.firstName,
      dealerName: dto.companyName,
      dealerDashboardUrl,
    }).catch(error => {
      console.error('Failed to send welcome email:', error);
      // Don't block signup if email fails
    });

    // Generate tokens
    const tokens = await this.jwtService.generateTokens({
      sub: user.id,
      email: user.profile.email,
      roles: user.roles.map((r) => r.roleId),
      permissions: user.customPermissions,
    });

    return {
      ...tokens,
      user: this.toPublicUser(user),
      stripe: stripeCheckout,
      seller: {
        sellerId: sellerId,
        representing: dto.whoAreYouRepresenting,
        groupName: dto.groupName,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refresh(dto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyRefreshToken(dto.refreshToken);

      // Get user from database
      const user = await this.cosmosService.readItem<UserDocument>(
        this.USERS_CONTAINER,
        payload.sub,
        payload.sub,
      );

      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      }

      // Generate new tokens
      return this.jwtService.generateTokens({
        sub: user.id,
        email: user.profile.email,
        roles: user.roles.map((r) => r.roleId),
        permissions: user.customPermissions,
      });
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
  }

  /**
   * Get current user from token
   */
  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return this.toPublicUser(user);
  }

  /**
   * Request email verification
   */
  async requestEmailVerification(dto: RequestEmailVerificationDto): Promise<{ statusCode: number; message: string }> {
    // Find user by email
    const query = 'SELECT * FROM c WHERE c.profile.email = @email';
    const { items } = await this.cosmosService.queryItems<UserDocument>(
      this.USERS_CONTAINER,
      query,
      [{ name: '@email', value: dto.email.toLowerCase() }],
    );

    // Return same response whether user exists or not (security best practice)
    if (!items[0]) {
      return {
        statusCode: 202,
        message: 'Verification email sent if the account exists',
      };
    }

    const user = items[0];

    // Generate verification token (expires in 24 hours)
    const token = await this.jwtService.generateTokens({
      sub: user.id,
      email: user.profile.email,
      roles: [],
      permissions: [],
    });

    // Send verification email
    const verifyUrl = `https://app.onlyusedtesla.com/verify-email?token=${token.accessToken}`;
    await this.emailService.sendVerificationEmail(user.profile.email, {
      firstName: user.profile.firstName,
      verifyUrl,
    }).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    return {
      statusCode: 202,
      message: 'Verification email sent if the account exists',
    };
  }

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(dto: ConfirmEmailVerificationDto): Promise<{ statusCode: number; message: string }> {
    try {
      // Verify token
      const payload = await this.jwtService.verifyAccessToken(dto.token);

      // Get user
      const user = await this.cosmosService.readItem<UserDocument>(
        this.USERS_CONTAINER,
        payload.sub,
        payload.sub,
      );

      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }

      // Update verification status
      user.verification.emailVerified = true;
      user.verification.verifiedAt.email = new Date().toISOString();
      user.metadata.updatedAt = new Date().toISOString();

      await this.cosmosService.updateItem(this.USERS_CONTAINER, user, user.id);

      return {
        statusCode: 200,
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ statusCode: number; message: string }> {
    // Find user by email
    const query = 'SELECT * FROM c WHERE c.profile.email = @email';
    const { items } = await this.cosmosService.queryItems<UserDocument>(
      this.USERS_CONTAINER,
      query,
      [{ name: '@email', value: dto.email.toLowerCase() }],
    );

    // Return same response whether user exists or not (security best practice)
    if (!items[0]) {
      return {
        statusCode: 202,
        message: 'Password reset link sent if the account exists',
      };
    }

    const user = items[0];

    // Generate reset token (expires in 1 hour)
    const token = await this.jwtService.generateTokens({
      sub: user.id,
      email: user.profile.email,
      roles: [],
      permissions: [],
    });

    // Send reset email
    const resetUrl = `https://app.onlyusedtesla.com/reset-password?token=${token.accessToken}`;
    await this.emailService.sendResetPasswordEmail(user.profile.email, {
      firstName: user.profile.firstName,
      resetUrl,
    }).catch(error => {
      console.error('Failed to send password reset email:', error);
    });

    return {
      statusCode: 202,
      message: 'Password reset link sent if the account exists',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ statusCode: number; message: string }> {
    // Validate passwords match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ValidationException({
        confirmPassword: ['Passwords do not match'],
      });
    }

    try {
      // Verify token
      const payload = await this.jwtService.verifyAccessToken(dto.token);

      // Get user
      const user = await this.cosmosService.readItem<UserDocument>(
        this.USERS_CONTAINER,
        payload.sub,
        payload.sub,
      );

      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dto.newPassword, salt);

      // Update password
      user.auth.passwordHash = passwordHash;
      user.auth.passwordSalt = salt;
      user.metadata.updatedAt = new Date().toISOString();

      await this.cosmosService.updateItem(this.USERS_CONTAINER, user, user.id);

      return {
        statusCode: 200,
        message: 'Password updated successfully',
      };
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  }

  /**
   * Setup 2FA
   */
  async setup2FA(dto: Setup2FaDto, userId: string): Promise<{ statusCode: number; message: string; qrCode?: string }> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Enable 2FA
    user.auth.twoFactorEnabled = true;
    user.auth.twoFactorMethod = dto.method;
    user.metadata.updatedAt = new Date().toISOString();

    await this.cosmosService.updateItem(this.USERS_CONTAINER, user, user.id);

    // If email method, send test code
    if (dto.method === TwoFactorMethod.SMS) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.emailService.sendMfaCodeEmail(user.profile.email, {
        firstName: user.profile.firstName,
        code,
        expiresMinutes: 10,
      }).catch(error => {
        console.error('Failed to send MFA code email:', error);
      });
    }

    return {
      statusCode: 200,
      message: 'Two-factor authentication enabled',
      ...(dto.method === TwoFactorMethod.AUTHENTICATOR_APP && {
        qrCode: 'TODO: Generate QR code for authenticator app',
      }),
    };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(dto: Disable2FaDto, userId: string): Promise<{ statusCode: number; message: string }> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Disable 2FA
    user.auth.twoFactorEnabled = false;
    user.auth.twoFactorMethod = null;
    user.metadata.updatedAt = new Date().toISOString();

    await this.cosmosService.updateItem(this.USERS_CONTAINER, user, user.id);

    return {
      statusCode: 200,
      message: 'Two-factor authentication disabled',
    };
  }

  /**
   * Helper: Check if email exists
   */
  private async checkEmailExists(email: string): Promise<void> {
    const query = 'SELECT c.id FROM c WHERE c.profile.email = @email';
    const { items } = await this.cosmosService.queryItems(
      this.USERS_CONTAINER,
      query,
      [{ name: '@email', value: email.toLowerCase() }],
      1,
    );

    if (items.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email is already registered',
      });
    }
  }

  /**
   * Helper: Generate user ID
   */
  private generateUserId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Helper: Generate seller ID
   */
  private generateSellerId(): string {
    return `dealer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Helper: Generate seller group ID
   */
  private generateSellerGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Helper: Convert UserDocument to PublicUser (remove sensitive fields)
   */
  private toPublicUser(user: UserDocument): PublicUser {
    const { auth, ...publicFields } = user;
    return {
      ...publicFields,
      metadata: {
        createdAt: user.metadata.createdAt,
        updatedAt: user.metadata.updatedAt,
      },
    } as PublicUser;
  }
}
