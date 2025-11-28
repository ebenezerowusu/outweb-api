import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosService } from "@/common/services/cosmos.service";
import { PaginatedResponse } from "@/common/types/pagination.type";
import {
  BillingDocument,
  PublicBilling,
  BillingStatus,
  SellerBillingStats,
  ProductType,
} from "./interfaces/billing.interface";
import { CreateBillingDto } from "./dto/create-billing.dto";
import {
  UpdateBillingStatusDto,
  CreateRefundDto,
  UpdateBillingFromWebhookDto,
} from "./dto/update-billing.dto";
import { QueryBillingsDto } from "./dto/query-billing.dto";

/**
 * Billings Service
 * Handles one-time payment billing management
 */
@Injectable()
export class BillingsService {
  private readonly BILLINGS_CONTAINER = "billings";

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new billing record
   */
  async create(dto: CreateBillingDto): Promise<PublicBilling> {
    const now = new Date().toISOString();
    const billingId = this.cosmosService.generateId();

    const billing: BillingDocument = {
      id: billingId,
      mode: "payment",
      gateway: "stripe",
      productType: dto.productType,
      sellerId: dto.sellerId,
      listingId: dto.listingId,
      currency: dto.currency,
      amount: dto.amount,
      bill: {
        userId: dto.userId,
        status: BillingStatus.PENDING,
        items: [
          {
            price: dto.stripePriceId,
            quantity: 1,
            listingId: dto.listingId,
          },
        ],
      },
      stripeSessionId: dto.stripeSessionId,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      created: now,
      updated: now,
    };

    await this.cosmosService.createItem(this.BILLINGS_CONTAINER, billing);
    return billing;
  }

  /**
   * Find billing by ID
   */
  async findOne(
    id: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PublicBilling> {
    const billing = await this.cosmosService.getItem<BillingDocument>(
      this.BILLINGS_CONTAINER,
      id,
      id,
    );

    if (!billing) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Billing with ID ${id} not found`,
      });
    }

    // Check access permissions
    if (!isAdmin && userId && billing.bill.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have permission to access this billing",
      });
    }

    return billing;
  }

  /**
   * Find billing by Stripe session ID
   */
  async findByStripeSession(
    stripeSessionId: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PublicBilling> {
    const query = "SELECT * FROM c WHERE c.stripeSessionId = @sessionId";
    const parameters = [{ name: "@sessionId", value: stripeSessionId }];

    const result = await this.cosmosService.queryItems<BillingDocument>(
      this.BILLINGS_CONTAINER,
      query,
      parameters,
    );

    if (!result.items || result.items.length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Billing with session ID ${stripeSessionId} not found`,
      });
    }

    const billing = result.items[0];

    // Check access permissions
    if (!isAdmin && userId && billing.bill.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have permission to access this billing",
      });
    }

    return billing;
  }

  /**
   * List billings with filters and pagination
   */
  async findAll(
    query: QueryBillingsDto,
  ): Promise<PaginatedResponse<PublicBilling>> {
    let sqlQuery = "SELECT * FROM c WHERE 1=1";
    const parameters: any[] = [];

    // Filter by user ID
    if (query.userId) {
      sqlQuery += " AND c.bill.userId = @userId";
      parameters.push({ name: "@userId", value: query.userId });
    }

    // Filter by seller ID
    if (query.sellerId) {
      sqlQuery += " AND c.sellerId = @sellerId";
      parameters.push({ name: "@sellerId", value: query.sellerId });
    }

    // Filter by listing ID
    if (query.listingId) {
      sqlQuery += " AND c.listingId = @listingId";
      parameters.push({ name: "@listingId", value: query.listingId });
    }

    // Filter by status
    if (query.status !== undefined) {
      sqlQuery += " AND c.bill.status = @status";
      parameters.push({ name: "@status", value: query.status });
    }

    // Filter by product type
    if (query.productType) {
      sqlQuery += " AND c.productType = @productType";
      parameters.push({ name: "@productType", value: query.productType });
    }

    // Filter by date range
    if (query.from) {
      sqlQuery += " AND c.created >= @from";
      parameters.push({ name: "@from", value: query.from });
    }

    if (query.to) {
      sqlQuery += " AND c.created <= @to";
      parameters.push({ name: "@to", value: query.to });
    }

    // Order by created date descending
    sqlQuery += " ORDER BY c.created DESC";

    const result = await this.cosmosService.queryItems<BillingDocument>(
      this.BILLINGS_CONTAINER,
      sqlQuery,
      parameters,
      query.pageSize || 20,
      query.cursor,
    );

    return {
      items: result.items || [],
      count: result.items?.length || 0,
      nextCursor: result.continuationToken || null,
    };
  }

  /**
   * Update billing status (Admin only)
   */
  async updateStatus(
    id: string,
    dto: UpdateBillingStatusDto,
  ): Promise<PublicBilling> {
    const billing = await this.cosmosService.getItem<BillingDocument>(
      this.BILLINGS_CONTAINER,
      id,
      id,
    );

    if (!billing) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Billing with ID ${id} not found`,
      });
    }

    billing.bill.status = dto.status;
    billing.updated = new Date().toISOString();

    if (dto.statusReason) {
      billing.metadata = {
        ...billing.metadata,
        statusReason: dto.statusReason,
      };
    }

    await this.cosmosService.updateItem(
      this.BILLINGS_CONTAINER,
      billing,
      id,
    );

    return billing;
  }

  /**
   * Update billing from webhook
   */
  async updateFromWebhook(
    dto: UpdateBillingFromWebhookDto,
  ): Promise<PublicBilling> {
    const query = "SELECT * FROM c WHERE c.stripeSessionId = @sessionId";
    const parameters = [{ name: "@sessionId", value: dto.stripeSessionId }];

    const result = await this.cosmosService.queryItems<BillingDocument>(
      this.BILLINGS_CONTAINER,
      query,
      parameters,
    );

    if (!result.items || result.items.length === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Billing with session ID ${dto.stripeSessionId} not found`,
      });
    }

    const billing = result.items[0];
    billing.bill.status = dto.status;
    billing.updated = new Date().toISOString();

    if (dto.stripePaymentIntentId) {
      billing.stripePaymentIntentId = dto.stripePaymentIntentId;
    }

    if (dto.metadata) {
      billing.metadata = {
        ...billing.metadata,
        ...dto.metadata,
      };
    }

    await this.cosmosService.updateItem(
      this.BILLINGS_CONTAINER,
      billing,
      billing.id,
    );

    return billing;
  }

  /**
   * Create refund
   */
  async createRefund(id: string, dto: CreateRefundDto): Promise<PublicBilling> {
    const billing = await this.cosmosService.getItem<BillingDocument>(
      this.BILLINGS_CONTAINER,
      id,
      id,
    );

    if (!billing) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: `Billing with ID ${id} not found`,
      });
    }

    // Validate billing status
    if (billing.bill.status !== BillingStatus.SUCCESS) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Can only refund successful billings",
      });
    }

    // Validate gateway
    if (billing.gateway !== "stripe") {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Only Stripe refunds are supported",
      });
    }

    // TODO: Integrate with Stripe SDK to create actual refund
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'));
    // const refund = await stripe.refunds.create({
    //   payment_intent: billing.stripePaymentIntentId,
    //   amount: dto.amount || billing.amount,
    //   reason: dto.reason,
    // });

    // For now, just update the billing status
    const refundAmount = dto.amount || billing.amount;
    const now = new Date().toISOString();

    billing.bill.status = BillingStatus.REFUNDED;
    billing.refund = {
      provider: "stripe",
      id: "re_placeholder_" + Date.now(),
      amount: refundAmount,
      reason: dto.reason,
      createdAt: now,
    };
    billing.updated = now;

    await this.cosmosService.updateItem(
      this.BILLINGS_CONTAINER,
      billing,
      id,
    );

    return billing;
  }

  /**
   * Get seller billing stats
   */
  async getSellerStats(sellerId: string): Promise<SellerBillingStats> {
    const query = "SELECT * FROM c WHERE c.sellerId = @sellerId";
    const parameters = [{ name: "@sellerId", value: sellerId }];

    const result = await this.cosmosService.queryItems<BillingDocument>(
      this.BILLINGS_CONTAINER,
      query,
      parameters,
    );

    const billings = result.items || [];

    // Calculate stats
    const stats: SellerBillingStats = {
      sellerId,
      currency: billings[0]?.currency || "USD",
      totalBillings: billings.length,
      totalAmount: 0,
      successfulAmount: 0,
      failedAmount: 0,
      refundedAmount: 0,
      byStatus: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
      },
      byProductType: {
        featured_listing: 0,
        bump_listing: 0,
        highlight_listing: 0,
      },
    };

    billings.forEach((billing) => {
      stats.totalAmount += billing.amount;

      if (billing.bill.status === BillingStatus.SUCCESS) {
        stats.successfulAmount += billing.amount;
      } else if (billing.bill.status === BillingStatus.FAILED) {
        stats.failedAmount += billing.amount;
      } else if (billing.bill.status === BillingStatus.REFUNDED) {
        stats.refundedAmount += billing.refund?.amount || billing.amount;
      }

      // Count by status
      stats.byStatus[billing.bill.status] =
        (stats.byStatus[billing.bill.status] || 0) + 1;

      // Count by product type
      stats.byProductType[billing.productType] =
        (stats.byProductType[billing.productType] || 0) + 1;
    });

    return stats;
  }
}
