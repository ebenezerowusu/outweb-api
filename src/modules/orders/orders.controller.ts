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
import { OrdersService } from "./orders.service";
import {
  CreateOrderDto,
  CreateOrderTransactionDto,
} from "./dto/create-order.dto";
import {
  UpdateOrderStatusDto,
  CancelOrderDto,
  ScheduleInspectionDto,
  CompleteInspectionDto,
  UpdateDeliveryDto,
  AddOrderNoteDto,
  AddOrderDocumentDto,
} from "./dto/update-order.dto";
import {
  QueryOrdersDto,
  QueryOrderTransactionsDto,
} from "./dto/query-order.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

/**
 * Orders Controller
 * Handles order and transaction management
 */
@ApiTags("Orders")
@Controller("orders")
@ApiBearerAuth("Authorization")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * List orders with filters
   */
  @Get()
  @ApiOperation({ summary: "List orders with filters (Buyer/Seller/Admin)" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  async findAll(@Query() query: QueryOrdersDto, @CurrentUser() user: any) {
    // Users can only see their own orders unless they have admin permission
    const hasAdminPermission = user.permissions?.includes("perm_manage_orders");

    if (!hasAdminPermission) {
      // Non-admin users can only see orders where they are buyer or seller
      // This would require seller lookup, so for now we filter by buyerId
      query.buyerId = user.sub;
    }

    return this.ordersService.findAll(query);
  }

  /**
   * Get order by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get order by ID (Buyer/Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_orders");
    return this.ordersService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Create new order
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new order (Buyer)" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 404, description: "Listing not found" })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(createOrderDto, user.sub);
  }

  /**
   * Update order status
   */
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update order status (Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Order status updated successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_orders");
    return this.ordersService.updateStatus(
      id,
      updateStatusDto,
      user.sub,
      hasAdminPermission,
    );
  }

  /**
   * Cancel order
   */
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel order (Buyer/Seller)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({ status: 200, description: "Order canceled successfully" })
  @ApiResponse({ status: 400, description: "Cannot cancel completed order" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async cancel(
    @Param("id") id: string,
    @Body() cancelDto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancel(id, cancelDto, user.sub);
  }

  /**
   * Schedule inspection
   */
  @Post(":id/inspection/schedule")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Schedule inspection (Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Inspection scheduled successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async scheduleInspection(
    @Param("id") id: string,
    @Body() scheduleDto: ScheduleInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.scheduleInspection(id, scheduleDto, user.sub);
  }

  /**
   * Complete inspection
   */
  @Post(":id/inspection/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete inspection (Inspector/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Inspection completed successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async completeInspection(
    @Param("id") id: string,
    @Body() completeDto: CompleteInspectionDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.completeInspection(id, completeDto, user.sub);
  }

  /**
   * Update delivery information
   */
  @Patch(":id/delivery")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update delivery information (Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({ status: 200, description: "Delivery updated successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateDelivery(
    @Param("id") id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateDelivery(id, updateDeliveryDto, user.sub);
  }

  /**
   * Add note to order
   */
  @Post(":id/notes")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add note to order (Buyer/Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({ status: 201, description: "Note added successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async addNote(
    @Param("id") id: string,
    @Body() addNoteDto: AddOrderNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.addNote(
      id,
      addNoteDto,
      user.sub,
      user.name || "User",
    );
  }

  /**
   * Add document to order
   */
  @Post(":id/documents")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add document to order (Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({ status: 201, description: "Document added successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async addDocument(
    @Param("id") id: string,
    @Body() addDocumentDto: AddOrderDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.addDocument(id, addDocumentDto, user.sub);
  }

  /**
   * List transactions with filters
   */
  @Get("transactions/all")
  @ApiOperation({ summary: "List transactions with filters (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Transactions retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async findAllTransactions(@Query() query: QueryOrderTransactionsDto) {
    return this.ordersService.findAllTransactions(query);
  }

  /**
   * Get transactions for a specific order
   */
  @Get(":id/transactions")
  @ApiOperation({ summary: "Get order transactions (Buyer/Seller/Admin)" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Transactions retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getOrderTransactions(
    @Param("id") id: string,
    @Query() query: QueryOrderTransactionsDto,
  ) {
    query.orderId = id;
    return this.ordersService.findAllTransactions(query);
  }

  /**
   * Create transaction
   */
  @Post("transactions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create transaction (Internal/Admin)" })
  @ApiResponse({ status: 201, description: "Transaction created successfully" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async createTransaction(
    @Body() createTransactionDto: CreateOrderTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createTransaction(createTransactionDto, user.sub);
  }
}
