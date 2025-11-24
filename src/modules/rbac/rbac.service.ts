import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { PaginatedResponse } from '@/common/types/pagination.type';
import { RoleDocument, PublicRole } from './interfaces/role.interface';
import { PermissionDocument, PublicPermission } from './interfaces/permission.interface';
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
 * RBAC Service
 * Handles roles and permissions management
 */
@Injectable()
export class RbacService {
  private readonly ROLES_CONTAINER = 'roles';
  private readonly PERMISSIONS_CONTAINER = 'permissions';

  // Protected system roles that cannot be deleted
  private readonly PROTECTED_ROLES = ['admin', 'dealer', 'seller'];

  constructor(private readonly cosmosService: CosmosService) {}

  // ==================== ROLES ====================

  /**
   * List roles with filters
   */
  async findAllRoles(query: QueryRolesDto): Promise<PaginatedResponse<PublicRole>> {
    let sqlQuery = 'SELECT * FROM c WHERE c.type = "role"';
    const parameters: any[] = [];

    if (query.scope) {
      sqlQuery += ' AND c.scope = @scope';
      parameters.push({ name: '@scope', value: query.scope });
    }

    if (query.name) {
      sqlQuery += ' AND CONTAINS(LOWER(c.name), LOWER(@name))';
      parameters.push({ name: '@name', value: query.name });
    }

    sqlQuery += ' ORDER BY c.createdAt DESC';

    const { items, continuationToken } = await this.cosmosService.queryItems<RoleDocument>(
      this.ROLES_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((role) => this.toPublicRole(role)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Create a new role
   */
  async createRole(dto: CreateRoleDto): Promise<PublicRole> {
    const now = new Date().toISOString();
    const roleId = dto.id || this.generateRoleId(dto.name);

    // Validate that permission IDs exist
    if (dto.permissions && dto.permissions.length > 0) {
      await this.validatePermissions(dto.permissions.map((p) => p.key));
    }

    const role: RoleDocument = {
      id: roleId,
      type: 'role',
      scope: dto.scope,
      name: dto.name,
      description: dto.description || '',
      permissions: dto.permissions || [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.cosmosService.createItem(this.ROLES_CONTAINER, role);
      return this.toPublicRole(created);
    } catch (error: any) {
      if (error.code === 409) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Role with name '${dto.name}' already exists`,
        });
      }
      throw error;
    }
  }

  /**
   * Get a single role by ID
   */
  async findRoleById(roleId: string): Promise<PublicRole> {
    try {
      const role = await this.cosmosService.readItem<RoleDocument>(
        this.ROLES_CONTAINER,
        roleId,
        roleId,
      );

      if (!role) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: `Role with ID '${roleId}' not found`,
        });
      }

      return this.toPublicRole(role);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, dto: UpdateRoleDto): Promise<PublicRole> {
    const role = await this.cosmosService.readItem<RoleDocument>(
      this.ROLES_CONTAINER,
      roleId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }

    // Validate permissions if provided
    if (dto.permissions && dto.permissions.length > 0) {
      await this.validatePermissions(dto.permissions.map((p) => p.key));
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    if (dto.permissions !== undefined) {
      role.permissions = dto.permissions;
    }

    role.updatedAt = new Date().toISOString();

    const updated = await this.cosmosService.updateItem(
      this.ROLES_CONTAINER,
      role,
      role.id,
    );

    return this.toPublicRole(updated);
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.cosmosService.readItem<RoleDocument>(
      this.ROLES_CONTAINER,
      roleId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }

    // Protect system roles
    if (role.scope === 'system' && this.PROTECTED_ROLES.includes(role.name)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Cannot delete protected system role '${role.name}'`,
      });
    }

    await this.cosmosService.deleteItem(this.ROLES_CONTAINER, roleId, roleId);
  }

  /**
   * Get full permission objects for a role
   */
  async getRolePermissions(roleId: string): Promise<{
    role: { id: string; name: string };
    permissions: PublicPermission[];
  }> {
    const role = await this.cosmosService.readItem<RoleDocument>(
      this.ROLES_CONTAINER,
      roleId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }

    const permissionKeys = role.permissions.map((p) => p.key);

    if (permissionKeys.length === 0) {
      return {
        role: { id: role.id, name: role.name },
        permissions: [],
      };
    }

    // Query permissions container for full permission objects
    const sqlQuery = `SELECT * FROM c WHERE c.type = "permission" AND c.id IN (${permissionKeys.map((_, i) => `@id${i}`).join(',')})`;
    const parameters = permissionKeys.map((key, i) => ({ name: `@id${i}`, value: key }));

    const { items } = await this.cosmosService.queryItems<PermissionDocument>(
      this.PERMISSIONS_CONTAINER,
      sqlQuery,
      parameters,
    );

    return {
      role: { id: role.id, name: role.name },
      permissions: items.map((p) => this.toPublicPermission(p)),
    };
  }

  /**
   * Attach permissions to a role
   */
  async attachPermissions(roleId: string, dto: AttachPermissionsDto): Promise<PublicRole> {
    const role = await this.cosmosService.readItem<RoleDocument>(
      this.ROLES_CONTAINER,
      roleId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }

    // Validate that all permission IDs exist
    await this.validatePermissions(dto.permissionIds);

    // Get permission descriptions
    const sqlQuery = `SELECT * FROM c WHERE c.type = "permission" AND c.id IN (${dto.permissionIds.map((_, i) => `@id${i}`).join(',')})`;
    const parameters = dto.permissionIds.map((id, i) => ({ name: `@id${i}`, value: id }));

    const { items: permissions } = await this.cosmosService.queryItems<PermissionDocument>(
      this.PERMISSIONS_CONTAINER,
      sqlQuery,
      parameters,
    );

    // Create a map of existing permissions
    const existingPermissionsMap = new Map(
      role.permissions.map((p) => [p.key, p]),
    );

    // Add new permissions
    for (const permission of permissions) {
      existingPermissionsMap.set(permission.id, {
        key: permission.id,
        description: permission.description,
      });
    }

    role.permissions = Array.from(existingPermissionsMap.values());
    role.updatedAt = new Date().toISOString();

    const updated = await this.cosmosService.updateItem(
      this.ROLES_CONTAINER,
      role,
      role.id,
    );

    return this.toPublicRole(updated);
  }

  /**
   * Remove a permission from a role
   */
  async detachPermission(roleId: string, permissionId: string): Promise<void> {
    const role = await this.cosmosService.readItem<RoleDocument>(
      this.ROLES_CONTAINER,
      roleId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Role with ID '${roleId}' not found`,
      });
    }

    role.permissions = role.permissions.filter((p) => p.key !== permissionId);
    role.updatedAt = new Date().toISOString();

    await this.cosmosService.updateItem(this.ROLES_CONTAINER, role, role.id);
  }

  // ==================== PERMISSIONS ====================

  /**
   * List permissions with filters
   */
  async findAllPermissions(query: QueryPermissionsDto): Promise<PaginatedResponse<PublicPermission>> {
    let sqlQuery = 'SELECT * FROM c WHERE c.type = "permission"';
    const parameters: any[] = [];

    if (query.category) {
      sqlQuery += ' AND c.category = @category';
      parameters.push({ name: '@category', value: query.category });
    }

    if (query.name) {
      sqlQuery += ' AND STARTSWITH(LOWER(c.name), LOWER(@name))';
      parameters.push({ name: '@name', value: query.name });
    }

    sqlQuery += ' ORDER BY c.createdAt DESC';

    const { items, continuationToken } = await this.cosmosService.queryItems<PermissionDocument>(
      this.PERMISSIONS_CONTAINER,
      sqlQuery,
      parameters,
      query.limit,
      query.cursor,
    );

    return {
      items: items.map((permission) => this.toPublicPermission(permission)),
      count: items.length,
      nextCursor: continuationToken || null,
    };
  }

  /**
   * Create a new permission
   */
  async createPermission(dto: CreatePermissionDto): Promise<PublicPermission> {
    const now = new Date().toISOString();
    const permissionId = dto.id || this.generatePermissionId(dto.name);

    const permission: PermissionDocument = {
      id: permissionId,
      type: 'permission',
      category: dto.category,
      name: dto.name,
      description: dto.description,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.cosmosService.createItem(
        this.PERMISSIONS_CONTAINER,
        permission,
      );
      return this.toPublicPermission(created);
    } catch (error: any) {
      if (error.code === 409) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Permission with name '${dto.name}' already exists`,
        });
      }
      throw error;
    }
  }

  /**
   * Get a single permission by ID
   */
  async findPermissionById(permissionId: string): Promise<PublicPermission> {
    try {
      const permission = await this.cosmosService.readItem<PermissionDocument>(
        this.PERMISSIONS_CONTAINER,
        permissionId,
        permissionId,
      );

      if (!permission) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: `Permission with ID '${permissionId}' not found`,
        });
      }

      return this.toPublicPermission(permission);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Permission with ID '${permissionId}' not found`,
      });
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(
    permissionId: string,
    dto: UpdatePermissionDto,
  ): Promise<PublicPermission> {
    const permission = await this.cosmosService.readItem<PermissionDocument>(
      this.PERMISSIONS_CONTAINER,
      permissionId,
      permissionId,
    );

    if (!permission) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Permission with ID '${permissionId}' not found`,
      });
    }

    if (dto.category !== undefined) {
      permission.category = dto.category;
    }

    if (dto.name !== undefined) {
      permission.name = dto.name;
    }

    if (dto.description !== undefined) {
      permission.description = dto.description;
    }

    permission.updatedAt = new Date().toISOString();

    const updated = await this.cosmosService.updateItem(
      this.PERMISSIONS_CONTAINER,
      permission,
      permission.id,
    );

    return this.toPublicPermission(updated);
  }

  /**
   * Delete a permission
   */
  async deletePermission(permissionId: string): Promise<void> {
    const permission = await this.cosmosService.readItem<PermissionDocument>(
      this.PERMISSIONS_CONTAINER,
      permissionId,
      permissionId,
    );

    if (!permission) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Permission with ID '${permissionId}' not found`,
      });
    }

    // Check if permission is used in any roles
    const rolesUsingPermission = await this.findRolesUsingPermission(permissionId);

    if (rolesUsingPermission.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Permission in use by roles: ${rolesUsingPermission.map((r) => r.name).join(', ')}`,
      });
    }

    await this.cosmosService.deleteItem(
      this.PERMISSIONS_CONTAINER,
      permissionId,
      permissionId,
    );
  }

  /**
   * Get distinct permission categories
   */
  async getPermissionCategories(): Promise<{ data: string[] }> {
    const sqlQuery = 'SELECT DISTINCT c.category FROM c WHERE c.type = "permission"';
    const { items } = await this.cosmosService.queryItems<{ category: string }>(
      this.PERMISSIONS_CONTAINER,
      sqlQuery,
    );

    return {
      data: items.map((item) => item.category).sort(),
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate that permission IDs exist
   */
  private async validatePermissions(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) return;

    const sqlQuery = `SELECT c.id FROM c WHERE c.type = "permission" AND c.id IN (${permissionIds.map((_, i) => `@id${i}`).join(',')})`;
    const parameters = permissionIds.map((id, i) => ({ name: `@id${i}`, value: id }));

    const { items } = await this.cosmosService.queryItems<{ id: string }>(
      this.PERMISSIONS_CONTAINER,
      sqlQuery,
      parameters,
    );

    const foundIds = new Set(items.map((item) => item.id));
    const missingIds = permissionIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Invalid permission IDs: ${missingIds.join(', ')}`,
      });
    }
  }

  /**
   * Find roles that use a specific permission
   */
  private async findRolesUsingPermission(permissionId: string): Promise<RoleDocument[]> {
    const sqlQuery = `SELECT * FROM c WHERE c.type = "role" AND ARRAY_CONTAINS(c.permissions, {"key": @permissionId}, true)`;
    const parameters = [{ name: '@permissionId', value: permissionId }];

    const { items } = await this.cosmosService.queryItems<RoleDocument>(
      this.ROLES_CONTAINER,
      sqlQuery,
      parameters,
    );

    return items;
  }

  /**
   * Generate role ID from name
   */
  private generateRoleId(name: string): string {
    return `role_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  }

  /**
   * Generate permission ID from name
   */
  private generatePermissionId(name: string): string {
    return `perm_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  }

  /**
   * Convert RoleDocument to PublicRole
   */
  private toPublicRole(role: RoleDocument): PublicRole {
    return role;
  }

  /**
   * Convert PermissionDocument to PublicPermission
   */
  private toPublicPermission(permission: PermissionDocument): PublicPermission {
    return permission;
  }
}
