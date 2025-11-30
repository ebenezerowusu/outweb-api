import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosClient, Container } from "@azure/cosmos";
import {
  ListingDocument,
  ListingWithVehicle,
  ListingSearchIndex,
} from "./interfaces/listing.interface";
import { CreateListingUnifiedDto } from "./dto/create-listing-unified.dto";
import { VehiclesService } from "../vehicles/vehicles.service";
import { VehicleDocument } from "../vehicles/interfaces/vehicle.interface";

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);
  private readonly container: Container;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => VehiclesService))
    private vehiclesService: VehiclesService,
  ) {
    const endpoint = this.configService.get<string>("COSMOS_ENDPOINT");
    const key = this.configService.get<string>("COSMOS_KEY");
    const databaseName = this.configService.get<string>("COSMOS_DATABASE");

    if (!endpoint || !key || !databaseName) {
      throw new Error("Cosmos DB configuration is missing");
    }

    const client = new CosmosClient({ endpoint, key });
    this.container = client.database(databaseName).container("listings");

    this.logger.log("Listings service initialized with Cosmos DB");
  }

  /**
   * Create or update listing with interconnected vehicle logic
   * Single payload handles BOTH vehicles + listings containers
   */
  async createOrUpdate(
    dto: CreateListingUnifiedDto,
  ): Promise<ListingWithVehicle> {
    // STEP 1: Handle Vehicle Container (upsert by VIN)
    const { vehicle: vehicleResult, isNew: isNewVehicle } =
      await this.vehiclesService.upsertByVin(dto.vehicle);

    this.logger.log(
      `Vehicle ${isNewVehicle ? "created" : "updated"}: ${vehicleResult.id}`,
    );

    // STEP 2: Handle Listing Container
    const listing = await this.handleListing(dto, vehicleResult);

    // STEP 3: Populate and return
    return {
      ...listing,
      vehicle: vehicleResult,
    };
  }

  /**
   * Handle listing creation or update logic
   */
  private async handleListing(
    dto: CreateListingUnifiedDto,
    vehicle: VehicleDocument,
  ): Promise<ListingDocument> {
    const sellerId = dto.sellerId || "system"; // TODO: Get from auth context

    // Check for existing active listing by this seller for this VIN
    const existingListing = await this.findActiveListingBySellerAndVin(
      sellerId,
      vehicle.vin,
    );

    if (existingListing) {
      // Check if key details changed (ownership transfer, major changes)
      const keyDetailsChanged = this.hasKeyDetailsChanged(existingListing, dto);

      if (keyDetailsChanged) {
        // CREATE NEW listing + mark old as "Sold"
        await this.markAsSold(existingListing.id);
        this.logger.log(
          `Marked listing ${existingListing.id} as sold due to key changes`,
        );
        return await this.createNewListing(dto, vehicle, sellerId);
      } else {
        // UPDATE existing listing
        return await this.updateExistingListing(existingListing, dto, vehicle);
      }
    } else {
      // CREATE new listing
      return await this.createNewListing(dto, vehicle, sellerId);
    }
  }

  /**
   * Create a new listing
   */
  private async createNewListing(
    dto: CreateListingUnifiedDto,
    vehicle: VehicleDocument,
    sellerId: string,
  ): Promise<ListingDocument> {
    const now = new Date().toISOString();
    const shortId = this.generateShortId();
    const slug = this.generateSlug(dto, vehicle);

    const listing: ListingDocument = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      shortId,
      slug,
      vehicleId: vehicle.id,

      seller: {
        id: sellerId,
        type: dto.sellerType || "private",
        displayName: dto.sellerDisplayName || "Unknown Seller",
      },

      status: dto.status,
      saleTypes: dto.saleTypes,
      publishTypes: dto.publishTypes,

      price: dto.price,
      location: dto.location,

      market: {
        country: dto.location.countryCode,
        allowedCountries: dto.allowedCountries || [dto.location.countryCode],
        source: dto.marketSource || "web",
      },

      state: dto.state,

      content: {
        title:
          dto.contentTitle ||
          `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        description: dto.contentDescription || "",
        extra: "",
        seo: {
          canonicalUrl: `https://onlyusedtesla.com/listing/${slug}`,
          metaTitle:
            dto.contentTitle ||
            `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          metaDescription: dto.contentDescription || "",
          openGraphImage: "",
        },
      },

      media: {
        images: [],
        video: { title: null, description: null, url: "" },
      },

      offerSummary: {
        totalOffers: 0,
        highestOffer: null,
        lastOfferAt: null,
      },

      timeline: {
        publishedOn: dto.status === "Published" ? now : null,
        soldOn: null,
        expireOn: null,
      },

      flags: {
        isTest: false,
        isFeatured: false,
        isBoosted: false,
      },

      searchIndex: this.buildSearchIndex(vehicle, dto),

      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: sellerId,
        updatedBy: sellerId,
      },
    };

    const { resource } = await this.container.items.create(listing);
    if (!resource) {
      throw new Error("Failed to create listing");
    }
    this.logger.log(`Created listing ${resource.id} for vehicle ${vehicle.id}`);

    return resource;
  }

  /**
   * Update existing listing
   */
  private async updateExistingListing(
    existing: ListingDocument,
    dto: CreateListingUnifiedDto,
    vehicle: VehicleDocument,
  ): Promise<ListingDocument> {
    const updated: ListingDocument = {
      ...existing,
      status: dto.status,
      saleTypes: dto.saleTypes,
      publishTypes: dto.publishTypes,
      price: dto.price,
      location: dto.location,
      state: dto.state,
      searchIndex: this.buildSearchIndex(vehicle, dto),
      audit: {
        ...existing.audit,
        updatedAt: new Date().toISOString(),
      },
    };

    const { resource } = await this.container
      .item(existing.id, existing.seller.id)
      .replace(updated);

    if (!resource) {
      throw new Error("Failed to update listing");
    }
    this.logger.log(`Updated listing ${existing.id}`);
    return resource;
  }

  /**
   * Find listing by ID and populate vehicle
   */
  async findById(id: string): Promise<ListingWithVehicle> {
    // Cross-partition query
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };

    const { resources } = await this.container.items
      .query<ListingDocument>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    const listing = resources[0];

    // Populate vehicle data
    const vehicle = await this.vehiclesService.findById(listing.vehicleId);

    return {
      ...listing,
      vehicle,
    };
  }

  /**
   * Find active listing by seller and VIN
   */
  private async findActiveListingBySellerAndVin(
    sellerId: string,
    vin: string,
  ): Promise<ListingDocument | null> {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.seller.id = @sellerId AND c.searchIndex.vin = @vin AND c.status != @soldStatus",
      parameters: [
        { name: "@sellerId", value: sellerId },
        { name: "@vin", value: vin },
        { name: "@soldStatus", value: "Sold" },
      ],
    };

    const { resources } = await this.container.items
      .query<ListingDocument>(querySpec, { partitionKey: sellerId })
      .fetchAll();

    return resources.length > 0 ? resources[0] : null;
  }

  /**
   * Check if key details changed (warrants new listing)
   */
  private hasKeyDetailsChanged(
    existing: ListingDocument,
    dto: CreateListingUnifiedDto,
  ): boolean {
    const sellerId = dto.sellerId || "system";

    return (
      existing.seller.id !== sellerId || // Ownership change
      existing.state.titleStatus !== dto.state.titleStatus // Title status change
    );
  }

  /**
   * Mark listing as sold
   */
  private async markAsSold(listingId: string): Promise<void> {
    const listing = await this.findListingById(listingId);

    const updated: ListingDocument = {
      ...listing,
      status: "Sold",
      timeline: {
        ...listing.timeline,
        soldOn: new Date().toISOString(),
      },
    };

    await this.container.item(listingId, listing.seller.id).replace(updated);
  }

  /**
   * Find listing by ID (without vehicle population)
   */
  private async findListingById(id: string): Promise<ListingDocument> {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };

    const { resources } = await this.container.items
      .query<ListingDocument>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return resources[0];
  }

  /**
   * Build denormalized search index
   */
  private buildSearchIndex(
    vehicle: VehicleDocument,
    dto: CreateListingUnifiedDto,
  ): ListingSearchIndex {
    return {
      version: 1,

      // From vehicles
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
      bodyStyle: vehicle.bodyStyle,
      driveTrain: vehicle.performance.driveTrain,
      batteryCapacityKWh: vehicle.battery.capacityKWh,
      rangeEPA: vehicle.battery.rangeEPA,
      chargingPort: vehicle.battery.charging.chargingPort,
      chargerType: vehicle.battery.charging.chargerType,
      enginePowerHP: vehicle.performance.enginePowerHP,
      topSpeedMph: vehicle.performance.topSpeedMph,

      // From listing.state
      condition: dto.state.condition,
      titleStatus: dto.state.titleStatus,
      previousOwners: dto.state.previousOwners,
      mileage: dto.state.mileage.value,
      mileageBucket: this.calculateMileageBucket(dto.state.mileage.value),
      exteriorColor: vehicle.specification.exteriorColor,
      interiorColor: vehicle.specification.interiorColor,
      seats: vehicle.specification.seats,
      autopilotGen: vehicle.features.autopilot,
      hasFSD: vehicle.features.IsFullSelfDriving,
      hasEnhancedAP: false, // TODO: Derive from features
      premiumPackage: vehicle.features.premiumPackage,
      wheelsCode: vehicle.features.wheels,
      isLeased: dto.state.lease.isLeased,
      monthsRemaining: dto.state.lease.monthsRemaining,

      // Listing commercial data
      status: dto.status,
      saleType: dto.saleTypes,
      publishType: dto.publishTypes,
      price: dto.price.amount,
      priceCurrency: dto.price.currency,
      priceBucket: this.calculatePriceBucket(dto.price.amount),

      sellerType: dto.sellerType || "private",
      sellerId: dto.sellerId || "system",
      sellerDisplayName: dto.sellerDisplayName || "Unknown",

      countryCode: dto.location.countryCode,
      state: dto.location.state,
      city: dto.location.city,
      marketCountry: dto.location.countryCode,

      publishedOn: dto.status === "Published" ? new Date().toISOString() : null,
      publishedYearMonth:
        dto.status === "Published"
          ? new Date().toISOString().substring(0, 7)
          : null,
      soldOn: null,
      expireOn: null,

      isFeatured: false,
      isBoosted: false,
      hasVideo: false,
      imageCount: 0,

      totalOffers: 0,
      highestOffer: null,
      lastOfferAt: null,
    };
  }

  /**
   * Generate short ID
   */
  private generateShortId(): string {
    return Math.random().toString(36).substring(2, 7);
  }

  /**
   * Generate SEO slug
   */
  private generateSlug(
    dto: CreateListingUnifiedDto,
    vehicle: VehicleDocument,
  ): string {
    return `${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.specification.exteriorColor}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /**
   * Calculate mileage bucket
   */
  private calculateMileageBucket(mileage: number): string {
    if (mileage < 25000) return "0-25k";
    if (mileage < 50000) return "25k-50k";
    if (mileage < 75000) return "50k-75k";
    if (mileage < 100000) return "75k-100k";
    return "100k+";
  }

  /**
   * Calculate price bucket
   */
  private calculatePriceBucket(price: number): string {
    if (price < 30000) return "0-30k";
    if (price < 40000) return "30k-40k";
    if (price < 50000) return "40k-50k";
    if (price < 60000) return "50k-60k";
    if (price < 70000) return "60k-70k";
    return "70k+";
  }
}
