import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { PaginatedResponse } from '@/common/types/pagination.type';
import { ListingDocument, PublicListing, ListingState } from './interfaces/listing.interface';
import { CreateListingDto } from './dto/create-listing.dto';
import {
  UpdateListingDto,
  UpdateListingStatusDto,
  UpdateListingVisibilityDto,
  FeatureListingDto,
} from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listing.dto';
import { SellerDocument } from '@/modules/sellers/interfaces/seller.interface';
import { TaxonomyDocument } from '@/modules/taxonomies/interfaces/taxonomy.interface';

/**
 * Listings Service
 * Handles vehicle listing management
 */
@Injectable()
export class ListingsService {
  private readonly LISTINGS_CONTAINER = 'listings';
  private readonly SELLERS_CONTAINER = 'sellers';
  private readonly TAXONOMIES_CONTAINER = 'taxonomies';

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * List listings with filters and pagination
   */
  async findAll(query: QueryListingsDto): Promise<PaginatedResponse<PublicListing>> {
    let sqlQuery = 'SELECT * FROM c WHERE 1=1';
    const parameters: any[] = [];

    // Search by make, model, or VIN
    if (query.search) {
      sqlQuery += ' AND (CONTAINS(LOWER(c.vehicle.make), @search) OR CONTAINS(LOWER(c.vehicle.model), @search) OR CONTAINS(c.vehicle.vin, @search))';
      parameters.push({ name: '@search', value: query.search.toLowerCase() });
    }

    // Filter by seller
    if (query.sellerId) {
      sqlQuery += ' AND c.sellerId = @sellerId';
      parameters.push({ name: '@sellerId', value: query.sellerId });
    }

    // Filter by make
    if (query.makeId) {
      sqlQuery += ' AND c.vehicle.makeId = @makeId';
      parameters.push({ name: '@makeId', value: query.makeId });
    }

    // Filter by model
    if (query.modelId) {
      sqlQuery += ' AND c.vehicle.modelId = @modelId';
      parameters.push({ name: '@modelId', value: query.modelId });
    }

    // Filter by year range
    if (query.minYear) {
      sqlQuery += ' AND c.vehicle.year >= @minYear';
      parameters.push({ name: '@minYear', value: query.minYear });
    }
    if (query.maxYear) {
      sqlQuery += ' AND c.vehicle.year <= @maxYear';
      parameters.push({ name: '@maxYear', value: query.maxYear });
    }

    // Filter by price range
    if (query.minPrice) {
      sqlQuery += ' AND c.pricing.listPrice >= @minPrice';
      parameters.push({ name: '@minPrice', value: query.minPrice });
    }
    if (query.maxPrice) {
      sqlQuery += ' AND c.pricing.listPrice <= @maxPrice';
      parameters.push({ name: '@maxPrice', value: query.maxPrice });
    }

    // Filter by mileage range
    if (query.minMileage) {
      sqlQuery += ' AND c.vehicle.mileage >= @minMileage';
      parameters.push({ name: '@minMileage', value: query.minMileage });
    }
    if (query.maxMileage) {
      sqlQuery += ' AND c.vehicle.mileage <= @maxMileage';
      parameters.push({ name: '@maxMileage', value: query.maxMileage });
    }

    // Filter by colors
    if (query.exteriorColorId) {
      sqlQuery += ' AND c.vehicle.exteriorColorId = @exteriorColorId';
      parameters.push({ name: '@exteriorColorId', value: query.exteriorColorId });
    }
    if (query.interiorColorId) {
      sqlQuery += ' AND c.vehicle.interiorColorId = @interiorColorId';
      parameters.push({ name: '@interiorColorId', value: query.interiorColorId });
    }

    // Filter by body type
    if (query.bodyTypeId) {
      sqlQuery += ' AND c.vehicle.bodyTypeId = @bodyTypeId';
      parameters.push({ name: '@bodyTypeId', value: query.bodyTypeId });
    }

    // Filter by drivetrain
    if (query.drivetrainId) {
      sqlQuery += ' AND c.vehicle.drivetrainId = @drivetrainId';
      parameters.push({ name: '@drivetrainId', value: query.drivetrainId });
    }

    // Filter by condition
    if (query.condition) {
      sqlQuery += ' AND c.condition.overall = @condition';
      parameters.push({ name: '@condition', value: query.condition });
    }

    // Filter by state
    if (query.state) {
      sqlQuery += ' AND c.status.state = @state';
      parameters.push({ name: '@state', value: query.state });
    }

    // Filter by featured
    if (query.featured !== undefined) {
      sqlQuery += ' AND c.status.featured = @featured';
      parameters.push({ name: '@featured', value: query.featured });
    }

    // Filter by verified
    if (query.verified !== undefined) {
      sqlQuery += ' AND c.status.verified = @verified';
      parameters.push({ name: '@verified', value: query.verified });
    }

    // Filter by FSD capable
    if (query.fsdCapable !== undefined) {
      sqlQuery += ' AND c.vehicle.fsdCapable = @fsdCapable';
      parameters.push({ name: '@fsdCapable', value: query.fsdCapable });
    }

    // Filter by location
    if (query.country) {
      sqlQuery += ' AND c.location.country = @country';
      parameters.push({ name: '@country', value: query.country.toUpperCase() });
    }
    if (query.state_location) {
      sqlQuery += ' AND c.location.state = @state_location';
      parameters.push({ name: '@state_location', value: query.state_location });
    }
    if (query.city) {
      sqlQuery += ' AND LOWER(c.location.city) = @city';
      parameters.push({ name: '@city', value: query.city.toLowerCase() });
    }
    if (query.zipCode) {
      sqlQuery += ' AND c.location.zipCode = @zipCode';
      parameters.push({ name: '@zipCode', value: query.zipCode });
    }

    // Apply sorting
    const sortMap: Record<string, string> = {
      price_asc: 'c.pricing.listPrice ASC',
      price_desc: 'c.pricing.listPrice DESC',
      mileage_asc: 'c.vehicle.mileage ASC',
      mileage_desc: 'c.vehicle.mileage DESC',
      year_asc: 'c.vehicle.year ASC',
      year_desc: 'c.vehicle.year DESC',
      created_asc: 'c.audit.createdAt ASC',
      created_desc: 'c.audit.createdAt DESC',
    };
    const sortBy = query.sortBy || 'created_desc';
    sqlQuery += ` ORDER BY ${sortMap[sortBy] || 'c.audit.createdAt DESC'}`;

    const { items, continuationToken } = await this.cosmosService.queryItems<ListingDocument>(
      this.LISTINGS_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((listing) => this.toPublicListing(listing)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single listing by ID
   */
  async findOne(id: string): Promise<PublicListing> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    // Increment view count
    listing.performance.views += 1;
    listing.performance.lastViewedAt = new Date().toISOString();
    await this.cosmosService.updateItem(this.LISTINGS_CONTAINER, listing, listing.id);

    return this.toPublicListing(listing);
  }

  /**
   * Create new listing
   */
  async create(dto: CreateListingDto, userId: string, country: string): Promise<PublicListing> {
    // Determine seller
    const sellerId = dto.sellerId || userId;

    // Get seller information
    const seller = await this.cosmosService.readItem<SellerDocument>(
      this.SELLERS_CONTAINER,
      sellerId,
      sellerId,
    );

    if (!seller) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Seller not found',
      });
    }

    // Resolve taxonomy names from IDs
    const taxonomies = await this.resolveTaxonomies([
      dto.vehicle.makeId,
      dto.vehicle.modelId,
      dto.vehicle.trimId,
      dto.vehicle.exteriorColorId,
      dto.vehicle.interiorColorId,
      dto.vehicle.bodyTypeId,
      dto.vehicle.drivetrainId,
      dto.vehicle.batterySizeId,
    ].filter(Boolean) as string[]);

    const now = new Date().toISOString();
    const listingId = this.cosmosService.generateId();

    const listing: ListingDocument = {
      id: listingId,
      type: 'listing',
      sellerId: seller.id,
      seller: {
        id: seller.id,
        name: seller.sellerType === 'dealer' ? seller.dealerDetails!.companyName : seller.privateDetails!.fullName,
        type: seller.sellerType,
        rating: seller.meta.averageRating,
        reviewCount: seller.meta.totalReviews,
      },
      vehicle: {
        vin: dto.vehicle.vin,
        // TODO: Update to use new taxonomy structure - these will show as 'Unknown' until resolved
        make: 'Unknown', // taxonomies[dto.vehicle.makeId]?.name || 'Unknown',
        makeId: dto.vehicle.makeId,
        model: 'Unknown', // taxonomies[dto.vehicle.modelId]?.name || 'Unknown',
        modelId: dto.vehicle.modelId,
        trim: null, // dto.vehicle.trimId ? taxonomies[dto.vehicle.trimId]?.name || null : null,
        trimId: dto.vehicle.trimId || null,
        year: dto.vehicle.year,
        mileage: dto.vehicle.mileage,
        exteriorColor: 'Unknown', // taxonomies[dto.vehicle.exteriorColorId]?.name || 'Unknown',
        exteriorColorId: dto.vehicle.exteriorColorId,
        interiorColor: 'Unknown', // taxonomies[dto.vehicle.interiorColorId]?.name || 'Unknown',
        interiorColorId: dto.vehicle.interiorColorId,
        bodyType: 'Unknown', // taxonomies[dto.vehicle.bodyTypeId]?.name || 'Unknown',
        bodyTypeId: dto.vehicle.bodyTypeId,
        drivetrain: 'Unknown', // taxonomies[dto.vehicle.drivetrainId]?.name || 'Unknown',
        drivetrainId: dto.vehicle.drivetrainId,
        batterySize: null, // dto.vehicle.batterySizeId ? taxonomies[dto.vehicle.batterySizeId]?.name || null : null,
        batterySizeId: dto.vehicle.batterySizeId || null,
        batteryHealth: dto.vehicle.batteryHealth ?? null,
        range: dto.vehicle.range ?? null,
        autopilotVersion: dto.vehicle.autopilotVersion || null,
        fsdCapable: dto.vehicle.fsdCapable ?? false,
        specifications: dto.vehicle.specifications || {},
      },
      pricing: {
        listPrice: dto.pricing.listPrice,
        originalPrice: dto.pricing.originalPrice ?? null,
        currency: dto.pricing.currency || 'USD',
        priceHistory: [{
          price: dto.pricing.listPrice,
          changedAt: now,
          changedBy: userId,
          reason: 'Initial listing',
        }],
        negotiable: dto.pricing.negotiable ?? true,
        acceptsOffers: dto.pricing.acceptsOffers ?? true,
        tradeinAccepted: dto.pricing.tradeinAccepted ?? false,
        financingAvailable: dto.pricing.financingAvailable ?? false,
      },
      media: {
        photos: [],
        videos: [],
        documents: [],
      },
      location: {
        country: dto.location.country.toUpperCase(),
        state: dto.location.state,
        city: dto.location.city,
        zipCode: dto.location.zipCode,
        latitude: dto.location.latitude ?? null,
        longitude: dto.location.longitude ?? null,
      },
      features: {
        standard: dto.standardFeatures || [],
        optional: dto.optionalFeatures || [],
        highlights: dto.highlights || [],
      },
      condition: {
        overall: dto.condition.overall,
        exteriorRating: dto.condition.exteriorRating,
        interiorRating: dto.condition.interiorRating,
        mechanicalRating: dto.condition.mechanicalRating,
        description: dto.condition.description,
        knownIssues: dto.condition.knownIssues || [],
        modifications: dto.condition.modifications || [],
        serviceHistory: [],
        accidentHistory: [],
      },
      status: {
        state: 'draft',
        substatus: null,
        publishedAt: null,
        soldAt: null,
        expiresAt: null,
        featured: false,
        featuredUntil: null,
        verified: false,
        verifiedAt: null,
      },
      visibility: {
        isPublic: false,
        showSellerInfo: true,
        showPricing: true,
        allowMessages: true,
        allowOffers: true,
      },
      performance: {
        views: 0,
        uniqueViews: 0,
        favorites: 0,
        shares: 0,
        inquiries: 0,
        offers: 0,
        lastViewedAt: null,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      },
    };

    const createdListing = await this.cosmosService.createItem(
      this.LISTINGS_CONTAINER,
      listing,
    );

    return this.toPublicListing(createdListing);
  }

  /**
   * Update listing
   */
  async update(
    id: string,
    dto: UpdateListingDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<PublicListing> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    // Check access
    if (!isAdmin && listing.sellerId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to update this listing',
      });
    }

    // Update fields
    if (dto.mileage !== undefined) {
      listing.vehicle.mileage = dto.mileage;
    }

    if (dto.listPrice !== undefined) {
      listing.pricing.priceHistory.push({
        price: dto.listPrice,
        changedAt: new Date().toISOString(),
        changedBy: userId,
        reason: dto.priceChangeReason || 'Price update',
      });
      listing.pricing.listPrice = dto.listPrice;
    }

    if (dto.negotiable !== undefined) {
      listing.pricing.negotiable = dto.negotiable;
    }
    if (dto.acceptsOffers !== undefined) {
      listing.pricing.acceptsOffers = dto.acceptsOffers;
    }
    if (dto.tradeinAccepted !== undefined) {
      listing.pricing.tradeinAccepted = dto.tradeinAccepted;
    }
    if (dto.financingAvailable !== undefined) {
      listing.pricing.financingAvailable = dto.financingAvailable;
    }

    if (dto.conditionDescription !== undefined) {
      listing.condition.description = dto.conditionDescription;
    }
    if (dto.knownIssues !== undefined) {
      listing.condition.knownIssues = dto.knownIssues;
    }
    if (dto.modifications !== undefined) {
      listing.condition.modifications = dto.modifications;
    }
    if (dto.highlights !== undefined) {
      listing.features.highlights = dto.highlights;
    }

    listing.audit.updatedAt = new Date().toISOString();
    listing.audit.updatedBy = userId;

    const updatedListing = await this.cosmosService.updateItem(
      this.LISTINGS_CONTAINER,
      listing,
      listing.id,
    );

    return this.toPublicListing(updatedListing);
  }

  /**
   * Update listing status
   */
  async updateStatus(
    id: string,
    dto: UpdateListingStatusDto,
    userId: string,
  ): Promise<PublicListing> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    const now = new Date().toISOString();

    // Update status
    listing.status.state = dto.state;
    listing.status.substatus = dto.substatus || null;

    // Handle state transitions
    if (dto.state === 'published' && !listing.status.publishedAt) {
      listing.status.publishedAt = now;
      listing.visibility.isPublic = true;
    }

    if (dto.state === 'sold') {
      listing.status.soldAt = now;
      listing.visibility.isPublic = false;
    }

    listing.audit.updatedAt = now;
    listing.audit.updatedBy = userId;

    const updatedListing = await this.cosmosService.updateItem(
      this.LISTINGS_CONTAINER,
      listing,
      listing.id,
    );

    return this.toPublicListing(updatedListing);
  }

  /**
   * Update listing visibility
   */
  async updateVisibility(
    id: string,
    dto: UpdateListingVisibilityDto,
    userId: string,
  ): Promise<PublicListing> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    // Update visibility settings
    if (dto.isPublic !== undefined) {
      listing.visibility.isPublic = dto.isPublic;
    }
    if (dto.showSellerInfo !== undefined) {
      listing.visibility.showSellerInfo = dto.showSellerInfo;
    }
    if (dto.showPricing !== undefined) {
      listing.visibility.showPricing = dto.showPricing;
    }
    if (dto.allowMessages !== undefined) {
      listing.visibility.allowMessages = dto.allowMessages;
    }
    if (dto.allowOffers !== undefined) {
      listing.visibility.allowOffers = dto.allowOffers;
    }

    listing.audit.updatedAt = new Date().toISOString();
    listing.audit.updatedBy = userId;

    const updatedListing = await this.cosmosService.updateItem(
      this.LISTINGS_CONTAINER,
      listing,
      listing.id,
    );

    return this.toPublicListing(updatedListing);
  }

  /**
   * Feature a listing
   */
  async featureListing(id: string, dto: FeatureListingDto): Promise<PublicListing> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    const now = new Date();
    const featuredUntil = new Date(now.getTime() + dto.durationDays * 24 * 60 * 60 * 1000);

    listing.status.featured = true;
    listing.status.featuredUntil = featuredUntil.toISOString();
    listing.audit.updatedAt = now.toISOString();

    const updatedListing = await this.cosmosService.updateItem(
      this.LISTINGS_CONTAINER,
      listing,
      listing.id,
    );

    return this.toPublicListing(updatedListing);
  }

  /**
   * Delete listing
   */
  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const listing = await this.cosmosService.readItem<ListingDocument>(
      this.LISTINGS_CONTAINER,
      id,
      id,
    );

    if (!listing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Listing not found',
      });
    }

    // Check access
    if (!isAdmin && listing.sellerId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to delete this listing',
      });
    }

    // Soft delete by archiving
    listing.status.state = 'archived';
    listing.visibility.isPublic = false;
    listing.audit.updatedAt = new Date().toISOString();
    listing.audit.updatedBy = userId;

    await this.cosmosService.updateItem(
      this.LISTINGS_CONTAINER,
      listing,
      listing.id,
    );
  }

  /**
   * Helper: Resolve taxonomy IDs to names
   */
  // TODO: BREAKING CHANGE - Update this method to work with new taxonomy structure
  // The new taxonomy structure has one document per category (make, model, etc.)
  // with an options array inside. This method needs to be completely rewritten.
  // For now, returning empty object to allow compilation.
  private async resolveTaxonomies(ids: string[]): Promise<Record<string, any>> {
    // TODO: Implement proper taxonomy resolution with new structure
    // Example: Load 'make' taxonomy, find option by ID, return option.label
    return {};
  }

  /**
   * Helper: Convert ListingDocument to PublicListing
   */
  private toPublicListing(listing: ListingDocument): PublicListing {
    const { vehicle, ...rest } = listing;
    const { vin, ...vehicleWithoutVin } = vehicle;
    const vinLastFour = vin.slice(-4);

    return {
      ...rest,
      vehicle: {
        ...vehicleWithoutVin,
        vinLastFour,
      },
    };
  }
}
