import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { CosmosService } from "@/common/services/cosmos.service";
import { PaginatedResponse } from "@/common/types/pagination.type";
import {
  UserDocument,
  PublicUser,
} from "@/modules/auth/interfaces/user.interface";
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserMarketDto,
} from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/user-roles.dto";
import { UpdateUserPermissionsDto } from "./dto/user-permissions.dto";
import { QueryUsersDto } from "./dto/query-users.dto";

/**
 * Users Service
 * Handles user management, RBAC, and profile operations
 */
@Injectable()
export class UsersService {
  private readonly USERS_CONTAINER = "users";
  private readonly ROLES_CONTAINER = "roles";

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * List users with filters and pagination (Admin only)
   */
  async findAll(query: QueryUsersDto): Promise<PaginatedResponse<PublicUser>> {
    let sqlQuery = "SELECT * FROM c WHERE 1=1";
    const parameters: any[] = [];

    // Build filters
    if (query.email) {
      sqlQuery += " AND c.profile.email = @email";
      parameters.push({ name: "@email", value: query.email.toLowerCase() });
    }

    if (query.username) {
      sqlQuery += " AND c.auth.username = @username";
      parameters.push({
        name: "@username",
        value: query.username.toLowerCase(),
      });
    }

    if (query.isActive !== undefined) {
      sqlQuery += " AND c.status.isActive = @isActive";
      parameters.push({ name: "@isActive", value: query.isActive });
    }

    if (query.blocked !== undefined) {
      sqlQuery += " AND c.status.blocked = @blocked";
      parameters.push({ name: "@blocked", value: query.blocked });
    }

    if (query.roleId) {
      sqlQuery += ' AND ARRAY_CONTAINS(c.roles, {"roleId": @roleId}, true)';
      parameters.push({ name: "@roleId", value: query.roleId });
    }

    // Order by creation date
    sqlQuery += " ORDER BY c.metadata.createdAt DESC";

    const { items, continuationToken } =
      await this.cosmosService.queryItems<UserDocument>(
        this.USERS_CONTAINER,
        sqlQuery,
        parameters,
        query.limit,
        query.cursor,
      );

    return {
      items: items.map((user) => this.toPublicUser(user)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Get single user by ID
   */
  async findOne(
    id: string,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // Non-admin can only view their own profile
    if (!isAdmin && requestingUserId !== id) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You can only view your own profile",
      });
    }

    return this.toPublicUser(user);
  }

  /**
   * Update user profile and preferences
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // Non-admin can only update their own profile
    if (!isAdmin && requestingUserId !== id) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        message: "You can only update your own profile",
      });
    }

    // Update profile fields
    if (dto.displayName !== undefined) {
      user.profile.displayName = dto.displayName;
    }
    if (dto.firstName !== undefined) {
      user.profile.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.profile.lastName = dto.lastName;
    }
    if (dto.phoneNumber !== undefined) {
      user.profile.phoneNumber = dto.phoneNumber;
    }
    if (dto.zipCode !== undefined) {
      user.profile.zipCode = dto.zipCode;
    }
    if (dto.avatarUrl !== undefined) {
      user.profile.avatarUrl = dto.avatarUrl;
    }

    // Update preferences
    if (dto.language !== undefined) {
      user.preferences.language = dto.language;
    }
    if (dto.timezone !== undefined) {
      user.preferences.timezone = dto.timezone;
    }
    if (dto.notificationsEmail !== undefined) {
      user.preferences.notifications.email = dto.notificationsEmail;
    }
    if (dto.notificationsSms !== undefined) {
      user.preferences.notifications.sms = dto.notificationsSms;
    }
    if (dto.notificationsPush !== undefined) {
      user.preferences.notifications.push = dto.notificationsPush;
    }

    // Update metadata
    user.metadata.updatedAt = new Date().toISOString();
    user.metadata.updatedBy = requestingUserId;

    const updatedUser = await this.cosmosService.updateItem(
      this.USERS_CONTAINER,
      user,
      user.id,
    );

    return this.toPublicUser(updatedUser);
  }

  /**
   * Update user status (Admin only)
   */
  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // Update status fields
    if (dto.isActive !== undefined) {
      user.status.isActive = dto.isActive;
    }
    if (dto.blocked !== undefined) {
      user.status.blocked = dto.blocked;
      if (dto.blocked) {
        user.status.blockedAt = new Date().toISOString();
        user.status.blockedReason = dto.blockedReason || "No reason provided";
      } else {
        user.status.blockedAt = null;
        user.status.blockedReason = null;
      }
    }

    user.metadata.updatedAt = new Date().toISOString();

    const updatedUser = await this.cosmosService.updateItem(
      this.USERS_CONTAINER,
      user,
      user.id,
    );

    return this.toPublicUser(updatedUser);
  }

  /**
   * Update user market (Admin only)
   */
  async updateMarket(
    id: string,
    dto: UpdateUserMarketDto,
  ): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // Update market fields
    if (dto.country !== undefined) {
      user.market.country = dto.country;
    }
    if (dto.allowedCountries !== undefined) {
      user.market.allowedCountries = dto.allowedCountries;
    }
    if (dto.source !== undefined) {
      user.market.source = dto.source;
    }

    user.metadata.updatedAt = new Date().toISOString();

    const updatedUser = await this.cosmosService.updateItem(
      this.USERS_CONTAINER,
      user,
      user.id,
    );

    return this.toPublicUser(updatedUser);
  }

  /**
   * Update user roles (Admin only)
   */
  async updateRoles(id: string, dto: UpdateUserRolesDto): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // TODO: Validate that all roles exist in roles container

    user.roles = dto.roles;
    user.metadata.updatedAt = new Date().toISOString();

    const updatedUser = await this.cosmosService.updateItem(
      this.USERS_CONTAINER,
      user,
      user.id,
    );

    return this.toPublicUser(updatedUser);
  }

  /**
   * Update user custom permissions (Admin only)
   */
  async updatePermissions(
    id: string,
    dto: UpdateUserPermissionsDto,
  ): Promise<PublicUser> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    // TODO: Validate that all permissions exist in permissions container

    user.customPermissions = dto.customPermissions;
    user.metadata.updatedAt = new Date().toISOString();

    const updatedUser = await this.cosmosService.updateItem(
      this.USERS_CONTAINER,
      user,
      user.id,
    );

    return this.toPublicUser(updatedUser);
  }

  /**
   * Get user's effective permissions (roles + custom permissions)
   */
  async getEffectivePermissions(id: string): Promise<{
    userId: string;
    roles: string[];
    customPermissions: string[];
    effectivePermissions: string[];
  }> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      id,
      id,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: "Not Found",
        message: "User not found",
      });
    }

    const effectivePermissions = new Set<string>();

    // Add custom permissions
    user.customPermissions.forEach((perm) => effectivePermissions.add(perm));

    // TODO: Fetch and resolve role permissions from roles container
    // For now, we'll just return an empty set for role-based permissions
    // This should query each role in user.roles and collect their permissions

    return {
      userId: user.id,
      roles: user.roles.map((r) => r.roleId),
      customPermissions: user.customPermissions,
      effectivePermissions: Array.from(effectivePermissions),
    };
  }

  /**
   * Helper: Convert UserDocument to PublicUser
   */
  private toPublicUser(user: UserDocument): PublicUser {
    const { auth, ...publicFields } = user;
    return {
      ...publicFields,
      metadata: {
        createdAt: user.metadata.createdAt,
        updatedAt: user.metadata.updatedAt,
      },
    } as PublicUser;
  }
}
