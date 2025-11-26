import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { CosmosService } from "@/common/services/cosmos.service";
import {
  TaxonomyDocument,
  TaxonomyOption,
  PublicTaxonomy,
  TaxonomySummary,
} from "./interfaces/taxonomy.interface";
import {
  QueryTaxonomiesDto,
  GetTaxonomyOptionsDto,
  BulkGetTaxonomiesDto,
} from "./dto/query-taxonomy.dto";
import {
  CreateTaxonomyDto,
  AddTaxonomyOptionsDto,
} from "./dto/create-taxonomy.dto";
import {
  UpdateTaxonomyDto,
  UpdateTaxonomyOptionDto,
} from "./dto/update-taxonomy.dto";

/**
 * Taxonomies Service
 * Handles taxonomy categories and options for vehicle classifications
 */
@Injectable()
export class TaxonomiesService {
  private readonly TAXONOMIES_CONTAINER = "taxonomies";

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * GET /taxonomies
   * List all taxonomy categories (lightweight)
   */
  async findAll(
    query: QueryTaxonomiesDto,
  ): Promise<{ data: TaxonomySummary[] }> {
    // Query all taxonomies
    const sqlQuery =
      "SELECT c.id, c.category, c.order, ARRAY_LENGTH(c.options) as optionCount FROM c";

    const { items } = await this.cosmosService.queryItems<{
      id: string;
      category: string;
      order: number;
      optionCount: number;
    }>(this.TAXONOMIES_CONTAINER, sqlQuery, [], 1000);

    // Filter out empty if needed
    let taxonomies = items;
    if (!query.includeEmpty) {
      taxonomies = items.filter((t) => t.optionCount > 0);
    }

    // Sort
    if (query.sortBy === "order") {
      taxonomies.sort((a, b) => a.order - b.order);
    } else {
      taxonomies.sort((a, b) => a.id.localeCompare(b.id));
    }

    return { data: taxonomies };
  }

  /**
   * GET /taxonomies/:categoryId
   * Get a single taxonomy (full object + options)
   */
  async findOne(
    categoryId: string,
    query: GetTaxonomyOptionsDto,
  ): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Filter and sort options
    let options = taxonomy.options;

    // Filter by activeOnly
    if (query.activeOnly) {
      options = options.filter((opt) => opt.isActive);
    }

    // Filter by make (for model taxonomy)
    if (query.make && categoryId === "model") {
      options = options.filter((opt) => opt.make === query.make);
    }

    // Search by query
    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      options = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm),
      );
    }

    // Sort
    if (query.sortBy === "label") {
      options.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      options.sort((a, b) => a.order - b.order);
    }

    // Limit results
    if (query.limit) {
      options = options.slice(0, query.limit);
    }

    return {
      ...taxonomy,
      options,
    };
  }

  /**
   * GET /taxonomies/:categoryId/options
   * Get options for a taxonomy (for select dropdowns)
   */
  async findOptions(
    categoryId: string,
    query: GetTaxonomyOptionsDto,
  ): Promise<{
    data: TaxonomyOption[];
    meta: {
      categoryId: string;
      categoryLabel: string;
      limit: number;
      cursor: string | null;
    };
  }> {
    const taxonomy = await this.findOne(categoryId, query);

    return {
      data: taxonomy.options,
      meta: {
        categoryId: taxonomy.id,
        categoryLabel: this.getCategoryLabel(taxonomy.category),
        limit: query.limit || 100,
        cursor: null,
      },
    };
  }

  /**
   * GET /taxonomies/bulk
   * Fetch multiple categories in one call
   */
  async findBulk(
    query: BulkGetTaxonomiesDto,
  ): Promise<{ data: Record<string, PublicTaxonomy> }> {
    const categories = query.categories.split(",").map((c) => c.trim());
    const result: Record<string, PublicTaxonomy> = {};

    for (const categoryId of categories) {
      try {
        const taxonomy = await this.findOne(categoryId, {
          activeOnly: query.activeOnly,
          sortBy: "order",
          limit: 1000,
        });
        result[categoryId] = taxonomy;
      } catch (error) {
        // Skip missing taxonomies
        continue;
      }
    }

    return { data: result };
  }

  /**
   * POST /taxonomies
   * Create a new taxonomy category (admin)
   */
  async create(dto: CreateTaxonomyDto): Promise<PublicTaxonomy> {
    // Validate that id equals category
    if (dto.id !== dto.category) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Taxonomy id must equal category",
      });
    }

    // Check if taxonomy already exists
    const existing = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      dto.id,
      dto.category,
    );

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        error: "Conflict",
        message: `Taxonomy '${dto.id}' already exists`,
      });
    }

    // Validate option IDs are unique
    const optionIds = dto.options.map((opt) => opt.id);
    const uniqueIds = new Set(optionIds);
    if (optionIds.length !== uniqueIds.size) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Option IDs must be unique within taxonomy",
      });
    }

    // Validate option values are unique
    const optionValues = dto.options.map((opt) => opt.value);
    const uniqueValues = new Set(optionValues);
    if (optionValues.length !== uniqueValues.size) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Option values must be unique within taxonomy",
      });
    }

    // Validate option slugs are unique (if provided)
    const optionSlugs = dto.options
      .filter((opt) => opt.slug)
      .map((opt) => opt.slug);
    const uniqueSlugs = new Set(optionSlugs);
    if (optionSlugs.length !== uniqueSlugs.size) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Option slugs must be unique within taxonomy",
      });
    }

    const taxonomy: TaxonomyDocument = {
      id: dto.id,
      category: dto.category,
      order: dto.order,
      options: dto.options,
    };

    const created = await this.cosmosService.createItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
    );

    return created;
  }

  /**
   * PATCH /taxonomies/:categoryId
   * Update taxonomy metadata or replace full options
   */
  async update(
    categoryId: string,
    dto: UpdateTaxonomyDto,
  ): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Update order if provided
    if (dto.order !== undefined) {
      taxonomy.order = dto.order;
    }

    // Replace options if provided
    if (dto.options !== undefined) {
      // Validate option IDs are unique
      const optionIds = dto.options.map((opt) => opt.id);
      const uniqueIds = new Set(optionIds);
      if (optionIds.length !== uniqueIds.size) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Option IDs must be unique within taxonomy",
        });
      }

      // Validate option values are unique
      const optionValues = dto.options.map((opt) => opt.value);
      const uniqueValues = new Set(optionValues);
      if (optionValues.length !== uniqueValues.size) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Option values must be unique within taxonomy",
        });
      }

      taxonomy.options = dto.options;
    }

    const updated = await this.cosmosService.updateItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
      categoryId,
    );

    return updated;
  }

  /**
   * POST /taxonomies/:categoryId/options
   * Add one or more options to a taxonomy
   */
  async addOptions(
    categoryId: string,
    dto: AddTaxonomyOptionsDto,
  ): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Validate new option IDs don't conflict with existing
    const existingIds = new Set(taxonomy.options.map((opt) => opt.id));
    const newIds = dto.options.map((opt) => opt.id);
    const conflicts = newIds.filter((id) => existingIds.has(id));
    if (conflicts.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: "Conflict",
        message: `Option IDs already exist: ${conflicts.join(", ")}`,
      });
    }

    // Validate new option values don't conflict
    const existingValues = new Set(taxonomy.options.map((opt) => opt.value));
    const newValues = dto.options.map((opt) => opt.value);
    const valueConflicts = newValues.filter((val) => existingValues.has(val));
    if (valueConflicts.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: "Conflict",
        message: `Option values already exist: ${valueConflicts.join(", ")}`,
      });
    }

    // Add new options
    taxonomy.options = [...taxonomy.options, ...dto.options];

    const updated = await this.cosmosService.updateItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
      categoryId,
    );

    return updated;
  }

  /**
   * PATCH /taxonomies/:categoryId/options/:optionId
   * Update a single option (label, slug, isActive, etc.)
   */
  async updateOption(
    categoryId: string,
    optionId: number,
    dto: UpdateTaxonomyOptionDto,
  ): Promise<PublicTaxonomy> {
    const taxonomy = await this.cosmosService.readItem<TaxonomyDocument>(
      this.TAXONOMIES_CONTAINER,
      categoryId,
      categoryId,
    );

    if (!taxonomy) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Taxonomy '${categoryId}' not found`,
      });
    }

    // Find the option
    const optionIndex = taxonomy.options.findIndex(
      (opt) => opt.id === optionId,
    );
    if (optionIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Option with ID ${optionId} not found in taxonomy '${categoryId}'`,
      });
    }

    // Update option fields
    const option = taxonomy.options[optionIndex];
    if (dto.label !== undefined) option.label = dto.label;
    if (dto.value !== undefined) option.value = dto.value;
    if (dto.slug !== undefined) option.slug = dto.slug;
    if (dto.order !== undefined) option.order = dto.order;
    if (dto.isActive !== undefined) option.isActive = dto.isActive;
    if (dto.make !== undefined) option.make = dto.make;

    // Update any additional fields
    Object.keys(dto).forEach((key) => {
      if (
        !["label", "value", "slug", "order", "isActive", "make"].includes(key)
      ) {
        option[key] = dto[key];
      }
    });

    taxonomy.options[optionIndex] = option;

    const updated = await this.cosmosService.updateItem(
      this.TAXONOMIES_CONTAINER,
      taxonomy,
      categoryId,
    );

    return updated;
  }

  /**
   * DELETE /taxonomies/:categoryId/options/:optionId
   * Soft-delete / disable an option (set isActive = false)
   */
  async deleteOption(categoryId: string, optionId: number): Promise<void> {
    await this.updateOption(categoryId, optionId, { isActive: false });
  }

  /**
   * Helper: Get category label
   */
  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      listingStatus: "Listing Status",
      saleTypes: "Sale Types",
      sellerType: "Seller Type",
      make: "Make",
      model: "Model",
      color: "Color",
      condition: "Condition",
      country: "Country",
      trim: "Trim",
      autopilotPackage: "Autopilot Package",
      dealerBrand: "Dealer Brand",
      wheelType: "Wheel Type",
      interiorColor: "Interior Color",
      exteriorColor: "Exterior Color",
      drivetrain: "Drivetrain",
      bodyStyle: "Body Style",
      insuranceCategory: "Insurance Category",
      feature: "Feature",
      whoYouRepresenting: "Who You Representing",
      businessType: "Business Type",
      syndicationSystem: "Syndication System",
      publishTypes: "Publish Types",
      chargingConnector: "Charging Connector",
      vehicleCondition: "Vehicle Condition",
      vehicleHistoryReport: "Vehicle History Report",
      vehicleModel: "Vehicle Model",
      batterySize: "Battery Size",
      hardwareVersion: "Hardware Version",
    };

    return labels[category] || category;
  }
}
