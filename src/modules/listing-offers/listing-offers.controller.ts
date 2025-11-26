import {
  Controller,
  Get,
  Post,
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
import { ListingOffersService } from './listing-offers.service';
import { CreateListingOfferDto } from './dto/create-listing-offer.dto';
import {
  AcceptOfferDto,
  RejectOfferDto,
  CounterOfferDto,
  WithdrawOfferDto,
} from './dto/update-listing-offer.dto';
import { QueryListingOffersDto } from './dto/query-listing-offer.dto';
import {
  CurrentUser,
} from '@/common/decorators/auth.decorators';

/**
 * Listing Offers Controller
 * Handles offers and negotiations on vehicle listings
 */
@ApiTags('Listing Offers')
@Controller('offers')
@ApiBearerAuth('Authorization')
export class ListingOffersController {
  constructor(private readonly listingOffersService: ListingOffersService) {}

  /**
   * List offers with filters
   */
  @Get()
  @ApiOperation({ summary: 'List offers (Buyer/Seller/Admin)' })
  @ApiResponse({ status: 200, description: 'Offers retrieved successfully' })
  async findAll(@Query() query: QueryListingOffersDto, @CurrentUser() user: any) {
    // Users can only see their own offers unless they have admin permission
    const hasAdminPermission = user.permissions?.includes('perm_manage_offers');

    if (!hasAdminPermission) {
      // Non-admin users can only see offers where they are buyer or seller
      // For now, we'll filter by buyerId
      query.buyerId = user.sub;
    }

    return this.listingOffersService.findAll(query);
  }

  /**
   * Get offer by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID (Buyer/Seller/Admin)' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Offer retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_offers');
    return this.listingOffersService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Get offers for a specific listing
   */
  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Get offers for a listing (Seller/Admin)' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Offers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getListingOffers(
    @Param('listingId') listingId: string,
    @Query() query: QueryListingOffersDto,
  ) {
    query.listingId = listingId;
    return this.listingOffersService.findAll(query);
  }

  /**
   * Get offer statistics for a listing
   */
  @Get('listing/:listingId/statistics')
  @ApiOperation({ summary: 'Get offer statistics for a listing (Seller/Admin)' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getStatistics(@Param('listingId') listingId: string, @CurrentUser() user: any) {
    return this.listingOffersService.getStatistics(listingId, user.sub);
  }

  /**
   * Create new offer
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new offer (Buyer)' })
  @ApiResponse({ status: 201, description: 'Offer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async create(@Body() createOfferDto: CreateListingOfferDto, @CurrentUser() user: any) {
    return this.listingOffersService.create(createOfferDto, user.sub);
  }

  /**
   * Accept offer
   */
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept offer (Seller)' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Offer accepted successfully' })
  @ApiResponse({ status: 400, description: 'Offer cannot be accepted' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async accept(
    @Param('id') id: string,
    @Body() acceptDto: AcceptOfferDto,
    @CurrentUser() user: any,
  ) {
    return this.listingOffersService.accept(id, acceptDto, user.sub);
  }

  /**
   * Reject offer
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject offer (Seller)' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Offer rejected successfully' })
  @ApiResponse({ status: 400, description: 'Offer cannot be rejected' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectOfferDto,
    @CurrentUser() user: any,
  ) {
    return this.listingOffersService.reject(id, rejectDto, user.sub);
  }

  /**
   * Counter offer
   */
  @Post(':id/counter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make counter-offer (Seller)' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Counter-offer created successfully' })
  @ApiResponse({ status: 400, description: 'Offer cannot be countered' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async counter(
    @Param('id') id: string,
    @Body() counterDto: CounterOfferDto,
    @CurrentUser() user: any,
  ) {
    return this.listingOffersService.counter(id, counterDto, user.sub);
  }

  /**
   * Withdraw offer
   */
  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw offer (Buyer)' })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({ status: 200, description: 'Offer withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Offer cannot be withdrawn' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async withdraw(
    @Param('id') id: string,
    @Body() withdrawDto: WithdrawOfferDto,
    @CurrentUser() user: any,
  ) {
    return this.listingOffersService.withdraw(id, withdrawDto, user.sub);
  }
}
