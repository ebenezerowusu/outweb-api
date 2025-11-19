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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SellerReviewsService } from './seller-reviews.service';
import { CreateSellerReviewDto } from './dto/create-seller-review.dto';
import {
  UpdateSellerReviewDto,
  CreateSellerResponseDto,
  UpdateReviewModerationDto,
} from './dto/update-seller-review.dto';
import { QuerySellerReviewsDto } from './dto/query-seller-reviews.dto';
import {
  CurrentUser,
  RequirePermissions,
} from '@/common/decorators/auth.decorators';

/**
 * Seller Reviews Controller
 * Handles review creation, rating aggregation, and moderation
 */
@ApiTags('Seller Reviews')
@Controller('sellers/:sellerId/reviews')
@ApiBearerAuth('Authorization')
export class SellerReviewsController {
  constructor(private readonly sellerReviewsService: SellerReviewsService) {}

  /**
   * List reviews for a seller
   */
  @Get()
  @ApiOperation({ summary: 'List reviews for a seller with filters and pagination' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Reviews list retrieved successfully' })
  async findAll(
    @Param('sellerId') sellerId: string,
    @Query() query: QuerySellerReviewsDto,
  ) {
    return this.sellerReviewsService.findAll(sellerId, query);
  }

  /**
   * Get review by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('sellerId') sellerId: string, @Param('id') id: string) {
    return this.sellerReviewsService.findOne(sellerId, id);
  }

  /**
   * Create new review
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new review for a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or duplicate review' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Param('sellerId') sellerId: string,
    @Body() createSellerReviewDto: CreateSellerReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.sellerReviewsService.create(sellerId, createSellerReviewDto, user.sub);
  }

  /**
   * Update review (reviewer only)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update review (reviewer only)' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the review author' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('sellerId') sellerId: string,
    @Param('id') id: string,
    @Body() updateSellerReviewDto: UpdateSellerReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.sellerReviewsService.update(sellerId, id, updateSellerReviewDto, user.sub);
  }

  /**
   * Delete review (reviewer or admin)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete review (reviewer or admin)' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async delete(
    @Param('sellerId') sellerId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    await this.sellerReviewsService.delete(sellerId, id, user.sub, hasAdminPermission);
  }

  /**
   * Create seller response to review
   */
  @Post(':id/response')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create seller response to a review' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 201, description: 'Response created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - response already exists' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async createResponse(
    @Param('sellerId') sellerId: string,
    @Param('id') id: string,
    @Body() createResponseDto: CreateSellerResponseDto,
    @CurrentUser() user: any,
  ) {
    return this.sellerReviewsService.createResponse(sellerId, id, createResponseDto, user.sub);
  }

  /**
   * Update review moderation (admin only)
   */
  @Patch(':id/moderation')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Update review moderation status (Admin only)' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review moderation updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateModeration(
    @Param('sellerId') sellerId: string,
    @Param('id') id: string,
    @Body() updateModerationDto: UpdateReviewModerationDto,
    @CurrentUser() user: any,
  ) {
    return this.sellerReviewsService.updateModeration(sellerId, id, updateModerationDto, user.sub);
  }
}
