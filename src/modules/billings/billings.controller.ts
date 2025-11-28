import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { BillingsService } from "./billings.service";
import {
  UpdateBillingStatusDto,
  CreateRefundDto,
  UpdateBillingFromWebhookDto,
} from "./dto/update-billing.dto";
import { QueryBillingsDto } from "./dto/query-billing.dto";
import { CurrentUser, SkipAuth } from "@/common/decorators/auth.decorators";
import { BillingStatus } from "./interfaces/billing.interface";

/**
 * Billings Controller
 * Handles one-time payment billing management
 */
@ApiTags("Billings")
@Controller("billings")
@ApiBearerAuth("Authorization")
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  /**
   * Get billing by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get billing by ID (Owner or Admin)" })
  @ApiParam({ name: "id", description: "Billing ID" })
  @ApiResponse({
    status: 200,
    description: "Billing retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Billing not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.billingsService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Get billing by Stripe session ID
   */
  @Get("by-session/:stripeSessionId")
  @ApiOperation({ summary: "Get billing by Stripe session ID" })
  @ApiParam({ name: "stripeSessionId", description: "Stripe session ID" })
  @ApiResponse({
    status: 200,
    description: "Billing retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Billing not found" })
  async findByStripeSession(
    @Param("stripeSessionId") stripeSessionId: string,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.billingsService.findByStripeSession(
      stripeSessionId,
      user.sub,
      hasAdminPermission,
    );
  }

  /**
   * List billings
   */
  @Get()
  @ApiOperation({ summary: "List billings with filters (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Billings retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async findAll(@Query() query: QueryBillingsDto) {
    return this.billingsService.findAll(query);
  }

  /**
   * Get current user's billing history
   */
  @Get("me/history")
  @ApiOperation({ summary: "Get current user billing history" })
  @ApiResponse({
    status: 200,
    description: "Billing history retrieved successfully",
  })
  async getMyBillings(
    @CurrentUser() user: any,
    @Query() query: QueryBillingsDto,
  ) {
    // Override userId filter with current user
    query.userId = user.sub;
    return this.billingsService.findAll(query);
  }

  /**
   * Update billing status (Admin only)
   */
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update billing status (Admin only)" })
  @ApiParam({ name: "id", description: "Billing ID" })
  @ApiResponse({
    status: 200,
    description: "Billing status updated successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Billing not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateBillingStatusDto,
    @CurrentUser() user: any,
  ) {
    // Check admin permission
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    if (!hasAdminPermission) {
      throw new Error("Insufficient permissions");
    }

    return this.billingsService.updateStatus(id, updateStatusDto);
  }

  /**
   * Create refund
   */
  @Post(":id/refunds")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create refund for billing (Admin only)" })
  @ApiParam({ name: "id", description: "Billing ID" })
  @ApiResponse({
    status: 200,
    description: "Refund created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Billing not found" })
  async createRefund(
    @Param("id") id: string,
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: any,
  ) {
    // Check admin permission
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    if (!hasAdminPermission) {
      throw new Error("Insufficient permissions");
    }

    return this.billingsService.createRefund(id, createRefundDto);
  }

  /**
   * Get seller billing stats
   */
  @Get("stats/seller/:sellerId")
  @ApiOperation({ summary: "Get seller billing statistics" })
  @ApiParam({ name: "sellerId", description: "Seller ID" })
  @ApiResponse({
    status: 200,
    description: "Seller stats retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Seller not found" })
  async getSellerStats(@Param("sellerId") sellerId: string) {
    return this.billingsService.getSellerStats(sellerId);
  }

  /**
   * Stripe webhook endpoint for billings
   */
  @Post("webhook/stripe")
  @SkipAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stripe webhook handler for billings (Internal)" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async handleStripeWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // TODO: Verify webhook signature
    // const stripe = new Stripe(this.configService.get('stripeSecretKey'));
    // const webhookSecret = this.configService.get('stripeWebhookSecret');
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);

    // For now, parse the event from body
    const event = (req as any).body;

    if (!event || !event.type) {
      return { received: true };
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await this.handleCheckoutExpired(event.data.object);
        break;
      case "payment_intent.succeeded":
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentFailed(event.data.object);
        break;
      case "charge.refunded":
        await this.handleChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: any) {
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
      console.log(`Billing updated for session: ${session.id}`);
    } catch (error) {
      console.error(`Failed to update billing for session: ${session.id}`, error);
    }
  }

  /**
   * Handle checkout session expired
   */
  private async handleCheckoutExpired(session: any) {
    const updateDto: UpdateBillingFromWebhookDto = {
      stripeSessionId: session.id,
      status: BillingStatus.EXPIRED,
    };

    try {
      await this.billingsService.updateFromWebhook(updateDto);
      console.log(`Billing expired for session: ${session.id}`);
    } catch (error) {
      console.error(`Failed to expire billing for session: ${session.id}`, error);
    }
  }

  /**
   * Handle payment intent succeeded
   */
  private async handlePaymentSucceeded(paymentIntent: any) {
    // Payment intent events might not have session ID directly
    // We may need to look up by payment_intent ID
    console.log(`Payment succeeded: ${paymentIntent.id}`);
  }

  /**
   * Handle payment intent failed
   */
  private async handlePaymentFailed(paymentIntent: any) {
    console.log(`Payment failed: ${paymentIntent.id}`);
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: any) {
    console.log(`Charge refunded: ${charge.id}`);
  }
}
