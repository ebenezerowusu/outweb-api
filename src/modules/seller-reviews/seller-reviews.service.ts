import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { CosmosService } from "@/common/services/cosmos.service";
import { PaginatedResponse } from "@/common/types/pagination.type";
import {
  SellerReviewDocument,
  PublicSellerReview,
} from "./interfaces/seller-review.interface";
import { CreateSellerReviewDto } from "./dto/create-seller-review.dto";
import {
  UpdateSellerReviewDto,
  CreateSellerResponseDto,
  UpdateReviewModerationDto,
} from "./dto/update-seller-review.dto";
import { QuerySellerReviewsDto } from "./dto/query-seller-reviews.dto";
import { UserDocument } from "@/modules/auth/interfaces/user.interface";

/**
 * Seller Reviews Service
 * Handles review creation, rating aggregation, and moderation
 */
@Injectable()
export class SellerReviewsService {
  private readonly REVIEWS_CONTAINER = "seller_reviews";
  private readonly USERS_CONTAINER = "users";
  private readonly ORDERS_CONTAINER = "orders";

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * List reviews for a seller with filters and pagination
   */
  async findAll(
    sellerId: string,
    query: QuerySellerReviewsDto,
  ): Promise<PaginatedResponse<PublicSellerReview>> {
    let sqlQuery = "SELECT * FROM c WHERE c.sellerId = @sellerId";
    const parameters: any[] = [{ name: "@sellerId", value: sellerId }];

    // Filter by reviewer user ID
    if (query.userId) {
      sqlQuery += " AND c.reviewer.userId = @userId";
      parameters.push({ name: "@userId", value: query.userId });
    }

    // Filter by minimum rating
    if (query.minRating !== undefined) {
      sqlQuery += " AND c.rating.overall >= @minRating";
      parameters.push({ name: "@minRating", value: query.minRating });
    }

    // Filter by maximum rating
    if (query.maxRating !== undefined) {
      sqlQuery += " AND c.rating.overall <= @maxRating";
      parameters.push({ name: "@maxRating", value: query.maxRating });
    }

    // Filter by verified purchase
    if (query.isVerifiedPurchase !== undefined) {
      sqlQuery +=
        " AND c.verification.isVerifiedPurchase = @isVerifiedPurchase";
      parameters.push({
        name: "@isVerifiedPurchase",
        value: query.isVerifiedPurchase,
      });
    }

    // Filter by moderation status
    if (query.status) {
      sqlQuery += " AND c.moderation.status = @status";
      parameters.push({ name: "@status", value: query.status });
    }

    // Filter by seller response presence
    if (query.hasResponse !== undefined) {
      if (query.hasResponse) {
        sqlQuery += " AND IS_DEFINED(c.engagement.sellerResponse)";
      } else {
        sqlQuery += " AND NOT IS_DEFINED(c.engagement.sellerResponse)";
      }
    }

    // Order by creation date (newest first)
    sqlQuery += " ORDER BY c.audit.createdAt DESC";

    const { items, continuationToken } =
      await this.cosmosService.queryItems<SellerReviewDocument>(
        this.REVIEWS_CONTAINER,
        sqlQuery,
        parameters,
        query.limit,
        query.cursor,
      );

    // Handle case where items might be undefined
    const reviewItems = items || [];

    return {
      items: reviewItems.map((review) => this.toPublicSellerReview(review)),
      count: reviewItems.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single review by ID
   */
  async findOne(sellerId: string, id: string): Promise<PublicSellerReview> {
    const review = await this.cosmosService.readItem<SellerReviewDocument>(
      this.REVIEWS_CONTAINER,
      id,
      id,
    );

    if (!review || review.sellerId !== sellerId) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Review not found",
      });
    }

    return this.toPublicSellerReview(review);
  }

  /**
   * Create new review for a seller
   */
  async create(
    sellerId: string,
    dto: CreateSellerReviewDto,
    userId: string,
  ): Promise<PublicSellerReview> {
    // Get user information
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // Check if user already reviewed this seller
    const existingReviewQuery = `
      SELECT * FROM c
      WHERE c.sellerId = @sellerId
      AND c.reviewer.userId = @userId
    `;
    const { items: existingReviews } =
      await this.cosmosService.queryItems<SellerReviewDocument>(
        this.REVIEWS_CONTAINER,
        existingReviewQuery,
        [
          { name: "@sellerId", value: sellerId },
          { name: "@userId", value: userId },
        ],
        1,
      );

    if (existingReviews.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "You have already reviewed this seller",
      });
    }

    const now = new Date().toISOString();
    const reviewId = this.cosmosService.generateId();

    // Check if orderId is provided and verify purchase
    const transactionInfo = null;
    let isVerifiedPurchase = false;

    if (dto.orderId) {
      // TODO: Verify order exists and belongs to user and seller
      // For now, we'll mark as verified if orderId is provided
      isVerifiedPurchase = true;
      // transactionInfo should be populated from order data
    }

    const review: SellerReviewDocument = {
      id: reviewId,
      type: "seller_review",
      sellerId: sellerId,
      reviewer: {
        userId: user.id,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl || null,
        reviewCount: 1, // TODO: Get actual count from user's reviews
      },
      transaction: transactionInfo,
      rating: {
        overall: dto.rating.overall,
        communication: dto.rating.communication ?? null,
        vehicleCondition: dto.rating.vehicleCondition ?? null,
        pricing: dto.rating.pricing ?? null,
        processSmoothness: dto.rating.processSmoothness ?? null,
      },
      content: {
        title: dto.title,
        body: dto.body,
        pros: dto.pros ?? null,
        cons: dto.cons ?? null,
      },
      verification: {
        isVerifiedPurchase: isVerifiedPurchase,
        verificationMethod: isVerifiedPurchase ? "order" : null,
        verifiedAt: isVerifiedPurchase ? now : null,
      },
      moderation: {
        status: "pending", // Default to pending for review
        flaggedAt: null,
        flaggedBy: null,
        flagReason: null,
        moderatedAt: null,
        moderatedBy: null,
        moderationNotes: null,
      },
      engagement: {
        helpfulCount: 0,
        notHelpfulCount: 0,
        sellerResponse: null,
      },
      audit: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      },
    };

    const createdReview = await this.cosmosService.createItem(
      this.REVIEWS_CONTAINER,
      review,
    );

    return this.toPublicSellerReview(createdReview);
  }

  /**
   * Update review (by reviewer only)
   */
  async update(
    sellerId: string,
    id: string,
    dto: UpdateSellerReviewDto,
    userId: string,
  ): Promise<PublicSellerReview> {
    const review = await this.cosmosService.readItem<SellerReviewDocument>(
      this.REVIEWS_CONTAINER,
      id,
      id,
    );

    if (!review || review.sellerId !== sellerId) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Review not found",
      });
    }

    // Only the reviewer can update their review
    if (review.reviewer.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You can only update your own reviews",
      });
    }

    // Update content
    if (dto.title !== undefined) {
      review.content.title = dto.title;
    }
    if (dto.body !== undefined) {
      review.content.body = dto.body;
    }
    if (dto.pros !== undefined) {
      review.content.pros = dto.pros;
    }
    if (dto.cons !== undefined) {
      review.content.cons = dto.cons;
    }

    // Update rating
    if (dto.rating) {
      review.rating = {
        overall: dto.rating.overall ?? review.rating.overall,
        communication: dto.rating.communication ?? review.rating.communication,
        vehicleCondition:
          dto.rating.vehicleCondition ?? review.rating.vehicleCondition,
        pricing: dto.rating.pricing ?? review.rating.pricing,
        processSmoothness:
          dto.rating.processSmoothness ?? review.rating.processSmoothness,
      };
    }

    review.audit.updatedAt = new Date().toISOString();
    review.audit.updatedBy = userId;

    const updatedReview = await this.cosmosService.updateItem(
      this.REVIEWS_CONTAINER,
      review,
      review.id,
    );

    return this.toPublicSellerReview(updatedReview);
  }

  /**
   * Delete review (by reviewer only)
   */
  async delete(
    sellerId: string,
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const review = await this.cosmosService.readItem<SellerReviewDocument>(
      this.REVIEWS_CONTAINER,
      id,
      id,
    );

    if (!review || review.sellerId !== sellerId) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Review not found",
      });
    }

    // Only the reviewer or admin can delete
    if (!isAdmin && review.reviewer.userId !== userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You can only delete your own reviews",
      });
    }

    // TODO: Implement delete in CosmosService
    // await this.cosmosService.deleteItem(this.REVIEWS_CONTAINER, id, id);
  }

  /**
   * Create seller response to a review
   */
  async createResponse(
    sellerId: string,
    id: string,
    dto: CreateSellerResponseDto,
    userId: string,
  ): Promise<PublicSellerReview> {
    const review = await this.cosmosService.readItem<SellerReviewDocument>(
      this.REVIEWS_CONTAINER,
      id,
      id,
    );

    if (!review || review.sellerId !== sellerId) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Review not found",
      });
    }

    // TODO: Verify that user is a member of this seller
    // For now, we'll allow any authenticated user to respond

    if (review.engagement.sellerResponse) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "Seller has already responded to this review",
      });
    }

    // Get user information
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    review.engagement.sellerResponse = {
      userId: user.id,
      displayName: user.profile.displayName,
      message: dto.message,
      respondedAt: new Date().toISOString(),
    };

    review.audit.updatedAt = new Date().toISOString();
    review.audit.updatedBy = userId;

    const updatedReview = await this.cosmosService.updateItem(
      this.REVIEWS_CONTAINER,
      review,
      review.id,
    );

    return this.toPublicSellerReview(updatedReview);
  }

  /**
   * Update review moderation (Admin only)
   */
  async updateModeration(
    sellerId: string,
    id: string,
    dto: UpdateReviewModerationDto,
    moderatorId: string,
  ): Promise<PublicSellerReview> {
    const review = await this.cosmosService.readItem<SellerReviewDocument>(
      this.REVIEWS_CONTAINER,
      id,
      id,
    );

    if (!review || review.sellerId !== sellerId) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "Review not found",
      });
    }

    const now = new Date().toISOString();

    if (dto.status !== undefined) {
      review.moderation.status = dto.status;
      review.moderation.moderatedAt = now;
      review.moderation.moderatedBy = moderatorId;

      // Handle flagging
      if (dto.status === "flagged") {
        review.moderation.flaggedAt = now;
        review.moderation.flaggedBy = moderatorId;
        review.moderation.flagReason = dto.flagReason || "No reason provided";
      } else {
        review.moderation.flaggedAt = null;
        review.moderation.flaggedBy = null;
        review.moderation.flagReason = null;
      }
    }

    if (dto.moderationNotes !== undefined) {
      review.moderation.moderationNotes = dto.moderationNotes;
    }

    review.audit.updatedAt = now;
    review.audit.updatedBy = moderatorId;

    const updatedReview = await this.cosmosService.updateItem(
      this.REVIEWS_CONTAINER,
      review,
      review.id,
    );

    return this.toPublicSellerReview(updatedReview);
  }

  /**
   * Helper: Convert SellerReviewDocument to PublicSellerReview
   */
  private toPublicSellerReview(
    review: SellerReviewDocument,
  ): PublicSellerReview {
    return review;
  }
}
