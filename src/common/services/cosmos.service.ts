import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CosmosClient,
  Database,
  Container,
  FeedResponse,
  Resource,
} from '@azure/cosmos';
import { AppConfig } from '@/config/app.config';

/**
 * Azure Cosmos DB Service
 * Provides connection and helper methods for Cosmos DB operations
 */
@Injectable()
export class CosmosService implements OnModuleInit {
  private readonly logger = new Logger(CosmosService.name);
  private client: CosmosClient;
  private database: Database;

  // Container names from specification
  private readonly containerNames = [
    'users',
    'sellers',
    'sellerGroups',
    'sellerReviews',
    'listings',
    'vehicles',
    'listingOffers',
    'listingOfferChats',
    'listingOfferChatMessages',
    'orders',
    'orderTransactions',
    'subscriptionPlans',
    'userSubscriptions',
    'subscriptionInvoices',
    'billings',
    'notifications',
    'taxonomies',
    'roles',
    'permissions',
  ];

  constructor(private configService: ConfigService<AppConfig>) {}

  async onModuleInit() {
    await this.connect();
  }

  /**
   * Initialize Cosmos DB connection
   */
  private async connect(): Promise<void> {
    try {
      const endpoint = this.configService.get('cosmosEndpoint', { infer: true });
      const key = this.configService.get('cosmosKey', { infer: true });
      const databaseId = this.configService.get('cosmosDatabase', { infer: true });

      this.client = new CosmosClient({ endpoint, key });
      this.database = this.client.database(databaseId);

      this.logger.log(
        `Connected to Cosmos DB: ${databaseId} at ${endpoint}`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to Cosmos DB', error);
      throw error;
    }
  }

  /**
   * Get a Cosmos DB container
   */
  getContainer(containerName: string): Container {
    return this.database.container(containerName);
  }

  /**
   * Check if Cosmos DB connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.database.read();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create an item in a container
   */
  async createItem<T extends Resource>(
    containerName: string,
    item: T,
  ): Promise<T> {
    const container = this.getContainer(containerName);
    const { resource } = await container.items.create(item);
    return resource as T;
  }

  /**
   * Read an item by ID and partition key
   */
  async readItem<T extends Resource>(
    containerName: string,
    id: string,
    partitionKeyValue: string,
  ): Promise<T | null> {
    try {
      const container = this.getContainer(containerName);
      const { resource } = await container.item(id, partitionKeyValue).read<T>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update (replace) an item
   */
  async updateItem<T extends Resource>(
    containerName: string,
    item: T,
    partitionKeyValue: string,
  ): Promise<T> {
    const container = this.getContainer(containerName);
    const { resource } = await container
      .item(item.id, partitionKeyValue)
      .replace(item);
    return resource as T;
  }

  /**
   * Delete an item
   */
  async deleteItem(
    containerName: string,
    id: string,
    partitionKeyValue: string,
  ): Promise<void> {
    const container = this.getContainer(containerName);
    await container.item(id, partitionKeyValue).delete();
  }

  /**
   * Query items with pagination
   */
  async queryItems<T extends Resource>(
    containerName: string,
    query: string,
    parameters?: any[],
    maxItemCount?: number,
    continuationToken?: string,
  ): Promise<{ items: T[]; continuationToken?: string }> {
    const container = this.getContainer(containerName);

    const querySpec = {
      query,
      parameters: parameters || [],
    };

    const queryIterator = container.items.query<T>(querySpec, {
      maxItemCount: maxItemCount || 20,
      continuationToken: continuationToken,
    });

    const response: FeedResponse<T> = await queryIterator.fetchNext();

    return {
      items: response.resources,
      continuationToken: response.continuationToken,
    };
  }

  /**
   * Get Cosmos Client (for advanced operations)
   */
  getClient(): CosmosClient {
    return this.client;
  }

  /**
   * Get Database (for advanced operations)
   */
  getDatabase(): Database {
    return this.database;
  }
}
