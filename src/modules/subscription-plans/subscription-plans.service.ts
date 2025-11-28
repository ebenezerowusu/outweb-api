import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosService } from "@/common/services/cosmos.service";
import { PaginatedResponse } from "@/common/types/pagination.type";
import {
  SubscriptionPlanDocument,
  PublicSubscriptionPlan,
} from "./interfaces/subscription-plan.interface";
import { CreateSubscriptionPlanDto } from "./dto/create-plan.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-plan.dto";
import { QuerySubscriptionPlansDto } from "./dto/query-plan.dto";

/**
 * Subscription Plans Service
 * Handles subscription plan management (admin operations + public queries)
 */
@Injectable()
export class SubscriptionPlansService {
  private readonly PLANS_CONTAINER = "subscriptionPlans";

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new subscription plan (Admin only)
   */
  async create(
    dto: CreateSubscriptionPlanDto,
  ): Promise<PublicSubscriptionPlan> {
    // Check if plan with same ID already exists
    const existing = await this.findById(dto.id, false);
    if (existing) {
      throw new ConflictException(`Plan with ID '${dto.id}' already exists`);
    }

    const now = new Date().toISOString();

    const plan: SubscriptionPlanDocument = {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      price: dto.price,
      billing: dto.billing,
      features: dto.features,
      ui: dto.ui,
      isActive: dto.isActive ?? true,
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };

    await this.cosmosService.createItem(this.PLANS_CONTAINER, plan);

    return this.toPublicPlan(plan);
  }

  /**
   * Find a plan by ID
   */
  async findById(
    id: string,
    throwIfNotFound: boolean = true,
  ): Promise<PublicSubscriptionPlan | null> {
    try {
      // Since we don't know the partition key (category), use query
      const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
      const parameters = [{ name: "@id", value: id }];

      const result = await this.cosmosService.queryItems<SubscriptionPlanDocument>(
        this.PLANS_CONTAINER,
        sqlQuery,
        parameters,
        1,
      );

      if (result.items.length === 0) {
        if (throwIfNotFound) {
          throw new NotFoundException(`Subscription plan '${id}' not found`);
        }
        return null;
      }

      return this.toPublicPlan(result.items[0]);
    } catch (error) {
      if (throwIfNotFound) {
        throw new NotFoundException(`Subscription plan '${id}' not found`);
      }
      return null;
    }
  }

  /**
   * Find all plans with optional filtering
   */
  async findAll(
    query: QuerySubscriptionPlansDto,
  ): Promise<PaginatedResponse<PublicSubscriptionPlan>> {
    const conditions: string[] = ["1=1"];
    const parameters: { name: string; value: any }[] = [];

    // Filter by category
    if (query.category) {
      conditions.push("c.category = @category");
      parameters.push({ name: "@category", value: query.category });
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      conditions.push("c.isActive = @isActive");
      parameters.push({ name: "@isActive", value: query.isActive });
    }

    // Filter by billing cycle
    if (query.billingCycle) {
      conditions.push("c.billing.cycle = @billingCycle");
      parameters.push({ name: "@billingCycle", value: query.billingCycle });
    }

    const sqlQuery = `
      SELECT * FROM c
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.ui.sortOrder ASC, c.metadata.createdAt DESC
    `;

    const result = await this.cosmosService.queryItems<SubscriptionPlanDocument>(
      this.PLANS_CONTAINER,
      sqlQuery,
      parameters,
      query.pageSize || 20,
      query.cursor,
    );

    return {
      items: result.items.map((plan) => this.toPublicPlan(plan)),
      count: result.items.length,
      nextCursor: result.continuationToken || null,
    };
  }

  /**
   * Find active plans by category
   */
  async findByCategory(
    category: "cashoffer" | "dealer_wholesale" | "dealer_advertising",
  ): Promise<PublicSubscriptionPlan[]> {
    const result = await this.findAll({
      category,
      isActive: true,
    });

    return result.items;
  }

  /**
   * Update a subscription plan (Admin only)
   */
  async update(
    id: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<PublicSubscriptionPlan> {
    // Get existing plan (uses query internally)
    const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
    const parameters = [{ name: "@id", value: id }];

    const result = await this.cosmosService.queryItems<SubscriptionPlanDocument>(
      this.PLANS_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      throw new NotFoundException(`Subscription plan '${id}' not found`);
    }

    const existing = result.items[0];
    const now = new Date().toISOString();

    const updated: SubscriptionPlanDocument = {
      ...existing,
      ...dto,
      id: existing.id, // Preserve ID
      category: existing.category, // Preserve category (partition key)
      metadata: {
        ...existing.metadata,
        updatedAt: now,
      },
    };

    await this.cosmosService.updateItem(
      this.PLANS_CONTAINER,
      updated,
      existing.category,
    );

    return this.toPublicPlan(updated);
  }

  /**
   * Deactivate a plan (soft delete)
   */
  async deactivate(id: string): Promise<PublicSubscriptionPlan> {
    return this.update(id, { isActive: false });
  }

  /**
   * Activate a plan
   */
  async activate(id: string): Promise<PublicSubscriptionPlan> {
    return this.update(id, { isActive: true });
  }

  /**
   * Delete a plan permanently (Admin only - use with caution)
   */
  async delete(id: string): Promise<void> {
    // Get existing plan (uses query internally)
    const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
    const parameters = [{ name: "@id", value: id }];

    const result = await this.cosmosService.queryItems<SubscriptionPlanDocument>(
      this.PLANS_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      throw new NotFoundException(`Subscription plan '${id}' not found`);
    }

    const existing = result.items[0];

    // Check if plan is currently in use (optional - implement based on requirements)
    // This would require querying the subscriptions container

    await this.cosmosService.deleteItem(
      this.PLANS_CONTAINER,
      id,
      existing.category,
    );
  }

  /**
   * Validate that a plan exists and is active
   */
  async validatePlanForSubscription(planId: string): Promise<void> {
    const plan = await this.findById(planId);

    if (!plan) {
      throw new NotFoundException(`Subscription plan '${planId}' not found`);
    }

    if (!plan.isActive) {
      throw new BadRequestException(
        `Subscription plan '${planId}' is not currently available`,
      );
    }
  }

  /**
   * Get plan pricing for a specific billing cycle
   */
  async getPlanPricing(
    planId: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<{ amount: number; currency: string; stripePriceId: string }> {
    // Get plan using query
    const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
    const parameters = [{ name: "@id", value: planId }];

    const result = await this.cosmosService.queryItems<SubscriptionPlanDocument>(
      this.PLANS_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      throw new NotFoundException(`Subscription plan '${planId}' not found`);
    }

    const plan = result.items[0];

    if (!plan.isActive) {
      throw new BadRequestException(
        `Subscription plan '${planId}' is not currently available`,
      );
    }

    if (!plan.billing.supportedCycles.includes(billingCycle)) {
      throw new BadRequestException(
        `Billing cycle '${billingCycle}' is not supported for plan '${planId}'`,
      );
    }

    let stripePriceId: string;

    if (billingCycle === "monthly") {
      stripePriceId = plan.billing.stripe.priceId;
    } else {
      if (!plan.billing.stripe.yearlyPriceId) {
        throw new BadRequestException(
          `Yearly billing is not configured for plan '${planId}'`,
        );
      }
      stripePriceId = plan.billing.stripe.yearlyPriceId;
    }

    return {
      amount: plan.price.amount,
      currency: plan.price.currency,
      stripePriceId,
    };
  }

  /**
   * Convert internal plan document to public format
   */
  private toPublicPlan(plan: SubscriptionPlanDocument): PublicSubscriptionPlan {
    const displayAmount = this.formatAmount(
      plan.price.amount,
      plan.price.currency,
      plan.price.minorUnit,
    );

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      category: plan.category,
      price: {
        currency: plan.price.currency,
        amount: plan.price.amount,
        displayAmount,
      },
      billing: {
        cycle: plan.billing.cycle,
        supportedCycles: plan.billing.supportedCycles,
        trialDays: plan.billing.trialDays,
      },
      features: plan.features,
      ui: plan.ui,
      isActive: plan.isActive,
      createdAt: plan.metadata.createdAt,
      updatedAt: plan.metadata.updatedAt,
    };
  }

  /**
   * Format amount for display
   */
  private formatAmount(
    amount: number,
    currency: string,
    isMinorUnit: boolean,
  ): string {
    const actualAmount = isMinorUnit ? amount / 100 : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(actualAmount);
  }
}
