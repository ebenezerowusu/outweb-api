import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosService } from '@/common/services/cosmos.service';
import { AppConfig } from '@/config/app.config';

@Injectable()
export class HealthService {
  private blobServiceClient: BlobServiceClient;

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService<AppConfig>,
  ) {
    // Initialize Azure Storage client
    const connectionString = this.configService.get(
      'azureStorageConnectionString',
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
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OnlyUsedTesla-API',
      version: '1.0.0',
    };
  }

  /**
   * Cosmos DB health check
   */
  async checkCosmos() {
    try {
      const isHealthy = await this.cosmosService.isHealthy();

      if (!isHealthy) {
        throw new ServiceUnavailableException({
          statusCode: 503,
          error: 'Service Unavailable',
          message: 'Cosmos DB connection failed',
        });
      }

      return {
        status: 'ok',
        service: 'cosmos-db',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Cosmos DB connection failed',
      });
    }
  }

  /**
   * Azure Storage health check
   */
  async checkStorage() {
    try {
      // Try to get service properties (lightweight operation)
      await this.blobServiceClient.getProperties();

      return {
        status: 'ok',
        service: 'azure-storage',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Azure Storage connection failed',
      });
    }
  }
}
