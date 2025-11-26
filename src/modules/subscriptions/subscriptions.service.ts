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
  SubscriptionDocument,
  PublicSubscription,
  InvoiceDocument,
  PublicInvoice,
  SubscriptionFeatures,
} from "./interfaces/subscription.interface";
import {
  CreateCheckoutSessionDto,
  CreateOneTimeCheckoutDto,
  CreateSubscriptionFromWebhookDto,
} from "./dto/create-subscription.dto";
import {
  UpdateSubscriptionPlanDto,
  CancelSubscriptionDto,
} from "./dto/update-subscription.dto";
import {
  QuerySubscriptionsDto,
  QueryInvoicesDto,
} from "./dto/query-subscription.dto";

/**
 * Subscriptions Service
 * Handles subscription management and Stripe integration
 */
@Injectable()
export class SubscriptionsService {
  private readonly SUBSCRIPTIONS_CONTAINER = "subscriptions";
  private readonly INVOICES_CONTAINER = "invoices";

  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get subscription plan features based on category
   * TODO: Consider moving this to a database-driven approach using the subscription-plans.data.ts
   */
  private getPlanFeatures(
    category: "cashoffer" | "dealer_wholesale" | "dealer_advertising",
  ): SubscriptionFeatures {
    const featuresMap: Record<string, SubscriptionFeatures> = {
      cashoffer: {
        maxListings: 50,
        maxPhotosPerListing: 30,
        maxVideosPerListing: 2,
        featuredListings: 0,
        analytics: true,
        prioritySupport: false,
        apiAccess: false,
        customBranding: false,
        multiLocation: false,
      },
      dealer_wholesale: {
        maxListings: 100,
        maxPhotosPerListing: 40,
        maxVideosPerListing: 3,
        featuredListings: 0,
        analytics: true,
        prioritySupport: false,
        apiAccess: false,
        customBranding: false,
        multiLocation: true,
      },
      dealer_advertising: {
        maxListings: 20,
        maxPhotosPerListing: 30,
        maxVideosPerListing: 2,
        featuredListings: 5,
        analytics: true,
        prioritySupport: true,
        apiAccess: false,
        customBranding: false,
        multiLocation: false,
      },
    };

    return featuresMap[category];
  }

  /**
   * Get price ID for plan using subscription-plans.data.ts structure
   */
  private getPriceId(
    category: "cashoffer" | "dealer_wholesale" | "dealer_advertising",
    interval: "monthly",
  ): string {
    // Map category to Stripe price ID
    const priceIdMap: Record<string, string> = {
      cashoffer: "price_cashoffer_monthly",
      dealer_wholesale: "price_dealer_wholesale_monthly",
      dealer_advertising: "price_dealer_advertising_monthly",
    };

    const priceId = priceIdMap[category];

    if (!priceId) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: `Price ID not configured for ${category} ${interval} plan`,
      });
    }

    return priceId;
  }

  /**
   * Get product ID for plan using subscription-plans.data.ts structure
   */
  private getProductId(
    category: "cashoffer" | "dealer_wholesale" | "dealer_advertising",
  ): string {
    // Map category to Stripe product ID
    const productIdMap: Record<string, string> = {
      cashoffer: "prod_cashoffer",
      dealer_wholesale: "prod_dealer_wholesale",
      dealer_advertising: "prod_dealer_advertising",
    };

    const productId = productIdMap[category];

    if (!productId) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: `Product ID not configured for ${category} plan`,
      });
    }

    return productId;
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    userId: string,
  ): Promise<{ sessionId: string; url: string }> {
    const priceId = this.getPriceId(dto.category, dto.interval);
    const productId = this.getProductId(dto.category);

    // TODO: Integrate with Stripe SDK
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'), { apiVersion: '2023-10-16' });
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price: priceId,
    //     quantity: 1,
    //   }],
    //   customer_email: user.email,
    //   metadata: {
    //     userId: userId,
    //     sellerId: dto.sellerId || '',
    //     category: dto.category,
    //     interval: dto.interval,
    //   },
    //   success_url: dto.successUrl,
    //   cancel_url: dto.cancelUrl,
    // });

    // Placeholder response
    return {
      sessionId: "cs_test_placeholder",
      url: dto.successUrl,
    };
  }

  /**
   * Create Stripe checkout session for one-time payment
   */
  async createOneTimeCheckout(
    dto: CreateOneTimeCheckoutDto,
    userId: string,
  ): Promise<{ sessionId: string; url: string }> {
    // Map product type to Stripe IDs
    const productIdMap: Record<string, string> = {
      featured_listing:
        this.configService.get("stripeProductIdFeaturedListing") ||
        "prod_featured",
      bump_listing:
        this.configService.get("stripeProductIdBumpListing") || "prod_bump",
      highlight_listing:
        this.configService.get("stripeProductIdHighlightListing") ||
        "prod_highlight",
    };

    const priceIdMap: Record<string, string> = {
      featured_listing:
        this.configService.get("stripePriceIdFeaturedListing") ||
        "price_featured",
      bump_listing:
        this.configService.get("stripePriceIdBumpListing") || "price_bump",
      highlight_listing:
        this.configService.get("stripePriceIdHighlightListing") ||
        "price_highlight",
    };

    const productId = productIdMap[dto.productType];
    const priceId = priceIdMap[dto.productType];

    if (!productId || !priceId) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: `Product or price ID not configured for ${dto.productType}`,
      });
    }

    // TODO: Integrate with Stripe SDK
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'), { apiVersion: '2023-10-16' });
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',  // One-time payment (not subscription)
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price: priceId,
    //     quantity: 1,
    //   }],
    //   customer_email: user.email,
    //   metadata: {
    //     userId: userId,
    //     sellerId: dto.sellerId || '',
    //     listingId: dto.listingId,
    //     productType: dto.productType,
    //     paymentType: 'one_time',
    //   },
    //   success_url: dto.successUrl,
    //   cancel_url: dto.cancelUrl,
    // });

    // Placeholder response
    return {
      sessionId: "cs_test_onetime_placeholder",
      url: dto.successUrl,
    };
  }

  /**
   * List subscriptions with filters
   */
  async findAll(
    query: QuerySubscriptionsDto,
  ): Promise<PaginatedResponse<PublicSubscription>> {
    let sqlQuery = "SELECT * FROM c WHERE 1=1";
    const parameters: any[] = [];

    // Filter by user ID
    if (query.userId) {
      sqlQuery += " AND c.userId = @userId";
      parameters.push({ name: "@userId", value: query.userId });
    }

    // Filter by seller ID
    if (query.sellerId) {
      sqlQuery += " AND c.sellerId = @sellerId";
      parameters.push({ name: "@sellerId", value: query.sellerId });
    }

    // Filter by category
    if (query.category) {
      sqlQuery += " AND c.plan.category = @category";
      parameters.push({ name: "@category", value: query.category });
    }

    // Filter by state
    if (query.state) {
      sqlQuery += " AND c.status.state = @state";
      parameters.push({ name: "@state", value: query.state });
    }

    // Order by creation date
    sqlQuery += " ORDER BY c.audit.createdAt DESC";

    const { items, continuationToken } =
      await this.cosmosService.queryItems<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        sqlQuery,
        parameters,
        query.limit,
        query.cursor,
      );

    return {
      items: items.map((sub) => this.toPublicSubscription(sub)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single subscription by ID
   */
  async findOne(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<PublicSubscription> {
    const subscription =
      await this.cosmosService.readItem<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        id,
        id,
      );

    if (!subscription) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Subscription not found",
      });
    }

    // Check access
    if (!isAdmin && subscription.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have access to this subscription",
      });
    }

    return this.toPublicSubscription(subscription);
  }

  /**
   * Create subscription from webhook (internal)
   */
  async createFromWebhook(
    dto: CreateSubscriptionFromWebhookDto,
  ): Promise<PublicSubscription> {
    const now = new Date().toISOString();
    const subscriptionId = this.cosmosService.generateId();

    const subscription: SubscriptionDocument = {
      id: subscriptionId,
      type: "subscription",
      userId: dto.userId,
      sellerId: dto.sellerId,
      plan: {
        category: dto.category,
        interval: dto.interval,
        productId: dto.productId,
        priceId: dto.priceId,
        amount: dto.amount,
        currency: dto.currency,
      },
      stripe: {
        customerId: dto.customerId,
        subscriptionId: dto.subscriptionId,
        checkoutSessionId: dto.checkoutSessionId,
        paymentMethodId: null,
        latestInvoiceId: null,
      },
      billing: {
        currentPeriodStart: dto.currentPeriodStart,
        currentPeriodEnd: dto.currentPeriodEnd,
        cancelAt: null,
        canceledAt: null,
        trialStart: null,
        trialEnd: null,
        nextBillingDate: dto.currentPeriodEnd,
      },
      status: {
        state: dto.status as any,
        paymentStatus: "pending",
        autoRenew: true,
        scheduledChanges: null,
      },
      features: this.getPlanFeatures(dto.category),
      usage: {
        currentListings: 0,
        listingsThisPeriod: 0,
        featuredListingsUsed: 0,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: dto.userId,
        updatedBy: dto.userId,
      },
    };

    const created = await this.cosmosService.createItem(
      this.SUBSCRIPTIONS_CONTAINER,
      subscription,
    );

    return this.toPublicSubscription(created);
  }

  /**
   * Update subscription plan
   */
  async updatePlan(
    id: string,
    dto: UpdateSubscriptionPlanDto,
    userId: string,
  ): Promise<PublicSubscription> {
    const subscription =
      await this.cosmosService.readItem<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        id,
        id,
      );

    if (!subscription) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Subscription not found",
      });
    }

    // Check access
    if (subscription.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have access to this subscription",
      });
    }

    const newPriceId = this.getPriceId(dto.category, dto.interval);
    const newProductId = this.getProductId(dto.category);

    // TODO: Update subscription in Stripe
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'), { apiVersion: '2023-10-16' });
    // await stripe.subscriptions.update(subscription.stripe.subscriptionId, {
    //   items: [{
    //     id: subscription.stripe.subscriptionId,
    //     price: newPriceId,
    //   }],
    //   proration_behavior: dto.prorate ? 'create_prorations' : 'none',
    // });

    // Update subscription document
    subscription.plan.category = dto.category;
    subscription.plan.interval = dto.interval;
    subscription.plan.priceId = newPriceId;
    subscription.plan.productId = newProductId;
    subscription.features = this.getPlanFeatures(dto.category);
    subscription.audit.updatedAt = new Date().toISOString();
    subscription.audit.updatedBy = userId;

    const updated = await this.cosmosService.updateItem(
      this.SUBSCRIPTIONS_CONTAINER,
      subscription,
      subscription.id,
    );

    return this.toPublicSubscription(updated);
  }

  /**
   * Cancel subscription
   */
  async cancel(
    id: string,
    dto: CancelSubscriptionDto,
    userId: string,
  ): Promise<PublicSubscription> {
    const subscription =
      await this.cosmosService.readItem<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        id,
        id,
      );

    if (!subscription) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Subscription not found",
      });
    }

    // Check access
    if (subscription.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have access to this subscription",
      });
    }

    // TODO: Cancel subscription in Stripe
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'), { apiVersion: '2023-10-16' });
    // await stripe.subscriptions.cancel(subscription.stripe.subscriptionId, {
    //   invoice_now: dto.immediately,
    //   prorate: dto.immediately,
    // });

    const now = new Date().toISOString();

    if (dto.immediately) {
      subscription.status.state = "canceled";
      subscription.billing.canceledAt = now;
      subscription.billing.cancelAt = now;
    } else {
      subscription.billing.cancelAt = subscription.billing.currentPeriodEnd;
    }

    subscription.status.autoRenew = false;
    subscription.audit.updatedAt = now;
    subscription.audit.updatedBy = userId;

    const updated = await this.cosmosService.updateItem(
      this.SUBSCRIPTIONS_CONTAINER,
      subscription,
      subscription.id,
    );

    return this.toPublicSubscription(updated);
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivate(id: string, userId: string): Promise<PublicSubscription> {
    const subscription =
      await this.cosmosService.readItem<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        id,
        id,
      );

    if (!subscription) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Subscription not found",
      });
    }

    // Check access
    if (subscription.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have access to this subscription",
      });
    }

    // Can only reactivate if scheduled to cancel
    if (!subscription.billing.cancelAt) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Subscription is not scheduled for cancellation",
      });
    }

    // TODO: Reactivate subscription in Stripe
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'), { apiVersion: '2023-10-16' });
    // await stripe.subscriptions.update(subscription.stripe.subscriptionId, {
    //   cancel_at_period_end: false,
    // });

    subscription.billing.cancelAt = null;
    subscription.billing.canceledAt = null;
    subscription.status.autoRenew = true;
    subscription.audit.updatedAt = new Date().toISOString();
    subscription.audit.updatedBy = userId;

    const updated = await this.cosmosService.updateItem(
      this.SUBSCRIPTIONS_CONTAINER,
      subscription,
      subscription.id,
    );

    return this.toPublicSubscription(updated);
  }

  /**
   * Get invoices for subscription
   */
  async getInvoices(
    subscriptionId: string,
    query: QueryInvoicesDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<PaginatedResponse<PublicInvoice>> {
    // Verify subscription access
    const subscription =
      await this.cosmosService.readItem<SubscriptionDocument>(
        this.SUBSCRIPTIONS_CONTAINER,
        subscriptionId,
        subscriptionId,
      );

    if (!subscription) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Subscription not found",
      });
    }

    if (!isAdmin && subscription.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You do not have access to this subscription",
      });
    }

    // Query invoices
    let sqlQuery = "SELECT * FROM c WHERE c.subscriptionId = @subscriptionId";
    const parameters: any[] = [
      { name: "@subscriptionId", value: subscriptionId },
    ];

    if (query.status) {
      sqlQuery += " AND c.payment.status = @status";
      parameters.push({ name: "@status", value: query.status });
    }

    sqlQuery += " ORDER BY c.audit.createdAt DESC";

    const { items, continuationToken } =
      await this.cosmosService.queryItems<InvoiceDocument>(
        this.INVOICES_CONTAINER,
        sqlQuery,
        parameters,
        query.limit,
        query.cursor,
      );

    return {
      items: items.map((invoice) => this.toPublicInvoice(invoice)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Process Stripe webhook (internal)
   */
  async processWebhook(event: any): Promise<void> {
    // TODO: Implement webhook processing
    // Handle events like:
    // - checkout.session.completed (for both subscriptions and one-time payments)
    //   * For subscriptions: create subscription document in 'subscriptions' container
    //   * For one-time payments (featured/bump/highlight): create billing document in 'billings' container
    // - customer.subscription.created
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    //
    // To distinguish between subscription and one-time payment checkouts:
    // - Check session.mode: 'subscription' vs 'payment'
    // - Check session.metadata.paymentType: 'subscription' vs 'one_time'
    //
    // One-time payment products:
    // - featured_listing (stripeProductIdFeaturedListing)
    // - bump_listing (stripeProductIdBumpListing)
    // - highlight_listing (stripeProductIdHighlightListing)

    console.log("Webhook received:", event.type);
  }

  /**
   * Helper: Convert SubscriptionDocument to PublicSubscription
   */
  private toPublicSubscription(
    subscription: SubscriptionDocument,
  ): PublicSubscription {
    return subscription;
  }

  /**
   * Helper: Convert InvoiceDocument to PublicInvoice
   */
  private toPublicInvoice(invoice: InvoiceDocument): PublicInvoice {
    return invoice;
  }
}
