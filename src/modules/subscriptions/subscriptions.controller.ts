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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import {
  CreateCheckoutSessionDto,
  CreateOneTimeCheckoutDto,
} from "./dto/create-subscription.dto";
import {
  UpdateSubscriptionPlanDto,
  CancelSubscriptionDto,
} from "./dto/update-subscription.dto";
import {
  QuerySubscriptionsDto,
  QueryInvoicesDto,
} from "./dto/query-subscription.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

/**
 * Subscriptions Controller
 * Handles subscription management and billing
 */
@ApiTags("Subscriptions")
@Controller("subscriptions")
@ApiBearerAuth("Authorization")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Create Stripe checkout session for subscription
   */
  @Post("checkout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create Stripe checkout session for subscription" })
  @ApiResponse({
    status: 200,
    description: "Checkout session created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createCheckoutSession(
    @Body() createCheckoutDto: CreateCheckoutSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      createCheckoutDto,
      user.sub,
    );
  }

  /**
   * Create Stripe checkout session for one-time payment
   */
  @Post("checkout/one-time")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Create Stripe checkout session for one-time payment (featured/bump/highlight listing)",
  })
  @ApiResponse({
    status: 200,
    description: "One-time checkout session created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createOneTimeCheckout(
    @Body() createOneTimeDto: CreateOneTimeCheckoutDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.createOneTimeCheckout(
      createOneTimeDto,
      user.sub,
    );
  }

  /**
   * List subscriptions
   */
  @Get()
  @ApiOperation({ summary: "List subscriptions (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Subscriptions retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async findAll(@Query() query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }

  /**
   * Get current user's subscription
   */
  @Get("me")
  @ApiOperation({ summary: "Get current user subscription" })
  @ApiResponse({
    status: 200,
    description: "Subscription retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async getMySubscription(@CurrentUser() user: any) {
    // Find subscription by user ID
    const result = await this.subscriptionsService.findAll({
      userId: user.sub,
      limit: 1,
    });
    if (result.items.length === 0) {
      return null;
    }
    return result.items[0];
  }

  /**
   * Get subscription by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get subscription by ID (Owner or Admin)" })
  @ApiParam({ name: "id", description: "Subscription ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.subscriptionsService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Update subscription plan
   */
  @Patch(":id/plan")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update subscription plan (upgrade/downgrade)" })
  @ApiParam({ name: "id", description: "Subscription ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription plan updated successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async updatePlan(
    @Param("id") id: string,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.updatePlan(id, updatePlanDto, user.sub);
  }

  /**
   * Cancel subscription
   */
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel subscription" })
  @ApiParam({ name: "id", description: "Subscription ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription canceled successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async cancel(
    @Param("id") id: string,
    @Body() cancelDto: CancelSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.cancel(id, cancelDto, user.sub);
  }

  /**
   * Reactivate subscription
   */
  @Post(":id/reactivate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reactivate canceled subscription" })
  @ApiParam({ name: "id", description: "Subscription ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription reactivated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Subscription is not scheduled for cancellation",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async reactivate(@Param("id") id: string, @CurrentUser() user: any) {
    return this.subscriptionsService.reactivate(id, user.sub);
  }

  /**
   * Get subscription invoices
   */
  @Get(":id/invoices")
  @ApiOperation({ summary: "Get subscription invoices (Owner or Admin)" })
  @ApiParam({ name: "id", description: "Subscription ID" })
  @ApiResponse({ status: 200, description: "Invoices retrieved successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Subscription not found" })
  async getInvoices(
    @Param("id") id: string,
    @Query() query: QueryInvoicesDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.subscriptionsService.getInvoices(
      id,
      query,
      user.sub,
      hasAdminPermission,
    );
  }
}
