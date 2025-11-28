import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosService } from "@/common/services/cosmos.service";
import { PaginatedResponse } from "@/common/types/pagination.type";
import {
  SubscriptionInvoiceDocument,
  PublicSubscriptionInvoice,
  InvoiceStatus,
  SellerInvoiceStats,
} from "../interfaces/subscription-invoice.interface";
import { CreateSubscriptionInvoiceDto } from "../dto/create-invoice.dto";
import { UpdateSubscriptionInvoiceDto } from "../dto/update-invoice.dto";
import { QuerySubscriptionInvoicesDto } from "../dto/query-invoice.dto";

/**
 * Subscription Invoices Service
 * Handles subscription invoice management and tracking
 */
@Injectable()
export class SubscriptionInvoicesService {
  private readonly INVOICES_CONTAINER = "subscriptionInvoices";

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new subscription invoice
   * Called by WebhooksModule when Stripe sends invoice events
   */
  async create(
    dto: CreateSubscriptionInvoiceDto,
  ): Promise<PublicSubscriptionInvoice> {
    const now = new Date().toISOString();
    const invoiceId = this.cosmosService.generateId();

    // Check for duplicate using idempotency key if provided
    if (dto.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        return existing; // Return existing invoice (idempotent)
      }
    }

    const invoice: SubscriptionInvoiceDocument = {
      id: invoiceId,
      subscriptionId: dto.subscriptionId,
      sellerId: dto.sellerId,
      amount: dto.amount,
      status: dto.status,
      paymentMethod: dto.paymentMethod,
      transactionRef: dto.transactionRef,
      billingPeriod: dto.billingPeriod,
      stripe: dto.stripe,
      idempotencyKey: dto.idempotencyKey || invoiceId,
      createdAt: now,
    };

    await this.cosmosService.createItem(this.INVOICES_CONTAINER, invoice);

    return this.toPublicInvoice(invoice);
  }

  /**
   * Find invoice by ID
   */
  async findById(
    id: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PublicSubscriptionInvoice> {
    // Use query since we don't know the partition key (sellerId)
    const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
    const parameters = [{ name: "@id", value: id }];

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      throw new NotFoundException(`Invoice '${id}' not found`);
    }

    const invoice = result.items[0];

    // Access control: users can only see their own invoices
    if (!isAdmin && userId && invoice.sellerId !== userId) {
      throw new ForbiddenException("Access denied to this invoice");
    }

    return this.toPublicInvoice(invoice);
  }

  /**
   * Find invoice by Stripe invoice ID
   */
  async findByStripeInvoiceId(
    stripeInvoiceId: string,
  ): Promise<PublicSubscriptionInvoice | null> {
    const sqlQuery = `
      SELECT * FROM c
      WHERE c.stripe.invoiceId = @stripeInvoiceId
    `;

    const parameters = [
      { name: "@stripeInvoiceId", value: stripeInvoiceId },
    ];

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      return null;
    }

    return this.toPublicInvoice(result.items[0]);
  }

  /**
   * Find invoice by idempotency key
   */
  private async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PublicSubscriptionInvoice | null> {
    const sqlQuery = `
      SELECT * FROM c
      WHERE c.idempotencyKey = @idempotencyKey
    `;

    const parameters = [{ name: "@idempotencyKey", value: idempotencyKey }];

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      return null;
    }

    return this.toPublicInvoice(result.items[0]);
  }

  /**
   * Find all invoices with optional filtering
   */
  async findAll(
    query: QuerySubscriptionInvoicesDto,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PaginatedResponse<PublicSubscriptionInvoice>> {
    const conditions: string[] = ["1=1"];
    const parameters: { name: string; value: any }[] = [];

    // Non-admins can only see their own invoices
    if (!isAdmin && userId) {
      conditions.push("c.sellerId = @userId");
      parameters.push({ name: "@userId", value: userId });
    }

    // Filter by seller ID (admin only)
    if (isAdmin && query.sellerId) {
      conditions.push("c.sellerId = @sellerId");
      parameters.push({ name: "@sellerId", value: query.sellerId });
    }

    // Filter by subscription ID
    if (query.subscriptionId) {
      conditions.push("c.subscriptionId = @subscriptionId");
      parameters.push({ name: "@subscriptionId", value: query.subscriptionId });
    }

    // Filter by status
    if (query.status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: query.status });
    }

    // Filter by date range
    if (query.from) {
      conditions.push("c.billingPeriod.start >= @from");
      parameters.push({ name: "@from", value: query.from });
    }

    if (query.to) {
      conditions.push("c.billingPeriod.end <= @to");
      parameters.push({ name: "@to", value: query.to });
    }

    const sqlQuery = `
      SELECT * FROM c
      WHERE ${conditions.join(" AND ")}
      ORDER BY c.createdAt DESC
    `;

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      query.pageSize || 20,
      query.cursor,
    );

    return {
      items: result.items.map((invoice) => this.toPublicInvoice(invoice)),
      count: result.items.length,
      nextCursor: result.continuationToken || null,
    };
  }

  /**
   * Get invoices for a specific subscription
   */
  async findBySubscriptionId(
    subscriptionId: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PublicSubscriptionInvoice[]> {
    const result = await this.findAll(
      { subscriptionId },
      userId,
      isAdmin,
    );

    return result.items;
  }

  /**
   * Get seller's invoice history
   */
  async findBySellerId(
    sellerId: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<PaginatedResponse<PublicSubscriptionInvoice>> {
    // Access control
    if (!isAdmin && userId && sellerId !== userId) {
      throw new ForbiddenException("Access denied to seller invoices");
    }

    return this.findAll({ sellerId }, sellerId, isAdmin);
  }

  /**
   * Update invoice status
   * Used by webhooks to update invoice when payment completes/fails
   */
  async updateStatus(
    invoiceId: string,
    dto: UpdateSubscriptionInvoiceDto,
  ): Promise<PublicSubscriptionInvoice> {
    // Use query since we don't know the partition key
    const sqlQuery = `SELECT * FROM c WHERE c.id = @id`;
    const parameters = [{ name: "@id", value: invoiceId }];

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      1,
    );

    if (result.items.length === 0) {
      throw new NotFoundException(`Invoice '${invoiceId}' not found`);
    }

    const invoice = result.items[0];

    const updated: SubscriptionInvoiceDocument = {
      ...invoice,
      status: dto.status || invoice.status,
    };

    await this.cosmosService.updateItem(
      this.INVOICES_CONTAINER,
      updated,
      invoice.sellerId, // Partition key
    );

    return this.toPublicInvoice(updated);
  }

  /**
   * Update invoice by Stripe invoice ID
   * Used by webhooks when we only have the Stripe invoice ID
   */
  async updateByStripeInvoiceId(
    stripeInvoiceId: string,
    dto: UpdateSubscriptionInvoiceDto,
  ): Promise<PublicSubscriptionInvoice> {
    const existing = await this.findByStripeInvoiceId(stripeInvoiceId);

    if (!existing) {
      throw new NotFoundException(
        `Invoice with Stripe ID '${stripeInvoiceId}' not found`,
      );
    }

    return this.updateStatus(existing.id, dto);
  }

  /**
   * Get seller invoice statistics
   */
  async getSellerStats(
    sellerId: string,
    userId?: string,
    isAdmin: boolean = false,
  ): Promise<SellerInvoiceStats> {
    // Access control
    if (!isAdmin && userId && sellerId !== userId) {
      throw new ForbiddenException("Access denied to seller statistics");
    }

    const sqlQuery = `
      SELECT * FROM c
      WHERE c.sellerId = @sellerId
    `;

    const parameters = [{ name: "@sellerId", value: sellerId }];

    const result = await this.cosmosService.queryItems<SubscriptionInvoiceDocument>(
      this.INVOICES_CONTAINER,
      sqlQuery,
      parameters,
      1000, // Get all invoices for stats (adjust if needed)
    );

    const invoices = result.items;

    const stats: SellerInvoiceStats = {
      sellerId,
      totalInvoices: invoices.length,
      totalPaid: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
      totalPending: invoices.filter((i) => i.status === InvoiceStatus.PENDING)
        .length,
      totalFailed: invoices.filter((i) => i.status === InvoiceStatus.FAILED)
        .length,
      totalRefunded: invoices.filter((i) => i.status === InvoiceStatus.REFUNDED)
        .length,
      totalRevenue: invoices
        .filter((i) => i.status === InvoiceStatus.PAID)
        .reduce((sum, i) => sum + i.amount.total, 0),
      currency: invoices.length > 0 ? invoices[0].amount.currency : "USD",
    };

    return stats;
  }

  /**
   * Convert internal invoice document to public format
   */
  private toPublicInvoice(
    invoice: SubscriptionInvoiceDocument,
  ): PublicSubscriptionInvoice {
    const displayTotal = this.formatAmount(
      invoice.amount.total,
      invoice.amount.currency,
    );

    return {
      id: invoice.id,
      subscriptionId: invoice.subscriptionId,
      sellerId: invoice.sellerId,
      amount: {
        currency: invoice.amount.currency,
        total: invoice.amount.total,
        tax: invoice.amount.tax,
        net: invoice.amount.net,
        displayTotal,
      },
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      transactionRef: invoice.transactionRef,
      billingPeriod: invoice.billingPeriod,
      createdAt: invoice.createdAt,
    };
  }

  /**
   * Format amount for display
   */
  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }
}
