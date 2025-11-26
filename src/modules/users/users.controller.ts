import {
  Controller,
  Get,
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
import { UsersService } from "./users.service";
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserMarketDto,
} from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/user-roles.dto";
import { UpdateUserPermissionsDto } from "./dto/user-permissions.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
import { CurrentUser } from "@/common/decorators/auth.decorators";

/**
 * Users Controller
 * Handles user management, RBAC, and profile operations
 */
@ApiTags("Users")
@Controller("users")
@ApiBearerAuth("Authorization")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * List users with filters (Admin only)
   */
  @Get()
  @ApiOperation({
    summary: "List users with filters and pagination (Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Users list retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Get current user's profile
   */
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.sub, user.sub, false);
  }

  /**
   * Get user by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get user by ID (Admin or self)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.usersService.findOne(id, user.sub, hasAdminPermission);
  }

  /**
   * Update user profile
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update user profile and preferences (Admin or self)",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    return this.usersService.update(
      id,
      updateUserDto,
      user.sub,
      hasAdminPermission,
    );
  }

  /**
   * Update user status (Admin only)
   */
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user status (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  /**
   * Update user market (Admin only)
   */
  @Patch(":id/market")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user market settings (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User market updated successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateMarket(
    @Param("id") id: string,
    @Body() updateMarketDto: UpdateUserMarketDto,
  ) {
    return this.usersService.updateMarket(id, updateMarketDto);
  }

  /**
   * Update user roles (Admin only)
   */
  @Patch(":id/roles")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user roles (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User roles updated successfully" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateRoles(
    @Param("id") id: string,
    @Body() updateRolesDto: UpdateUserRolesDto,
  ) {
    return this.usersService.updateRoles(id, updateRolesDto);
  }

  /**
   * Update user permissions (Admin only)
   */
  @Patch(":id/permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update user custom permissions (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User permissions updated successfully",
  })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updatePermissions(
    @Param("id") id: string,
    @Body() updatePermissionsDto: UpdateUserPermissionsDto,
  ) {
    return this.usersService.updatePermissions(id, updatePermissionsDto);
  }

  /**
   * Get user's effective permissions
   */
  @Get(":id/effective-permissions")
  @ApiOperation({
    summary:
      "Get user effective permissions (resolved from roles + custom permissions)",
  })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Effective permissions retrieved successfully",
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getEffectivePermissions(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    // Allow admin or self to view effective permissions
    const hasAdminPermission = user.permissions?.includes("perm_manage_users");
    if (!hasAdminPermission && user.sub !== id) {
      throw new Error("Forbidden");
    }
    return this.usersService.getEffectivePermissions(id);
  }
}
