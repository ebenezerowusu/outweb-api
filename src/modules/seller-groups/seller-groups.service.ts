import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { PaginatedResponse } from '@/common/types/pagination.type';
import { SellerGroupDocument, PublicSellerGroup } from './interfaces/seller-group.interface';
import { CreateSellerGroupDto } from './dto/create-seller-group.dto';
import {
  UpdateSellerGroupDto,
  UpdateSellerGroupSettingsDto,
  UpdateSellerGroupMembersDto,
  UpdateSellerGroupMetaDto,
} from './dto/update-seller-group.dto';
import { QuerySellerGroupsDto } from './dto/query-seller-groups.dto';

/**
 * Seller Groups Service
 * Handles dealer group organization and multi-location management
 */
@Injectable()
export class SellerGroupsService {
  private readonly SELLER_GROUPS_CONTAINER = 'seller_groups';

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * List seller groups with filters and pagination
   */
  async findAll(query: QuerySellerGroupsDto): Promise<PaginatedResponse<PublicSellerGroup>> {
    let sqlQuery = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    // Filter by name (partial match)
    if (query.name) {
      sqlQuery += ' AND CONTAINS(LOWER(c.profile.name), @name)';
      parameters.push({ name: '@name', value: query.name.toLowerCase() });
    }

    // Filter by email
    if (query.email) {
      sqlQuery += ' AND c.profile.email = @email';
      parameters.push({ name: '@email', value: query.email.toLowerCase() });
    }

    // Filter by city
    if (query.city) {
      sqlQuery += ' AND LOWER(c.headquarters.address.city) = @city';
      parameters.push({ name: '@city', value: query.city.toLowerCase() });
    }

    // Filter by state
    if (query.state) {
      sqlQuery += ' AND LOWER(c.headquarters.address.state) = @state';
      parameters.push({ name: '@state', value: query.state.toLowerCase() });
    }

    // Filter by country
    if (query.country) {
      sqlQuery += ' AND c.headquarters.address.country = @country';
      parameters.push({ name: '@country', value: query.country.toUpperCase() });
    }

    // Filter by seller membership
    if (query.sellerId) {
      sqlQuery += ' AND ARRAY_CONTAINS(c.members, {\"sellerId\": @sellerId}, true)';
      parameters.push({ name: '@sellerId', value: query.sellerId });
    }

    // Order by creation date
    sqlQuery += ' ORDER BY c.audit.createdAt DESC';

    const { items, continuationToken } = await this.cosmosService.queryItems<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((group) => this.toPublicSellerGroup(group)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single seller group by ID
   */
  async findOne(id: string, requestingUserId: string, isAdmin: boolean): Promise<PublicSellerGroup> {
    const group = await this.cosmosService.readItem<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      id,
      id,
    );

    if (!group) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller group not found',
      });
    }

    // TODO: Check if user is a member of any seller in this group
    // For now, we'll allow all authenticated users to view groups
    // In production, you might want to restrict access based on seller membership

    return this.toPublicSellerGroup(group);
  }

  /**
   * Create new seller group
   */
  async create(dto: CreateSellerGroupDto, createdBy: string): Promise<PublicSellerGroup> {
    const now = new Date().toISOString();
    const groupId = this.cosmosService.generateId();

    const group: SellerGroupDocument = {
      id: groupId,
      type: 'seller_group',
      profile: {
        name: dto.name,
        description: dto.description || null,
        media: {
          logo: dto.logoUrl || null,
          banner: dto.bannerUrl || null,
        },
        website: dto.website || null,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
      },
      headquarters: {
        address: {
          street: dto.headquarters.address.street,
          city: dto.headquarters.address.city,
          state: dto.headquarters.address.state,
          zipCode: dto.headquarters.address.zipCode,
          country: dto.headquarters.address.country.toUpperCase(),
        },
        contactPerson: dto.headquarters.contactPerson || null,
        contactEmail: dto.headquarters.contactEmail?.toLowerCase() || null,
        contactPhone: dto.headquarters.contactPhone || null,
      },
      members: dto.members?.map((member) => ({
        sellerId: member.sellerId,
        role: member.role,
        joinedAt: now,
        addedBy: createdBy,
      })) || [],
      settings: {
        sharedInventory: false,
        sharedPricing: false,
        sharedBranding: true,
        allowCrossLocationTransfers: false,
        centralizedPayments: false,
      },
      meta: {
        totalLocations: dto.members?.length || 0,
        totalListings: 0,
        totalSales: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy,
        updatedBy: createdBy,
      },
    };

    const createdGroup = await this.cosmosService.createItem(
      this.SELLER_GROUPS_CONTAINER,
      group,
    );

    return this.toPublicSellerGroup(createdGroup);
  }

  /**
   * Update seller group profile
   */
  async update(
    id: string,
    dto: UpdateSellerGroupDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicSellerGroup> {
    const group = await this.cosmosService.readItem<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      id,
      id,
    );

    if (!group) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller group not found',
      });
    }

    // TODO: Check if user has access to update this group (member of primary seller)
    // For now, we'll require admin permission
    if (!isAdmin) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to update this seller group',
      });
    }

    // Update profile fields
    if (dto.name !== undefined) {
      group.profile.name = dto.name;
    }
    if (dto.description !== undefined) {
      group.profile.description = dto.description;
    }
    if (dto.logoUrl !== undefined) {
      group.profile.media.logo = dto.logoUrl;
    }
    if (dto.bannerUrl !== undefined) {
      group.profile.media.banner = dto.bannerUrl;
    }
    if (dto.website !== undefined) {
      group.profile.website = dto.website;
    }
    if (dto.phone !== undefined) {
      group.profile.phone = dto.phone;
    }
    if (dto.email !== undefined) {
      group.profile.email = dto.email.toLowerCase();
    }

    // Update headquarters
    if (dto.headquarters) {
      if (dto.headquarters.address) {
        group.headquarters.address = {
          ...group.headquarters.address,
          ...dto.headquarters.address,
        };
      }
      if (dto.headquarters.contactPerson !== undefined) {
        group.headquarters.contactPerson = dto.headquarters.contactPerson;
      }
      if (dto.headquarters.contactEmail !== undefined) {
        group.headquarters.contactEmail = dto.headquarters.contactEmail?.toLowerCase() || null;
      }
      if (dto.headquarters.contactPhone !== undefined) {
        group.headquarters.contactPhone = dto.headquarters.contactPhone;
      }
    }

    // Update audit fields
    group.audit.updatedAt = new Date().toISOString();
    group.audit.updatedBy = requestingUserId;

    const updatedGroup = await this.cosmosService.updateItem(
      this.SELLER_GROUPS_CONTAINER,
      group,
      group.id,
    );

    return this.toPublicSellerGroup(updatedGroup);
  }

  /**
   * Update seller group settings
   */
  async updateSettings(
    id: string,
    dto: UpdateSellerGroupSettingsDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicSellerGroup> {
    const group = await this.cosmosService.readItem<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      id,
      id,
    );

    if (!group) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller group not found',
      });
    }

    // TODO: Check if user has access to update settings (member of primary seller)
    if (!isAdmin) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to update group settings',
      });
    }

    // Update settings
    if (dto.sharedInventory !== undefined) {
      group.settings.sharedInventory = dto.sharedInventory;
    }
    if (dto.sharedPricing !== undefined) {
      group.settings.sharedPricing = dto.sharedPricing;
    }
    if (dto.sharedBranding !== undefined) {
      group.settings.sharedBranding = dto.sharedBranding;
    }
    if (dto.allowCrossLocationTransfers !== undefined) {
      group.settings.allowCrossLocationTransfers = dto.allowCrossLocationTransfers;
    }
    if (dto.centralizedPayments !== undefined) {
      group.settings.centralizedPayments = dto.centralizedPayments;
    }

    group.audit.updatedAt = new Date().toISOString();
    group.audit.updatedBy = requestingUserId;

    const updatedGroup = await this.cosmosService.updateItem(
      this.SELLER_GROUPS_CONTAINER,
      group,
      group.id,
    );

    return this.toPublicSellerGroup(updatedGroup);
  }

  /**
   * Update seller group members
   */
  async updateMembers(
    id: string,
    dto: UpdateSellerGroupMembersDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicSellerGroup> {
    const group = await this.cosmosService.readItem<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      id,
      id,
    );

    if (!group) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller group not found',
      });
    }

    // TODO: Check if user has access to manage members (member of primary seller)
    if (!isAdmin) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to manage group members',
      });
    }

    const now = new Date().toISOString();

    // Update members array
    group.members = dto.members.map((member) => {
      // Check if member already exists
      const existingMember = group.members.find((m) => m.sellerId === member.sellerId);
      return {
        sellerId: member.sellerId,
        role: member.role,
        joinedAt: existingMember?.joinedAt || now,
        addedBy: existingMember?.addedBy || requestingUserId,
      };
    });

    // Update total locations
    group.meta.totalLocations = group.members.length;

    group.audit.updatedAt = now;
    group.audit.updatedBy = requestingUserId;

    const updatedGroup = await this.cosmosService.updateItem(
      this.SELLER_GROUPS_CONTAINER,
      group,
      group.id,
    );

    return this.toPublicSellerGroup(updatedGroup);
  }

  /**
   * Update seller group meta (Admin only - typically system updates)
   */
  async updateMeta(id: string, dto: UpdateSellerGroupMetaDto): Promise<PublicSellerGroup> {
    const group = await this.cosmosService.readItem<SellerGroupDocument>(
      this.SELLER_GROUPS_CONTAINER,
      id,
      id,
    );

    if (!group) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Seller group not found',
      });
    }

    // Update meta fields
    if (dto.totalLocations !== undefined) {
      group.meta.totalLocations = dto.totalLocations;
    }
    if (dto.totalListings !== undefined) {
      group.meta.totalListings = dto.totalListings;
    }
    if (dto.totalSales !== undefined) {
      group.meta.totalSales = dto.totalSales;
    }
    if (dto.averageRating !== undefined) {
      group.meta.averageRating = dto.averageRating;
    }
    if (dto.totalReviews !== undefined) {
      group.meta.totalReviews = dto.totalReviews;
    }

    group.audit.updatedAt = new Date().toISOString();

    const updatedGroup = await this.cosmosService.updateItem(
      this.SELLER_GROUPS_CONTAINER,
      group,
      group.id,
    );

    return this.toPublicSellerGroup(updatedGroup);
  }

  /**
   * Helper: Convert SellerGroupDocument to PublicSellerGroup
   */
  private toPublicSellerGroup(group: SellerGroupDocument): PublicSellerGroup {
    return group;
  }
}
