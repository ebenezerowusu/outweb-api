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
import { BillingsService } from "./billings.service";
import {
  UpdateBillingStatusDto,
  CreateRefundDto,
} from "./dto/update-billing.dto";
import { QueryBillingsDto } from "./dto/query-billing.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

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
}
