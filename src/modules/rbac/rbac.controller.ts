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
import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  QueryRolesDto,
  AttachPermissionsDto,
} from './dto/role.dto';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  QueryPermissionsDto,
} from './dto/permission.dto';

/**
 * RBAC Controller
 * Handles roles and permissions management
 *
 * TODO: Add @RequirePermissions decorators once permission model is finalized
 */
@ApiTags('RBAC')
@Controller('rbac')
@ApiBearerAuth('Authorization')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ==================== ROLES ENDPOINTS ====================

  /**
   * List roles
   */
  @Get('roles')
  @ApiOperation({ summary: 'List roles (filter by scope/name, paginate)' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAllRoles(@Query() query: QueryRolesDto) {
    return this.rbacService.findAllRoles(query);
  }

  /**
   * Create a new role
   */
  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - role name already exists' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto);
  }

  /**
   * Get a single role by ID
   */
  @Get('roles/:roleId')
  @ApiOperation({ summary: 'Get a single role by id' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_dealer' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findRoleById(@Param('roleId') roleId: string) {
    return this.rbacService.findRoleById(roleId);
  }

  /**
   * Update a role
   */
  @Patch('roles/:roleId')
  @ApiOperation({ summary: 'Update role fields (description, permissions, etc)' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_dealer' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rbacService.updateRole(roleId, updateRoleDto);
  }

  /**
   * Delete a role
   */
  @Delete('roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role (non-critical/custom roles only)' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_moderator' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete protected role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('roleId') roleId: string) {
    await this.rbacService.deleteRole(roleId);
  }

  /**
   * Get full permission objects for a role
   */
  @Get('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Get full permission objects for a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_dealer' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.rbacService.getRolePermissions(roleId);
  }

  /**
   * Attach permissions to a role
   */
  @Post('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Attach permissions to a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_dealer' })
  @ApiResponse({ status: 200, description: 'Permissions attached successfully' })
  @ApiResponse({ status: 400, description: 'Invalid permission IDs' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async attachPermissions(
    @Param('roleId') roleId: string,
    @Body() attachPermissionsDto: AttachPermissionsDto,
  ) {
    return this.rbacService.attachPermissions(roleId, attachPermissionsDto);
  }

  /**
   * Remove a permission from a role
   */
  @Delete('roles/:roleId/permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID', example: 'role_dealer' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID', example: 'perm_create_listing' })
  @ApiResponse({ status: 204, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async detachPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.rbacService.detachPermission(roleId, permissionId);
  }

  // ==================== PERMISSIONS ENDPOINTS ====================

  /**
   * List permissions
   */
  @Get('permissions')
  @ApiOperation({ summary: 'List permissions (filter by category)' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async findAllPermissions(@Query() query: QueryPermissionsDto) {
    return this.rbacService.findAllPermissions(query);
  }

  /**
   * Create a new permission
   */
  @Post('permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - permission name already exists' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rbacService.createPermission(createPermissionDto);
  }

  /**
   * Get a single permission by ID
   */
  @Get('permissions/:permissionId')
  @ApiOperation({ summary: 'Get a single permission' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID', example: 'perm_create_listing' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findPermissionById(@Param('permissionId') permissionId: string) {
    return this.rbacService.findPermissionById(permissionId);
  }

  /**
   * Update a permission
   */
  @Patch('permissions/:permissionId')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID', example: 'perm_create_listing' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('permissionId') permissionId: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.rbacService.updatePermission(permissionId, updatePermissionDto);
  }

  /**
   * Delete a permission
   */
  @Delete('permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission (if not used in roles)' })
  @ApiParam({ name: 'permissionId', description: 'Permission ID', example: 'perm_create_listing' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 409, description: 'Permission still in use by roles' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async deletePermission(@Param('permissionId') permissionId: string) {
    await this.rbacService.deletePermission(permissionId);
  }

  /**
   * Get distinct permission categories
   */
  @Get('permissions/categories')
  @ApiOperation({ summary: 'List distinct permission categories (e.g. listings, admin, dealer)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getPermissionCategories() {
    return this.rbacService.getPermissionCategories();
  }
}
