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
import { SellerGroupsService } from './seller-groups.service';
import { CreateSellerGroupDto } from './dto/create-seller-group.dto';
import {
  UpdateSellerGroupDto,
  UpdateSellerGroupSettingsDto,
  UpdateSellerGroupMembersDto,
  UpdateSellerGroupMetaDto,
} from './dto/update-seller-group.dto';
import { QuerySellerGroupsDto } from './dto/query-seller-groups.dto';
import {
  CurrentUser,
  RequirePermissions,
} from '@/common/decorators/auth.decorators';

/**
 * Seller Groups Controller
 * Handles dealer group organization and multi-location management
 */
@ApiTags('Seller Groups')
@Controller('seller-groups')
@ApiBearerAuth('Authorization')
export class SellerGroupsController {
  constructor(private readonly sellerGroupsService: SellerGroupsService) {}

  /**
   * List seller groups with filters
   */
  @Get()
  @ApiOperation({ summary: 'List seller groups with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Seller groups list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QuerySellerGroupsDto) {
    return this.sellerGroupsService.findAll(query);
  }

  /**
   * Get seller group by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get seller group by ID' })
  @ApiParam({ name: 'id', description: 'Seller Group ID' })
  @ApiResponse({ status: 200, description: 'Seller group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Seller group not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellerGroupsService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Create new seller group
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Create new seller group (Admin only)' })
  @ApiResponse({ status: 201, description: 'Seller group created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createSellerGroupDto: CreateSellerGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.sellerGroupsService.create(createSellerGroupDto, user.sub);
  }

  /**
   * Update seller group profile
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Update seller group profile (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller Group ID' })
  @ApiResponse({ status: 200, description: 'Seller group updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seller group not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSellerGroupDto: UpdateSellerGroupDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellerGroupsService.update(id, updateSellerGroupDto, user.sub, hasAdminPermission);
  }

  /**
   * Update seller group settings
   */
  @Patch(':id/settings')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Update seller group settings (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller Group ID' })
  @ApiResponse({ status: 200, description: 'Seller group settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller group not found' })
  async updateSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateSellerGroupSettingsDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellerGroupsService.updateSettings(id, updateSettingsDto, user.sub, hasAdminPermission);
  }

  /**
   * Update seller group members
   */
  @Patch(':id/members')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Update seller group members (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller Group ID' })
  @ApiResponse({ status: 200, description: 'Seller group members updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller group not found' })
  async updateMembers(
    @Param('id') id: string,
    @Body() updateMembersDto: UpdateSellerGroupMembersDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes('perm_manage_sellers');
    return this.sellerGroupsService.updateMembers(id, updateMembersDto, user.sub, hasAdminPermission);
  }

  /**
   * Update seller group metadata (Admin only)
   */
  @Patch(':id/meta')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_sellers')
  @ApiOperation({ summary: 'Update seller group metadata (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller Group ID' })
  @ApiResponse({ status: 200, description: 'Seller group metadata updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller group not found' })
  async updateMeta(
    @Param('id') id: string,
    @Body() updateMetaDto: UpdateSellerGroupMetaDto,
  ) {
    return this.sellerGroupsService.updateMeta(id, updateMetaDto);
  }
}
