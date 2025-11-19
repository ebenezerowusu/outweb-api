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
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import {
  UpdateListingDto,
  UpdateListingStatusDto,
  UpdateListingVisibilityDto,
  FeatureListingDto,
} from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listing.dto';
import {
  CurrentUser,
  Country,
  SkipAuth,
  RequirePermissions,
} from '@/common/decorators/auth.decorators';

/**
 * Listings Controller
 * Handles vehicle listing management
 */
@ApiTags('Listings')
@Controller('listings')
@ApiBearerAuth('Authorization')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /**
   * List listings with filters
   */
  @Get()
  @SkipAuth()
  @ApiOperation({ summary: 'List listings with filters and pagination (Public)' })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  async findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findAll(query);
  }

  /**
   * Get listing by ID
   */
  @Get(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Get listing by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  /**
   * Create new listing
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('perm_manage_listings')
  @ApiOperation({ summary: 'Create new listing (Seller or Admin)' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createListingDto: CreateListingDto,
    @CurrentUser() user: any,
    @Country() country: string,
  ) {
    return this.listingsService.create(createListingDto, user.sub, country);
  }

  /**
   * Update listing
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_listings')
  @ApiOperation({ summary: 'Update listing (Seller or Admin)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_listings');
    return this.listingsService.update(id, updateListingDto, user.sub, hasAdminPermission);
  }

  /**
   * Update listing status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_listings', 'perm_publish_listings')
  @ApiOperation({ summary: 'Update listing status (Seller or Admin)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing status updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateListingStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.updateStatus(id, updateStatusDto, user.sub);
  }

  /**
   * Update listing visibility
   */
  @Patch(':id/visibility')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_listings')
  @ApiOperation({ summary: 'Update listing visibility (Seller or Admin)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing visibility updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async updateVisibility(
    @Param('id') id: string,
    @Body() updateVisibilityDto: UpdateListingVisibilityDto,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.updateVisibility(id, updateVisibilityDto, user.sub);
  }

  /**
   * Feature a listing
   */
  @Post(':id/feature')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_feature_listings')
  @ApiOperation({ summary: 'Feature a listing (Admin only)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing featured successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async featureListing(
    @Param('id') id: string,
    @Body() featureDto: FeatureListingDto,
  ) {
    return this.listingsService.featureListing(id, featureDto);
  }

  /**
   * Delete listing
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('perm_manage_listings')
  @ApiOperation({ summary: 'Delete listing (Seller or Admin)' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 204, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_listings');
    await this.listingsService.delete(id, user.sub, hasAdminPermission);
  }
}
