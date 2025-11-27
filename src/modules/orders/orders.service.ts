import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CosmosService } from "@/common/services/cosmos.service";
import {
  OrderDocument,
  PublicOrder,
  OrderTransactionDocument,
  PublicTransaction,
  OrderState,
  OrderEvent,
  OrderEventType,
} from "./interfaces/order.interface";
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
import { ListingDocument } from "../listings/interfaces/listing.interface";

const ORDERS_CONTAINER = "Orders";
const LISTINGS_CONTAINER = "listings";

@Injectable()
export class OrdersService {
  constructor(
    private readonly cosmosService: CosmosService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List orders with filters
   */
  async findAll(
    query: QueryOrdersDto,
  ): Promise<{ items: PublicOrder[]; continuationToken?: string }> {
    const {
      buyerId,
      sellerId,
      listingId,
      state,
      vinLastFour,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = 20,
      continuationToken,
    } = query;

    const conditions: string[] = ["c.type = 'order'"];
    const parameters: Array<{ name: string; value: any }> = [];

    if (buyerId) {
      conditions.push("c.buyerId = @buyerId");
      parameters.push({ name: "@buyerId", value: buyerId });
    }

    if (sellerId) {
      conditions.push("c.sellerId = @sellerId");
      parameters.push({ name: "@sellerId", value: sellerId });
    }

    if (listingId) {
      conditions.push("c.listing.listingId = @listingId");
      parameters.push({ name: "@listingId", value: listingId });
    }

    if (state) {
      conditions.push("c.status.state = @state");
      parameters.push({ name: "@state", value: state });
    }

    if (vinLastFour) {
      conditions.push("c.listing.vehicle.vinLastFour = @vinLastFour");
      parameters.push({ name: "@vinLastFour", value: vinLastFour });
    }

    const orderByClause = `ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;
    const querySpec = `SELECT * FROM c WHERE ${conditions.join(" AND ")} ${orderByClause}`;

    const { items, continuationToken: nextToken } =
      await this.cosmosService.queryItems<OrderDocument>(
        ORDERS_CONTAINER,
        querySpec,
        parameters,
        limit,
        continuationToken,
      );

    // Handle case where items might be undefined
    const orderItems = items || [];

    return {
      items: orderItems.map((order) => this.toPublicOrder(order)),
      continuationToken: nextToken,
    };
  }

  /**
   * Get order by ID
   */
  async findOne(
    id: string,
    userId: string,
    hasAdminPermission: boolean,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    // Check ownership: only buyer, seller, or admin can view
    if (
      !hasAdminPermission &&
      order.buyerId !== userId &&
      order.sellerId !== userId
    ) {
      throw new ForbiddenException({
        message: "You do not have permission to view this order",
      });
    }

    return this.toPublicOrder(order);
  }

  /**
   * Create new order
   */
  async create(dto: CreateOrderDto, userId: string): Promise<PublicOrder> {
    const now = new Date().toISOString();

    // Fetch listing to validate and get details
    const listing = await this.cosmosService.getItem<ListingDocument>(
      LISTINGS_CONTAINER,
      dto.listingId,
      dto.listingId,
    );
    if (!listing) {
      throw new NotFoundException({ message: "Listing not found" });
    }

    // Validate listing is available for purchase
    if (listing.status.state !== "published") {
      throw new BadRequestException({
        message: "Listing is not available for purchase",
      });
    }

    // Calculate pricing
    const taxAmount = dto.agreedPrice * 0.08; // 8% tax (should be configurable)
    const feeAmount = dto.agreedPrice * 0.025; // 2.5% platform fee
    const balanceAmount =
      dto.agreedPrice + taxAmount + feeAmount - dto.depositAmount;
    const totalAmount = dto.agreedPrice + taxAmount + feeAmount;

    // Generate title from vehicle data
    const listingTitle = `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model}${listing.vehicle.trim ? " " + listing.vehicle.trim : ""}`;

    const order: OrderDocument = {
      id: this.cosmosService.generateId(),
      type: "order",
      buyerId: userId,
      sellerId: listing.seller.id,
      listing: {
        listingId: dto.listingId,
        title: listingTitle,
        vehicle: {
          vin: listing.vehicle.vin,
          vinLastFour: listing.vehicle.vin.slice(-4),
          make: listing.vehicle.make,
          model: listing.vehicle.model,
          year: listing.vehicle.year,
          trim: listing.vehicle.trim,
          mileage: listing.vehicle.mileage,
          exteriorColor: listing.vehicle.exteriorColor,
          interiorColor: listing.vehicle.interiorColor,
        },
      },
      pricing: {
        listPrice: listing.pricing.listPrice,
        agreedPrice: dto.agreedPrice,
        depositAmount: dto.depositAmount,
        depositPaidAt: null,
        balanceAmount,
        balancePaidAt: null,
        taxAmount,
        feeAmount,
        totalAmount,
        currency: "USD",
      },
      status: {
        state: "pending_deposit",
        substatus: null,
        canceledBy: null,
        cancelReason: null,
        refundAmount: null,
        refundedAt: null,
      },
      timeline: {
        createdAt: now,
        depositDueAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
        inspectionScheduledAt: null,
        inspectionCompletedAt: null,
        paymentDueAt: null,
        deliveryScheduledAt: null,
        deliveredAt: null,
        completedAt: null,
        canceledAt: null,
        events: [
          {
            id: this.cosmosService.generateId(),
            type: "order_created",
            description: "Order created",
            performedBy: userId,
            metadata: { agreedPrice: dto.agreedPrice },
            occurredAt: now,
          },
        ],
      },
      delivery: dto.deliveryMethod
        ? {
            method: dto.deliveryMethod,
            address: dto.deliveryAddress || null,
            scheduledDate: null,
            estimatedArrival: null,
            trackingNumber: null,
            carrier: null,
            specialInstructions: dto.specialInstructions || null,
          }
        : null,
      documents: [],
      notes: dto.notes
        ? [
            {
              id: this.cosmosService.generateId(),
              content: dto.notes,
              authorId: userId,
              authorName: "Buyer",
              isInternal: false,
              createdAt: now,
            },
          ]
        : [],
      audit: {
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        version: 1,
      },
    };

    const created = await this.cosmosService.createItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(created);
  }

  /**
   * Update order status
   */
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    hasAdminPermission: boolean,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    // Only seller or admin can update status
    if (!hasAdminPermission && order.sellerId !== userId) {
      throw new ForbiddenException({
        message: "Only the seller or admin can update order status",
      });
    }

    const now = new Date().toISOString();
    const eventType = this.getEventTypeFromState(dto.state);

    order.status.state = dto.state;
    order.status.substatus = dto.substatus || null;

    // Update timeline based on state
    this.updateTimelineForState(order, dto.state, now);

    // Add event to timeline
    order.timeline.events.push({
      id: this.cosmosService.generateId(),
      type: eventType,
      description: dto.reason || `Order status changed to ${dto.state}`,
      performedBy: userId,
      metadata: { previousState: order.status.state },
      occurredAt: now,
    });

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Cancel order
   */
  async cancel(
    id: string,
    dto: CancelOrderDto,
    userId: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    // Only buyer or seller can cancel
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException({
        message: "You do not have permission to cancel this order",
      });
    }

    if (order.status.state === "completed") {
      throw new BadRequestException({
        message: "Cannot cancel a completed order",
      });
    }

    const now = new Date().toISOString();

    order.status.state = "canceled";
    order.status.canceledBy = userId;
    order.status.cancelReason = dto.reason;
    order.timeline.canceledAt = now;

    if (dto.issueRefund && order.pricing.depositPaidAt) {
      const refundAmount = dto.refundAmount || order.pricing.depositAmount;
      order.status.refundAmount = refundAmount;
      order.status.refundedAt = now;

      // TODO: Process actual refund through payment provider
    }

    order.timeline.events.push({
      id: this.cosmosService.generateId(),
      type: "canceled",
      description: `Order canceled: ${dto.reason}`,
      performedBy: userId,
      metadata: {
        issueRefund: dto.issueRefund,
        refundAmount: dto.refundAmount,
      },
      occurredAt: now,
    });

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Schedule inspection
   */
  async scheduleInspection(
    id: string,
    dto: ScheduleInspectionDto,
    userId: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    order.status.state = "inspection_scheduled";
    order.timeline.inspectionScheduledAt = dto.scheduledAt;

    order.timeline.events.push({
      id: this.cosmosService.generateId(),
      type: "inspection_scheduled",
      description: "Inspection scheduled",
      performedBy: userId,
      metadata: {
        scheduledAt: dto.scheduledAt,
        location: dto.location,
        inspector: dto.inspector,
      },
      occurredAt: now,
    });

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Complete inspection
   */
  async completeInspection(
    id: string,
    dto: CompleteInspectionDto,
    userId: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    order.status.state = "inspection_completed";
    order.timeline.inspectionCompletedAt = now;

    const eventType: OrderEventType = dto.approved
      ? "inspection_approved"
      : "inspection_rejected";

    order.timeline.events.push({
      id: this.cosmosService.generateId(),
      type: eventType,
      description: dto.approved ? "Inspection passed" : "Inspection failed",
      performedBy: userId,
      metadata: {
        approved: dto.approved,
        findings: dto.findings,
        reportUrl: dto.reportUrl,
      },
      occurredAt: now,
    });

    if (dto.reportUrl) {
      order.documents.push({
        id: this.cosmosService.generateId(),
        type: "inspection_report",
        name: "Inspection Report",
        url: dto.reportUrl,
        uploadedBy: userId,
        uploadedAt: now,
      });
    }

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Update delivery information
   */
  async updateDelivery(
    id: string,
    dto: UpdateDeliveryDto,
    userId: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    if (!order.delivery) {
      order.delivery = {
        method: dto.deliveryMethod || "pickup",
        address: null,
        scheduledDate: null,
        estimatedArrival: null,
        trackingNumber: null,
        carrier: null,
        specialInstructions: null,
      };
    }

    if (dto.deliveryMethod) order.delivery.method = dto.deliveryMethod;
    if (dto.deliveryAddress) {
      order.delivery.address = {
        ...order.delivery.address,
        ...dto.deliveryAddress,
      } as any;
    }
    if (dto.scheduledDate) {
      order.delivery.scheduledDate = dto.scheduledDate;
      order.timeline.deliveryScheduledAt = dto.scheduledDate;
    }
    if (dto.estimatedArrival)
      order.delivery.estimatedArrival = dto.estimatedArrival;
    if (dto.trackingNumber) order.delivery.trackingNumber = dto.trackingNumber;
    if (dto.carrier) order.delivery.carrier = dto.carrier;
    if (dto.specialInstructions !== undefined)
      order.delivery.specialInstructions = dto.specialInstructions;

    if (dto.scheduledDate) {
      order.timeline.events.push({
        id: this.cosmosService.generateId(),
        type: "delivery_scheduled",
        description: "Delivery scheduled",
        performedBy: userId,
        metadata: { scheduledDate: dto.scheduledDate },
        occurredAt: now,
      });
    }

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Add note to order
   */
  async addNote(
    id: string,
    dto: AddOrderNoteDto,
    userId: string,
    authorName: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    order.notes.push({
      id: this.cosmosService.generateId(),
      content: dto.content,
      authorId: userId,
      authorName,
      isInternal: dto.isInternal || false,
      createdAt: now,
    });

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * Add document to order
   */
  async addDocument(
    id: string,
    dto: AddOrderDocumentDto,
    userId: string,
  ): Promise<PublicOrder> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      id,
      id,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    order.documents.push({
      id: this.cosmosService.generateId(),
      type: dto.type,
      name: dto.name,
      url: dto.url,
      uploadedBy: userId,
      uploadedAt: now,
    });

    order.audit.updatedAt = now;
    order.audit.updatedBy = userId;
    order.audit.version += 1;

    const updated = await this.cosmosService.upsertItem<OrderDocument>(
      ORDERS_CONTAINER,
      order,
    );
    return this.toPublicOrder(updated);
  }

  /**
   * List transactions with filters
   */
  async findAllTransactions(
    query: QueryOrderTransactionsDto,
  ): Promise<{ items: PublicTransaction[]; continuationToken?: string }> {
    const {
      orderId,
      transactionType,
      state,
      provider,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = 20,
      continuationToken,
    } = query;

    const conditions: string[] = ["c.type = 'order_transaction'"];
    const parameters: Array<{ name: string; value: any }> = [];

    if (orderId) {
      conditions.push("c.orderId = @orderId");
      parameters.push({ name: "@orderId", value: orderId });
    }

    if (transactionType) {
      conditions.push("c.transaction.transactionType = @transactionType");
      parameters.push({ name: "@transactionType", value: transactionType });
    }

    if (state) {
      conditions.push("c.status.state = @state");
      parameters.push({ name: "@state", value: state });
    }

    if (provider) {
      conditions.push("c.payment.provider = @provider");
      parameters.push({ name: "@provider", value: provider });
    }

    const orderByClause = `ORDER BY c.${sortBy === "amount" ? "transaction.amount" : sortBy} ${sortOrder.toUpperCase()}`;
    const querySpec = `SELECT * FROM c WHERE ${conditions.join(" AND ")} ${orderByClause}`;

    const { items, continuationToken: nextToken } =
      await this.cosmosService.queryItems<OrderTransactionDocument>(
        ORDERS_CONTAINER,
        querySpec,
        parameters,
        limit,
        continuationToken,
      );

    return {
      items,
      continuationToken: nextToken,
    };
  }

  /**
   * Create transaction
   */
  async createTransaction(
    dto: CreateOrderTransactionDto,
    userId: string,
  ): Promise<PublicTransaction> {
    const order = await this.cosmosService.getItem<OrderDocument>(
      ORDERS_CONTAINER,
      dto.orderId,
      dto.orderId,
    );

    if (!order) {
      throw new NotFoundException({ message: "Order not found" });
    }

    const now = new Date().toISOString();

    const transaction: OrderTransactionDocument = {
      id: this.cosmosService.generateId(),
      type: "order_transaction",
      orderId: dto.orderId,
      transaction: {
        transactionType: dto.transactionType,
        amount: dto.amount,
        currency: "USD",
        description: `${dto.transactionType} payment`,
        metadata: dto.metadata || {},
      },
      payment: {
        provider: dto.paymentIntentId ? "stripe" : "manual",
        paymentIntentId: dto.paymentIntentId || null,
        chargeId: null,
        paymentMethodType: null,
        last4: null,
        receiptUrl: null,
      },
      status: {
        state: "pending",
        failureCode: null,
        failureMessage: null,
        processedAt: null,
      },
      audit: {
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      },
    };

    // TODO: Process payment through Stripe or other provider

    const created =
      await this.cosmosService.createItem<OrderTransactionDocument>(
        ORDERS_CONTAINER,
        transaction,
      );
    return created;
  }

  /**
   * Helper: Convert to public order (removes full VIN)
   */
  private toPublicOrder(order: OrderDocument): PublicOrder {
    const { listing, ...rest } = order;
    const { vin, ...vehicleWithoutVin } = listing.vehicle;

    return {
      ...rest,
      listing: {
        ...listing,
        vehicle: vehicleWithoutVin,
      },
    };
  }

  /**
   * Helper: Get event type from order state
   */
  private getEventTypeFromState(state: OrderState): OrderEventType {
    const mapping: Record<OrderState, OrderEventType> = {
      pending_deposit: "order_created",
      deposit_paid: "deposit_received",
      inspection_scheduled: "inspection_scheduled",
      inspection_completed: "inspection_approved",
      pending_payment: "deposit_received",
      payment_completed: "payment_received",
      ready_for_delivery: "payment_received",
      in_transit: "in_transit",
      delivered: "delivered",
      completed: "completed",
      canceled: "canceled",
      disputed: "dispute_raised",
    };
    return mapping[state] || "order_created";
  }

  /**
   * Helper: Update timeline based on state
   */
  private updateTimelineForState(
    order: OrderDocument,
    state: OrderState,
    now: string,
  ): void {
    switch (state) {
      case "deposit_paid":
        order.pricing.depositPaidAt = now;
        break;
      case "payment_completed":
        order.pricing.balancePaidAt = now;
        order.timeline.paymentDueAt = now;
        break;
      case "delivered":
        order.timeline.deliveredAt = now;
        break;
      case "completed":
        order.timeline.completedAt = now;
        break;
      case "canceled":
        order.timeline.canceledAt = now;
        break;
    }
  }
}
