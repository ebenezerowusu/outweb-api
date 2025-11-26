import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BlobServiceClient } from "@azure/storage-blob";
import { CosmosService } from "@/common/services/cosmos.service";
import { AppConfig } from "@/config/app.config";

@Injectable()
export class HealthService {
  private blobServiceClient: BlobServiceClient;

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    // Initialize Azure Storage client
    const connectionString = this.configService.get(
      "azureStorageConnectionString",
      { infer: true },
    )!;
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
   * Basic health check
   */
  async checkHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "OnlyUsedTesla-API",
      version: "1.0.0",
    };
  }

  /**
   * Cosmos DB health check
   * Returns all databases on the account
   */
  async checkCosmos() {
    try {
      const isHealthy = await this.cosmosService.isHealthy();

      if (!isHealthy) {
        throw new ServiceUnavailableException({
          statusCode: 503,
          error: "Service Unavailable",
          message: "Cosmos DB connection failed",
        });
      }

      // Get all databases on the account
      const databases: any[] = [];
      const client = this.cosmosService.getClient();
      const { resources: dbList } = await client.databases.readAll().fetchAll();

      for (const db of dbList) {
        // Get containers for each database
        const { resources: containerList } = await client
          .database(db.id)
          .containers.readAll()
          .fetchAll();

        databases.push({
          id: db.id,
          _rid: db._rid,
          _self: db._self,
          _ts: db._ts,
          containers: containerList.map((c) => ({
            id: c.id,
            _rid: c._rid,
            partitionKey: c.partitionKey,
          })),
          containerCount: containerList.length,
        });
      }

      return {
        status: "ok",
        service: "cosmos-db",
        timestamp: new Date().toISOString(),
        account: {
          endpoint: this.configService.get("cosmosEndpoint", { infer: true }),
          databaseCount: databases.length,
          databases,
        },
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: "Service Unavailable",
        message: "Cosmos DB connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Azure Storage health check
   * Returns all containers in the storage account
   */
  async checkStorage() {
    try {
      // Get service properties and list all containers
      const properties = await this.blobServiceClient.getProperties();

      const containers: any[] = [];
      for await (const container of this.blobServiceClient.listContainers()) {
        const containerClient = this.blobServiceClient.getContainerClient(
          container.name,
        );

        // Get container properties
        const containerProperties = await containerClient.getProperties();

        // Count blobs in container (optional - can be slow for large containers)
        let blobCount = 0;
        try {
          for await (const _ of containerClient.listBlobsFlat({
            includeMetadata: false,
          })) {
            blobCount++;
            // Limit counting to avoid performance issues
            if (blobCount >= 1000) {
              blobCount = -1; // Indicate "1000+"
              break;
            }
          }
        } catch {
          blobCount = -1; // Error counting
        }

        containers.push({
          name: container.name,
          lastModified: container.properties.lastModified,
          publicAccess: container.properties.publicAccess || "none",
          leaseStatus: container.properties.leaseStatus,
          leaseState: container.properties.leaseState,
          hasImmutabilityPolicy: container.properties.hasImmutabilityPolicy,
          hasLegalHold: container.properties.hasLegalHold,
          blobCount: blobCount === -1 ? "1000+" : blobCount,
          metadata: containerProperties.metadata || {},
        });
      }

      return {
        status: "ok",
        service: "azure-storage",
        timestamp: new Date().toISOString(),
        account: {
          accountName: this.blobServiceClient.accountName,
          url: this.blobServiceClient.url,
          containerCount: containers.length,
          containers,
        },
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: "Service Unavailable",
        message: "Azure Storage connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
