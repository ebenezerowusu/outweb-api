import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosClient, Container } from "@azure/cosmos";
import { VehicleDocument } from "./interfaces/vehicle.interface";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { QueryVehicleDto } from "./dto/query-vehicle.dto";

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);
  private readonly container: Container;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>("COSMOS_ENDPOINT");
    const key = this.configService.get<string>("COSMOS_KEY");
    const databaseName = this.configService.get<string>("COSMOS_DATABASE");

    if (!endpoint || !key || !databaseName) {
      throw new Error("Cosmos DB configuration is missing");
    }

    const client = new CosmosClient({ endpoint, key });
    this.container = client.database(databaseName).container("vehicles");

    this.logger.log("Vehicles service initialized with Cosmos DB");
  }

  /**
   * Create a new vehicle
   */
  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleDocument> {
    const { vin, tags, sync, ...vehicleData } = createVehicleDto;

    // Check if VIN already exists
    const existing = await this.findByVin(vin, false);
    if (existing) {
      throw new ConflictException(
        `Vehicle with VIN ${vin} already exists. Use PATCH to update.`,
      );
    }

    const now = new Date().toISOString();
    const vehicle: VehicleDocument = {
      id: `veh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      vin,
      make: vehicleData.make,
      model: vehicleData.model,
      trim: vehicleData.trim,
      year: vehicleData.year,
      bodyStyle: vehicleData.bodyStyle,
      specification: vehicleData.specification,
      battery: vehicleData.battery,
      performance: vehicleData.performance,
      features: {
        ...vehicleData.features,
        extras: vehicleData.features.extras || [],
      },
      sync: sync
        ? {
            externalRefs: {
              carfaxId: sync.externalRefs.carfaxId || null,
              autotraderId: sync.externalRefs.autotraderId || null,
            },
            isDuplicate: sync.isDuplicate,
          }
        : {
            externalRefs: {
              carfaxId: null,
              autotraderId: null,
            },
            isDuplicate: false,
          },
      metadata: {
        createdBy: "system", // TODO: Get from auth context
        createdAt: now,
        updatedAt: now,
        tags: tags || [],
      },
    };

    const { resource } = await this.container.items.create(vehicle);
    if (!resource) {
      throw new Error("Failed to create vehicle");
    }
    this.logger.log(`Created vehicle ${resource.id} with VIN ${vin}`);

    return resource;
  }

  /**
   * Find vehicle by VIN (partition key lookup - very fast)
   */
  async findByVin(
    vin: string,
    throwIfNotFound: boolean = true,
  ): Promise<VehicleDocument | null> {
    try {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.vin = @vin",
        parameters: [{ name: "@vin", value: vin }],
      };

      const { resources } = await this.container.items
        .query<VehicleDocument>(querySpec, { partitionKey: vin })
        .fetchAll();

      if (resources.length === 0) {
        if (throwIfNotFound) {
          throw new NotFoundException(`Vehicle with VIN ${vin} not found`);
        }
        return null;
      }

      return resources[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding vehicle by VIN ${vin}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string): Promise<VehicleDocument> {
    try {
      // Cross-partition query (less efficient than VIN lookup)
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      };

      const { resources } = await this.container.items
        .query<VehicleDocument>(querySpec)
        .fetchAll();

      if (resources.length === 0) {
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }

      return resources[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding vehicle by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find vehicles with filters
   */
  async findAll(query: QueryVehicleDto): Promise<{
    vehicles: VehicleDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, vin, make, model, year } = query;

    // Build dynamic query
    const conditions: string[] = [];
    const parameters: any[] = [];

    if (vin) {
      conditions.push("c.vin = @vin");
      parameters.push({ name: "@vin", value: vin });
    }
    if (make) {
      conditions.push("c.make = @make");
      parameters.push({ name: "@make", value: make });
    }
    if (model) {
      conditions.push("c.model = @model");
      parameters.push({ name: "@model", value: model });
    }
    if (year) {
      conditions.push("c.year = @year");
      parameters.push({ name: "@year", value: year });
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const querySpec = {
      query: `SELECT * FROM c ${whereClause} ORDER BY c.metadata.createdAt DESC OFFSET @offset LIMIT @limit`,
      parameters: [
        ...parameters,
        { name: "@offset", value: (page - 1) * limit },
        { name: "@limit", value: limit },
      ],
    };

    const { resources } = await this.container.items
      .query<VehicleDocument>(querySpec)
      .fetchAll();

    // Get total count
    const countQuery = {
      query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
      parameters,
    };

    const { resources: countResources } = await this.container.items
      .query<number>(countQuery)
      .fetchAll();

    const total = countResources[0] || 0;

    return {
      vehicles: resources,
      total,
      page,
      limit,
    };
  }

  /**
   * Update vehicle (PATCH operation)
   */
  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleDocument> {
    const existing = await this.findById(id);

    const updated: VehicleDocument = {
      id: existing.id,
      vin: existing.vin,
      make: updateVehicleDto.make || existing.make,
      model: updateVehicleDto.model || existing.model,
      trim: updateVehicleDto.trim || existing.trim,
      year: updateVehicleDto.year || existing.year,
      bodyStyle: updateVehicleDto.bodyStyle || existing.bodyStyle,
      specification: updateVehicleDto.specification || existing.specification,
      battery: updateVehicleDto.battery || existing.battery,
      performance: updateVehicleDto.performance || existing.performance,
      features: {
        ...existing.features,
        ...(updateVehicleDto.features || {}),
        extras: updateVehicleDto.features?.extras || existing.features.extras,
      },
      sync: updateVehicleDto.sync
        ? {
            externalRefs: {
              carfaxId: updateVehicleDto.sync.externalRefs.carfaxId || null,
              autotraderId:
                updateVehicleDto.sync.externalRefs.autotraderId || null,
            },
            isDuplicate: updateVehicleDto.sync.isDuplicate,
          }
        : existing.sync,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        tags: updateVehicleDto.tags || existing.metadata.tags,
      },
    };

    const { resource } = await this.container
      .item(id, existing.vin)
      .replace(updated);

    if (!resource) {
      throw new Error("Failed to update vehicle");
    }
    this.logger.log(`Updated vehicle ${id}`);
    return resource;
  }

  /**
   * Upsert vehicle by VIN (create if not exists, update if exists)
   */
  async upsertByVin(
    vehicleData: CreateVehicleDto,
  ): Promise<{ vehicle: VehicleDocument; isNew: boolean }> {
    const existing = await this.findByVin(vehicleData.vin, false);

    if (existing) {
      // Update existing vehicle
      const updated = await this.update(existing.id, vehicleData);
      return { vehicle: updated, isNew: false };
    } else {
      // Create new vehicle
      const created = await this.create(vehicleData);
      return { vehicle: created, isNew: true };
    }
  }

  /**
   * Delete vehicle (soft delete by marking as duplicate or hard delete)
   */
  async remove(id: string): Promise<void> {
    const vehicle = await this.findById(id);
    await this.container.item(id, vehicle.vin).delete();
    this.logger.log(`Deleted vehicle ${id}`);
  }
}
