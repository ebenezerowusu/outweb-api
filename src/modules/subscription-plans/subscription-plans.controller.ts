import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { CreateSubscriptionPlanDto } from "./dto/create-plan.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-plan.dto";
import { QuerySubscriptionPlansDto } from "./dto/query-plan.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

/**
 * Subscription Plans Controller
 * Public endpoints for viewing plans, Admin endpoints for management
 */
@ApiTags("Subscription Plans")
@Controller("subscription-plans")
@ApiBearerAuth("Authorization")
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  /**
   * List all subscription plans (Public)
   */
  @Get()
  @ApiOperation({
    summary: "List all subscription plans",
    description: "Returns all active subscription plans. Admins can see inactive plans too.",
  })
  @ApiResponse({
    status: 200,
    description: "Subscription plans retrieved successfully",
  })
  async findAll(
    @Query() query: QuerySubscriptionPlansDto,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.permissions?.includes("perm_manage_users");

    // Non-admins can only see active plans
    if (!isAdmin && query.isActive === undefined) {
      query.isActive = true;
    }

    return this.subscriptionPlansService.findAll(query);
  }

  /**
   * Get subscription plan by ID (Public)
   */
  @Get(":id")
  @ApiOperation({ summary: "Get subscription plan by ID" })
  @ApiParam({ name: "id", description: "Subscription plan ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription plan retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Subscription plan not found" })
  async findOne(@Param("id") id: string) {
    return this.subscriptionPlansService.findById(id);
  }

  /**
   * Get plans by category (Public)
   */
  @Get("category/:category")
  @ApiOperation({
    summary: "Get active subscription plans by category",
  })
  @ApiParam({
    name: "category",
    enum: ["cashoffer", "dealer_wholesale", "dealer_advertising"],
  })
  @ApiResponse({
    status: 200,
    description: "Subscription plans retrieved successfully",
  })
  async findByCategory(
    @Param("category") category: "cashoffer" | "dealer_wholesale" | "dealer_advertising",
  ) {
    return this.subscriptionPlansService.findByCategory(category);
  }

  /**
   * Create a new subscription plan (Admin only)
   */
  @Post()
  @ApiOperation({ summary: "Create a new subscription plan (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Subscription plan created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  @ApiResponse({ status: 409, description: "Plan with this ID already exists" })
  async create(
    @Body() dto: CreateSubscriptionPlanDto,
    @CurrentUser() user: any,
  ) {
    this.requireAdmin(user);
    return this.subscriptionPlansService.create(dto);
  }

  /**
   * Update a subscription plan (Admin only)
   */
  @Patch(":id")
  @ApiOperation({ summary: "Update a subscription plan (Admin only)" })
  @ApiParam({ name: "id", description: "Subscription plan ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription plan updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  @ApiResponse({ status: 404, description: "Subscription plan not found" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @CurrentUser() user: any,
  ) {
    this.requireAdmin(user);
    return this.subscriptionPlansService.update(id, dto);
  }

  /**
   * Deactivate a subscription plan (Admin only)
   */
  @Patch(":id/deactivate")
  @ApiOperation({
    summary: "Deactivate a subscription plan (Admin only)",
    description: "Soft delete - plan is hidden but not permanently deleted",
  })
  @ApiParam({ name: "id", description: "Subscription plan ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription plan deactivated successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  @ApiResponse({ status: 404, description: "Subscription plan not found" })
  async deactivate(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.subscriptionPlansService.deactivate(id);
  }

  /**
   * Activate a subscription plan (Admin only)
   */
  @Patch(":id/activate")
  @ApiOperation({
    summary: "Activate a subscription plan (Admin only)",
  })
  @ApiParam({ name: "id", description: "Subscription plan ID" })
  @ApiResponse({
    status: 200,
    description: "Subscription plan activated successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  @ApiResponse({ status: 404, description: "Subscription plan not found" })
  async activate(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.subscriptionPlansService.activate(id);
  }

  /**
   * Delete a subscription plan permanently (Admin only)
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Permanently delete a subscription plan (Admin only)",
    description: "WARNING: This is permanent and cannot be undone. Use deactivate instead.",
  })
  @ApiParam({ name: "id", description: "Subscription plan ID" })
  @ApiResponse({
    status: 204,
    description: "Subscription plan deleted successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin access required" })
  @ApiResponse({ status: 404, description: "Subscription plan not found" })
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    this.requireAdmin(user);
    await this.subscriptionPlansService.delete(id);
  }

  /**
   * Helper method to check admin permission
   */
  private requireAdmin(user: any): void {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    if (!hasAdminPermission) {
      throw new ForbiddenException("Admin access required");
    }
  }
}
