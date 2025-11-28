import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SkipAuth } from "@/common/decorators/auth.decorators";
import { BillingsService } from "@/modules/billings/billings.service";
import { SubscriptionsService } from "@/modules/subscriptions/subscriptions.service";
import { SubscriptionInvoicesService } from "@/modules/subscriptions/services/subscription-invoices.service";
import { BillingStatus } from "@/modules/billings/interfaces/billing.interface";
import { InvoiceStatus } from "@/modules/subscriptions/interfaces/subscription-invoice.interface";
import { UpdateBillingFromWebhookDto } from "@/modules/billings/dto/update-billing.dto";
import { CreateSubscriptionInvoiceDto } from "@/modules/subscriptions/dto/create-invoice.dto";

/**
 * Unified Webhooks Controller
 * Handles all Stripe webhook events and routes to appropriate service
 */
@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly billingsService: BillingsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: SubscriptionInvoicesService,
  ) {}

  /**
   * Unified Stripe webhook endpoint
   * Routes events to Billings or Subscriptions based on metadata
   */
  @Post("stripe")
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Unified Stripe webhook handler",
    description:
      "Handles all Stripe events and routes to appropriate service (Billings or Subscriptions)",
  })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  @ApiResponse({ status: 400, description: "Invalid signature" })
  async handleStripeWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // TODO: Verify webhook signature
    // const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
    // const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    // try {
    //   event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    // } catch (err) {
    //   this.logger.error(`Webhook signature verification failed: ${err.message}`);
    //   throw new BadRequestException('Invalid signature');
    // }

    // For now, parse the event from body
    const event = (req as any).body;

    if (!event || !event.type) {
      this.logger.warn("Received webhook without event type");
      return { received: true };
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Route based on event type and metadata
    try {
      switch (event.type) {
        // Checkout session events (can be subscription or one-time payment)
        case "checkout.session.completed":
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case "checkout.session.expired":
          await this.handleCheckoutExpired(event.data.object);
          break;

        // Payment intent events (one-time payments)
        case "payment_intent.succeeded":
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;

        // Charge events (refunds)
        case "charge.refunded":
          await this.handleChargeRefunded(event.data.object);
          break;

        // Subscription events
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await this.handleSubscriptionEvent(event);
          break;

        // Invoice events (subscription invoices)
        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        case "invoice.finalized":
          await this.handleInvoiceFinalized(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook event ${event.type}:`,
        error,
      );
      // Still return 200 to acknowledge receipt
    }

    return { received: true };
  }

  /**
   * Handle checkout session completed
   * Routes to Billings or Subscriptions based on mode
   */
  private async handleCheckoutCompleted(session: any) {
    this.logger.log(
      `Processing checkout.session.completed: ${session.id}, mode: ${session.mode}`,
    );

    // Check metadata for payment type
    const paymentType = session.metadata?.paymentType;

    if (session.mode === "payment" || paymentType === "one_time") {
      // One-time payment → Route to Billings
      const updateDto: UpdateBillingFromWebhookDto = {
        stripeSessionId: session.id,
        status: BillingStatus.SUCCESS,
        stripePaymentIntentId: session.payment_intent,
        metadata: {
          paymentStatus: session.payment_status,
          customerEmail: session.customer_email,
        },
      };

      try {
        await this.billingsService.updateFromWebhook(updateDto);
        this.logger.log(`Billing updated for session: ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to update billing for session: ${session.id}`,
          error,
        );
      }
    } else if (session.mode === "subscription") {
      // Subscription → Route to Subscriptions service
      try {
        await this.subscriptionsService.processWebhook(event);
        this.logger.log(
          `Subscription checkout completed for session: ${session.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process subscription for session: ${session.id}`,
          error,
        );
      }
    } else {
      this.logger.warn(
        `Unknown checkout mode: ${session.mode} for session: ${session.id}`,
      );
    }
  }

  /**
   * Handle checkout session expired
   */
  private async handleCheckoutExpired(session: any) {
    this.logger.log(`Processing checkout.session.expired: ${session.id}`);

    const paymentType = session.metadata?.paymentType;

    if (session.mode === "payment" || paymentType === "one_time") {
      const updateDto: UpdateBillingFromWebhookDto = {
        stripeSessionId: session.id,
        status: BillingStatus.EXPIRED,
      };

      try {
        await this.billingsService.updateFromWebhook(updateDto);
        this.logger.log(`Billing expired for session: ${session.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to expire billing for session: ${session.id}`,
          error,
        );
      }
    }
  }

  /**
   * Handle payment intent succeeded
   */
  private async handlePaymentSucceeded(paymentIntent: any) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    // Additional logic can be added here if needed
  }

  /**
   * Handle payment intent failed
   */
  private async handlePaymentFailed(paymentIntent: any) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    // Additional logic can be added here if needed
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: any) {
    this.logger.log(`Charge refunded: ${charge.id}`);
    // Additional logic can be added here if needed
  }

  /**
   * Handle subscription events
   */
  private async handleSubscriptionEvent(event: any) {
    this.logger.log(`Processing subscription event: ${event.type}`);
    try {
      await this.subscriptionsService.processWebhook(event);
    } catch (error) {
      this.logger.error(`Failed to process subscription event:`, error);
    }
  }

  /**
   * Handle invoice payment succeeded
   * Creates a paid invoice record in subscriptionInvoices container
   */
  private async handleInvoicePaymentSucceeded(invoice: any) {
    this.logger.log(
      `Processing invoice.payment_succeeded: ${invoice.id}, subscription: ${invoice.subscription}`,
    );

    try {
      // Check if invoice already exists (idempotency)
      const existing = await this.invoicesService.findByStripeInvoiceId(
        invoice.id,
      );
      if (existing) {
        this.logger.log(
          `Invoice already exists: ${invoice.id}, skipping creation`,
        );
        return;
      }

      // Extract billing period from invoice
      const periodStart = new Date(invoice.period_start * 1000).toISOString();
      const periodEnd = new Date(invoice.period_end * 1000).toISOString();

      // Create invoice record
      const createDto: CreateSubscriptionInvoiceDto = {
        subscriptionId: invoice.subscription || "unknown",
        sellerId: invoice.metadata?.sellerId || invoice.customer || "unknown",
        amount: {
          currency: invoice.currency?.toUpperCase() || "USD",
          total: invoice.total / 100, // Convert from cents
          tax: (invoice.tax || 0) / 100,
          net: (invoice.subtotal || invoice.total) / 100,
        },
        status: InvoiceStatus.PAID,
        paymentMethod: invoice.payment_method_types?.[0] || "card",
        transactionRef: invoice.payment_intent || invoice.id,
        billingPeriod: {
          start: periodStart,
          end: periodEnd,
        },
        stripe: {
          invoiceId: invoice.id,
          paymentIntentId: invoice.payment_intent || "",
          chargeId: invoice.charge || "",
        },
        idempotencyKey: `invoice_${invoice.id}`,
      };

      await this.invoicesService.create(createDto);
      this.logger.log(
        `Invoice record created for Stripe invoice: ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create invoice record for: ${invoice.id}`,
        error,
      );
    }
  }

  /**
   * Handle invoice payment failed
   * Creates a failed invoice record
   */
  private async handleInvoicePaymentFailed(invoice: any) {
    this.logger.log(
      `Processing invoice.payment_failed: ${invoice.id}, subscription: ${invoice.subscription}`,
    );

    try {
      // Check if invoice already exists
      const existing = await this.invoicesService.findByStripeInvoiceId(
        invoice.id,
      );

      if (existing) {
        // Update existing invoice to failed status
        await this.invoicesService.updateByStripeInvoiceId(invoice.id, {
          status: InvoiceStatus.FAILED,
        });
        this.logger.log(`Invoice updated to failed: ${invoice.id}`);
        return;
      }

      // Extract billing period
      const periodStart = new Date(invoice.period_start * 1000).toISOString();
      const periodEnd = new Date(invoice.period_end * 1000).toISOString();

      // Create failed invoice record
      const createDto: CreateSubscriptionInvoiceDto = {
        subscriptionId: invoice.subscription || "unknown",
        sellerId: invoice.metadata?.sellerId || invoice.customer || "unknown",
        amount: {
          currency: invoice.currency?.toUpperCase() || "USD",
          total: invoice.total / 100,
          tax: (invoice.tax || 0) / 100,
          net: (invoice.subtotal || invoice.total) / 100,
        },
        status: InvoiceStatus.FAILED,
        paymentMethod: invoice.payment_method_types?.[0] || "card",
        transactionRef: invoice.payment_intent || invoice.id,
        billingPeriod: {
          start: periodStart,
          end: periodEnd,
        },
        stripe: {
          invoiceId: invoice.id,
          paymentIntentId: invoice.payment_intent || "",
          chargeId: invoice.charge || "",
        },
        idempotencyKey: `invoice_${invoice.id}`,
      };

      await this.invoicesService.create(createDto);
      this.logger.log(
        `Failed invoice record created for Stripe invoice: ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create failed invoice record for: ${invoice.id}`,
        error,
      );
    }
  }

  /**
   * Handle invoice finalized
   * Creates a pending invoice record
   */
  private async handleInvoiceFinalized(invoice: any) {
    this.logger.log(
      `Processing invoice.finalized: ${invoice.id}, subscription: ${invoice.subscription}`,
    );

    try {
      // Check if invoice already exists
      const existing = await this.invoicesService.findByStripeInvoiceId(
        invoice.id,
      );
      if (existing) {
        this.logger.log(
          `Invoice already exists: ${invoice.id}, skipping creation`,
        );
        return;
      }

      // Extract billing period
      const periodStart = new Date(invoice.period_start * 1000).toISOString();
      const periodEnd = new Date(invoice.period_end * 1000).toISOString();

      // Create pending invoice record
      const createDto: CreateSubscriptionInvoiceDto = {
        subscriptionId: invoice.subscription || "unknown",
        sellerId: invoice.metadata?.sellerId || invoice.customer || "unknown",
        amount: {
          currency: invoice.currency?.toUpperCase() || "USD",
          total: invoice.total / 100,
          tax: (invoice.tax || 0) / 100,
          net: (invoice.subtotal || invoice.total) / 100,
        },
        status: InvoiceStatus.PENDING,
        paymentMethod: invoice.payment_method_types?.[0] || "card",
        transactionRef: invoice.payment_intent || invoice.id,
        billingPeriod: {
          start: periodStart,
          end: periodEnd,
        },
        stripe: {
          invoiceId: invoice.id,
          paymentIntentId: invoice.payment_intent || "",
          chargeId: invoice.charge || "",
        },
        idempotencyKey: `invoice_${invoice.id}`,
      };

      await this.invoicesService.create(createDto);
      this.logger.log(
        `Pending invoice record created for Stripe invoice: ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create pending invoice record for: ${invoice.id}`,
        error,
      );
    }
  }
}
