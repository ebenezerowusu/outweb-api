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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import {
  UpdateSellerDto,
  UpdateSellerStatusDto,
  UpdateSellerMetaDto,
  UpdateSellerUsersDto,
} from './dto/update-seller.dto';
import { QuerySellersDto } from './dto/query-sellers.dto';
import {
  CurrentUser,
  Country,
} from '@/common/decorators/auth.decorators';

/**
 * Sellers Controller
 * Handles dealer and private seller management
 */
@ApiTags('Sellers')
@Controller('sellers')
@ApiBearerAuth('Authorization')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  /**
   * List sellers with filters
   */
  @Get()
  @ApiOperation({ summary: 'List sellers with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Sellers list retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(@Query() query: QuerySellersDto) {
    return this.sellersService.findAll(query);
  }

  /**
   * Get seller by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get seller by ID (Admin or seller member)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellersService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Create new seller
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new seller (dealer or private)' })
  @ApiResponse({ status: 201, description: 'Seller created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createSellerDto: CreateSellerDto,
    @Country() country: string,
    @CurrentUser() user: any,
  ) {
    return this.sellersService.create(createSellerDto, country, user.sub);
  }

  /**
   * Update seller profile
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seller profile (Admin or seller member)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSellerDto: UpdateSellerDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellersService.update(id, updateSellerDto, user.sub, hasAdminPermission);
  }

  /**
   * Update seller status (Admin only)
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seller verification and approval status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller status updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateSellerStatusDto,
  ) {
    return this.sellersService.updateStatus(id, updateStatusDto);
  }

  /**
   * Update seller metadata (Admin only)
   */
  @Patch(':id/meta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seller metadata (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller metadata updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateMeta(
    @Param('id') id: string,
    @Body() updateMetaDto: UpdateSellerMetaDto,
  ) {
    return this.sellersService.updateMeta(id, updateMetaDto);
  }

  /**
   * Update seller users (staff/team management)
   */
  @Patch(':id/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seller users/staff (Admin or seller member)' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller users updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateUsers(
    @Param('id') id: string,
    @Body() updateUsersDto: UpdateSellerUsersDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellersService.updateUsers(id, updateUsersDto, user.sub, hasAdminPermission);
  }
}
