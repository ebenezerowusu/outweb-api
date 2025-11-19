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
import { JwtService } from './jwt.service';
import { TokenResponse } from '@/common/types/token.type';
import { ValidationException } from '@/common/exceptions/validation.exception';
import {
  UserDocument,
  PublicUser,
} from '../interfaces/user.interface';
import { SignInDto } from '../dto/signin.dto';
import { SignUpPrivateDto } from '../dto/signup-private.dto';
import { SignUpDealerDto } from '../dto/signup-dealer.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AppConfig } from '@/config/app.config';

/**
 * Auth Service
 * Handles authentication, user creation, and token management
 */
@Injectable()
export class AuthService {
  private readonly USERS_CONTAINER = 'users';

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly jwtService: JwtService,
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
      sellerMemberships: [],
      roles: [{ roleId: 'role_buyer' }],
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

    // Save to Cosmos DB
    await this.cosmosService.createItem(this.USERS_CONTAINER, user);

    // TODO: Send email verification email via SendGrid

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
      roles: [{ roleId: 'role_seller' }],
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

    // TODO: Create seller document in sellers container
    // TODO: Create Stripe checkout session for subscriptions

    // Mock Stripe response for now
    const stripeCheckout = {
      checkoutSessionId: `cs_test_${Date.now()}`,
      subscriptionIds: dto.subscriptionIds,
      checkoutUrl: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
    };

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
