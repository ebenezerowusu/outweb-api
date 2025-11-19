import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CheckPermissionDto, CheckPermissionsBatchDto } from './dto/check-permission.dto';
import { SuggestPermissionsDto, SuggestRolesDto } from './dto/suggest.dto';
import { CurrentUser, RequirePermissions } from '@/common/decorators/auth.decorators';

/**
 * RBAC Controller
 * Handles permission checking, role management, and suggestions
 */
@ApiTags('RBAC')
@Controller('rbac')
@ApiBearerAuth('Authorization')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /**
   * Check if a user has a specific permission
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_users')
  @ApiOperation({ summary: 'Check if a user has a specific permission (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkPermission(@Body() checkPermissionDto: CheckPermissionDto) {
    return this.rbacService.checkPermission(checkPermissionDto);
  }

  /**
   * Check multiple permissions for a user (batch)
   */
  @Post('check/batch')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('perm_manage_users')
  @ApiOperation({ summary: 'Check multiple permissions for a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Batch permission check results' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkPermissionsBatch(@Body() checkBatchDto: CheckPermissionsBatchDto) {
    return this.rbacService.checkPermissionsBatch(checkBatchDto);
  }

  /**
   * Get effective permissions for current user
   */
  @Get('me')
  @ApiOperation({ summary: 'Get effective permissions for current user' })
  @ApiResponse({ status: 200, description: 'Effective permissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyEffectivePermissions(@CurrentUser() user: any) {
    return this.rbacService.getEffectivePermissions(user.sub);
  }

  /**
   * Suggest permissions based on search query
   */
  @Get('permissions/suggest')
  @RequirePermissions('perm_manage_users')
  @ApiOperation({ summary: 'Get permission suggestions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Permission suggestions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async suggestPermissions(@Query() suggestDto: SuggestPermissionsDto) {
    return this.rbacService.suggestPermissions(suggestDto);
  }

  /**
   * Suggest roles based on search query
   */
  @Get('roles/suggest')
  @RequirePermissions('perm_manage_users')
  @ApiOperation({ summary: 'Get role suggestions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role suggestions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async suggestRoles(@Query() suggestDto: SuggestRolesDto) {
    return this.rbacService.suggestRoles(suggestDto);
  }
}
