import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { PaginatedResponse } from '@/common/types/pagination.type';
import { SellerDocument, PublicSeller } from './interfaces/seller.interface';
import { CreateSellerDto } from './dto/create-seller.dto';
import {
  UpdateSellerDto,
  UpdateSellerStatusDto,
  UpdateSellerMetaDto,
  UpdateSellerUsersDto,
} from './dto/update-seller.dto';
import { QuerySellersDto } from './dto/query-sellers.dto';

/**
 * Sellers Service
 * Handles seller management for dealers and private sellers
 */
@Injectable()
export class SellersService {
  private readonly SELLERS_CONTAINER = 'sellers';

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * List sellers with filters and pagination
   */
  async findAll(query: QuerySellersDto): Promise<PaginatedResponse<PublicSeller>> {
    let sqlQuery = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    // Filter by seller type
    if (query.sellerType) {
      sqlQuery += ' AND c.sellerType = @sellerType';
      parameters.push({ name: '@sellerType', value: query.sellerType });
    }

    // Filter by email
    if (query.email) {
      sqlQuery += ' AND c.profile.email = @email';
      parameters.push({ name: '@email', value: query.email.toLowerCase() });
    }

    // Filter by company name (dealers only)
    if (query.companyName) {
      sqlQuery += ' AND CONTAINS(LOWER(c.dealerDetails.companyName), @companyName)';
      parameters.push({ name: '@companyName', value: query.companyName.toLowerCase() });
    }

    // Filter by city
    if (query.city) {
      sqlQuery += ' AND LOWER(c.profile.address.city) = @city';
      parameters.push({ name: '@city', value: query.city.toLowerCase() });
    }

    // Filter by state
    if (query.state) {
      sqlQuery += ' AND LOWER(c.profile.address.state) = @state';
      parameters.push({ name: '@state', value: query.state.toLowerCase() });
    }

    // Filter by country
    if (query.country) {
      sqlQuery += ' AND c.market.country = @country';
      parameters.push({ name: '@country', value: query.country.toUpperCase() });
    }

    // Filter by verified status
    if (query.verified !== undefined) {
      sqlQuery += ' AND c.status.verified = @verified';
      parameters.push({ name: '@verified', value: query.verified });
    }

    // Filter by approved status
    if (query.approved !== undefined) {
      sqlQuery += ' AND c.status.approved = @approved';
      parameters.push({ name: '@approved', value: query.approved });
    }

    // Filter by blocked status
    if (query.blocked !== undefined) {
      sqlQuery += ' AND c.status.blocked = @blocked';
      parameters.push({ name: '@blocked', value: query.blocked });
    }

    // Filter by user membership
    if (query.userId) {
      sqlQuery += ' AND ARRAY_CONTAINS(c.users, {\"userId\": @userId}, true)';
      parameters.push({ name: '@userId', value: query.userId });
    }

    // Order by creation date
    sqlQuery += ' ORDER BY c.audit.createdAt DESC';

    const { items, continuationToken } = await this.cosmosService.queryItems<SellerDocument>(
      this.SELLERS_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((seller) => this.toPublicSeller(seller)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single seller by ID
   */
  async findOne(id: string, requestingUserId: string, isAdmin: boolean): Promise<PublicSeller> {
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      id,
      id,
    );

    if (!seller) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller not found',
      });
    }

    // Check if user has access to this seller
    const isMember = seller.users.some((u) => u.userId === requestingUserId);
    if (!isAdmin && !isMember) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have access to this seller',
      });
    }

    return this.toPublicSeller(seller);
  }

  /**
   * Create new seller (dealer or private)
   */
  async create(dto: CreateSellerDto, country: string, createdBy: string): Promise<PublicSeller> {
    // Validate seller type matches provided details
    if (dto.sellerType === 'dealer' && !dto.dealerDetails) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Dealer details are required for dealer sellers',
      });
    }

    if (dto.sellerType === 'private' && !dto.privateDetails) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Private details are required for private sellers',
      });
    }

    const now = new Date().toISOString();
    const sellerId = this.cosmosService.generateId();

    const seller: SellerDocument = {
      id: sellerId,
      sellerType: dto.sellerType,
      profile: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        address: dto.address,
      },
      market: {
        country: country,
        allowedCountries: [country],
        source: 'web',
      },
      dealerDetails: dto.dealerDetails
        ? {
            companyName: dto.dealerDetails.companyName,
            media: {
              logo: dto.dealerDetails.logoUrl || null,
              banner: dto.dealerDetails.bannerUrl || null,
            },
            dealerType: dto.dealerDetails.dealerType,
            dealerGroupId: dto.dealerDetails.dealerGroupId || null,
            businessType: dto.dealerDetails.businessType,
            licensePhoto: dto.dealerDetails.licensePhotoUrl || null,
            licenseNumber: dto.dealerDetails.licenseNumber || null,
            licenseExpiration: dto.dealerDetails.licenseExpiration || null,
            licenseStatus: 'pending',
            resaleCertificatePhoto: null,
            sellersPermitPhoto: null,
            owner: {
              isOwner: true,
              name: dto.dealerDetails.companyName,
              email: dto.email,
            },
            insuranceDetails: {
              provider: dto.dealerDetails.insuranceProvider || null,
              policyNumber: dto.dealerDetails.insurancePolicyNumber || null,
              expirationDate: dto.dealerDetails.insuranceExpiration || null,
            },
            syndicationSystem: dto.dealerDetails.syndicationSystem || 'none',
            syndicationApiKey: dto.dealerDetails.syndicationApiKey || null,
            businessSite: {},
            businessSiteLocations: dto.dealerDetails.businessSiteLocations || [],
          }
        : null,
      privateDetails: dto.privateDetails
        ? {
            fullName: dto.privateDetails.fullName,
            idVerificationPhoto: dto.privateDetails.idVerificationPhotoUrl || null,
          }
        : null,
      users: dto.users.map((user) => ({
        userId: user.userId,
        role: user.role,
        joinedAt: now,
        invitedBy: createdBy,
      })),
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
        createdBy: createdBy,
        updatedBy: createdBy,
      },
    };

    const createdSeller = await this.cosmosService.createItem(
      this.SELLERS_CONTAINER,
      seller,
    );

    return this.toPublicSeller(createdSeller);
  }

  /**
   * Update seller profile
   */
  async update(
    id: string,
    dto: UpdateSellerDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicSeller> {
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      id,
      id,
    );

    if (!seller) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller not found',
      });
    }

    // Check if user has access to update this seller
    const isMember = seller.users.some((u) => u.userId === requestingUserId);
    if (!isAdmin && !isMember) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to update this seller',
      });
    }

    // Update profile fields
    if (dto.email !== undefined) {
      seller.profile.email = dto.email.toLowerCase();
    }
    if (dto.phone !== undefined) {
      seller.profile.phone = dto.phone;
    }
    if (dto.address !== undefined) {
      seller.profile.address = {
        ...seller.profile.address,
        ...dto.address,
      };
    }

    // Update dealer details
    if (seller.sellerType === 'dealer' && seller.dealerDetails) {
      if (dto.companyName !== undefined) {
        seller.dealerDetails.companyName = dto.companyName;
      }
      if (dto.logoUrl !== undefined) {
        seller.dealerDetails.media.logo = dto.logoUrl;
      }
      if (dto.bannerUrl !== undefined) {
        seller.dealerDetails.media.banner = dto.bannerUrl;
      }
      if (dto.dealerType !== undefined) {
        seller.dealerDetails.dealerType = dto.dealerType;
      }
      if (dto.businessType !== undefined) {
        seller.dealerDetails.businessType = dto.businessType;
      }
      if (dto.licensePhotoUrl !== undefined) {
        seller.dealerDetails.licensePhoto = dto.licensePhotoUrl;
      }
      if (dto.licenseNumber !== undefined) {
        seller.dealerDetails.licenseNumber = dto.licenseNumber;
      }
      if (dto.licenseExpiration !== undefined) {
        seller.dealerDetails.licenseExpiration = dto.licenseExpiration;
      }
      if (dto.insuranceProvider !== undefined) {
        seller.dealerDetails.insuranceDetails.provider = dto.insuranceProvider;
      }
      if (dto.insurancePolicyNumber !== undefined) {
        seller.dealerDetails.insuranceDetails.policyNumber = dto.insurancePolicyNumber;
      }
      if (dto.insuranceExpiration !== undefined) {
        seller.dealerDetails.insuranceDetails.expirationDate = dto.insuranceExpiration;
      }
      if (dto.syndicationSystem !== undefined) {
        seller.dealerDetails.syndicationSystem = dto.syndicationSystem;
      }
      if (dto.syndicationApiKey !== undefined) {
        seller.dealerDetails.syndicationApiKey = dto.syndicationApiKey;
      }
      if (dto.businessSiteLocations !== undefined) {
        seller.dealerDetails.businessSiteLocations = dto.businessSiteLocations;
      }
    }

    // Update private details
    if (seller.sellerType === 'private' && seller.privateDetails) {
      if (dto.fullName !== undefined) {
        seller.privateDetails.fullName = dto.fullName;
      }
      if (dto.idVerificationPhotoUrl !== undefined) {
        seller.privateDetails.idVerificationPhoto = dto.idVerificationPhotoUrl;
      }
    }

    // Update audit fields
    seller.audit.updatedAt = new Date().toISOString();
    seller.audit.updatedBy = requestingUserId;

    const updatedSeller = await this.cosmosService.updateItem(
      this.SELLERS_CONTAINER,
      seller,
      seller.id,
    );

    return this.toPublicSeller(updatedSeller);
  }

  /**
   * Update seller status (Admin only)
   */
  async updateStatus(id: string, dto: UpdateSellerStatusDto): Promise<PublicSeller> {
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      id,
      id,
    );

    if (!seller) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller not found',
      });
    }

    // Update status fields
    if (dto.verified !== undefined) {
      seller.status.verified = dto.verified;
    }
    if (dto.approved !== undefined) {
      seller.status.approved = dto.approved;
    }
    if (dto.blocked !== undefined) {
      seller.status.blocked = dto.blocked;
      seller.status.blockedReason = dto.blocked ? dto.blockedReason || 'No reason provided' : null;
    }

    // Update license status if provided (dealers only)
    if (dto.licenseStatus !== undefined && seller.dealerDetails) {
      seller.dealerDetails.licenseStatus = dto.licenseStatus;
    }

    seller.audit.updatedAt = new Date().toISOString();

    const updatedSeller = await this.cosmosService.updateItem(
      this.SELLERS_CONTAINER,
      seller,
      seller.id,
    );

    return this.toPublicSeller(updatedSeller);
  }

  /**
   * Update seller meta (Admin only - typically updated by system)
   */
  async updateMeta(id: string, dto: UpdateSellerMetaDto): Promise<PublicSeller> {
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      id,
      id,
    );

    if (!seller) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller not found',
      });
    }

    // Update meta fields
    if (dto.totalListings !== undefined) {
      seller.meta.totalListings = dto.totalListings;
    }
    if (dto.activeListings !== undefined) {
      seller.meta.activeListings = dto.activeListings;
    }
    if (dto.soldListings !== undefined) {
      seller.meta.soldListings = dto.soldListings;
    }
    if (dto.averageRating !== undefined) {
      seller.meta.averageRating = dto.averageRating;
    }
    if (dto.totalReviews !== undefined) {
      seller.meta.totalReviews = dto.totalReviews;
    }
    if (dto.totalSales !== undefined) {
      seller.meta.totalSales = dto.totalSales;
    }

    seller.audit.updatedAt = new Date().toISOString();

    const updatedSeller = await this.cosmosService.updateItem(
      this.SELLERS_CONTAINER,
      seller,
      seller.id,
    );

    return this.toPublicSeller(updatedSeller);
  }

  /**
   * Update seller users (staff/team management)
   */
  async updateUsers(
    id: string,
    dto: UpdateSellerUsersDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicSeller> {
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      id,
      id,
    );

    if (!seller) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller not found',
      });
    }

    // Check if user has access to manage users for this seller
    const isMember = seller.users.some((u) => u.userId === requestingUserId);
    if (!isAdmin && !isMember) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to manage users for this seller',
      });
    }

    const now = new Date().toISOString();

    // Update users array
    seller.users = dto.users.map((user) => {
      // Check if user already exists
      const existingUser = seller.users.find((u) => u.userId === user.userId);
      return {
        userId: user.userId,
        role: user.role,
        joinedAt: existingUser?.joinedAt || now,
        invitedBy: existingUser?.invitedBy || requestingUserId,
      };
    });

    seller.audit.updatedAt = now;
    seller.audit.updatedBy = requestingUserId;

    const updatedSeller = await this.cosmosService.updateItem(
      this.SELLERS_CONTAINER,
      seller,
      seller.id,
    );

    return this.toPublicSeller(updatedSeller);
  }

  /**
   * Helper: Convert SellerDocument to PublicSeller
   */
  private toPublicSeller(seller: SellerDocument): PublicSeller {
    // Remove sensitive fields like syndicationApiKey and syndicationSystem from response
    if (seller.dealerDetails) {
      const { syndicationSystem, syndicationApiKey, ...safeDealerDetails } = seller.dealerDetails;
      return {
        ...seller,
        dealerDetails: safeDealerDetails,
      };
    }

    return seller as PublicSeller;
  }
}
