import { Injectable, NotFoundException } from '@nestjs/common';
import { CosmosService } from '@/common/services/cosmos.service';
import { UserDocument } from '@/modules/auth/interfaces/user.interface';
import { CheckPermissionDto, CheckPermissionsBatchDto } from './dto/check-permission.dto';
import { SuggestPermissionsDto, SuggestRolesDto } from './dto/suggest.dto';
import {
  PermissionCheckResponse,
  BatchPermissionCheckResponse,
  EffectivePermissionsResponse,
  PermissionSuggestion,
  RoleSuggestion,
} from './interfaces/rbac-response.interface';

/**
 * RBAC Service
 * Handles permission checking, role management, and suggestions
 */
@Injectable()
export class RbacService {
  private readonly USERS_CONTAINER = 'users';

  // Predefined permissions catalog
  private readonly PERMISSIONS_CATALOG: PermissionSuggestion[] = [
    // User Management
    { id: 'perm_manage_users', name: 'Manage Users', description: 'Create, update, and delete users', category: 'users' },
    { id: 'perm_view_users', name: 'View Users', description: 'View user profiles and information', category: 'users' },
    { id: 'perm_assign_roles', name: 'Assign Roles', description: 'Assign and modify user roles', category: 'users' },

    // Seller Management
    { id: 'perm_manage_sellers', name: 'Manage Sellers', description: 'Create, update, and manage sellers', category: 'sellers' },
    { id: 'perm_verify_sellers', name: 'Verify Sellers', description: 'Verify and approve seller applications', category: 'sellers' },
    { id: 'perm_view_sellers', name: 'View Sellers', description: 'View seller profiles and information', category: 'sellers' },

    // Listing Management
    { id: 'perm_manage_listings', name: 'Manage Listings', description: 'Create, update, and delete vehicle listings', category: 'listings' },
    { id: 'perm_publish_listings', name: 'Publish Listings', description: 'Publish and unpublish vehicle listings', category: 'listings' },
    { id: 'perm_view_listings', name: 'View Listings', description: 'View vehicle listings', category: 'listings' },
    { id: 'perm_feature_listings', name: 'Feature Listings', description: 'Mark listings as featured', category: 'listings' },

    // Order Management
    { id: 'perm_manage_orders', name: 'Manage Orders', description: 'Create, update, and manage orders', category: 'orders' },
    { id: 'perm_view_orders', name: 'View Orders', description: 'View order information', category: 'orders' },
    { id: 'perm_process_refunds', name: 'Process Refunds', description: 'Process order refunds', category: 'orders' },

    // Payment Management
    { id: 'perm_manage_payments', name: 'Manage Payments', description: 'Manage payment settings and subscriptions', category: 'payments' },
    { id: 'perm_view_payments', name: 'View Payments', description: 'View payment information', category: 'payments' },

    // Review Management
    { id: 'perm_moderate_reviews', name: 'Moderate Reviews', description: 'Approve, reject, or flag reviews', category: 'reviews' },
    { id: 'perm_view_reviews', name: 'View Reviews', description: 'View seller reviews', category: 'reviews' },

    // Analytics & Reporting
    { id: 'perm_view_analytics', name: 'View Analytics', description: 'Access analytics and reports', category: 'analytics' },
    { id: 'perm_export_data', name: 'Export Data', description: 'Export system data', category: 'analytics' },

    // System Management
    { id: 'perm_manage_taxonomies', name: 'Manage Taxonomies', description: 'Manage vehicle classifications and taxonomies', category: 'system' },
    { id: 'perm_manage_settings', name: 'Manage Settings', description: 'Manage system settings', category: 'system' },
    { id: 'perm_view_logs', name: 'View Logs', description: 'View system logs and audit trails', category: 'system' },
  ];

  // Predefined roles catalog
  private readonly ROLES_CATALOG: RoleSuggestion[] = [
    {
      id: 'role_super_admin',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissionCount: 21,
      permissions: this.PERMISSIONS_CATALOG.map(p => p.id),
    },
    {
      id: 'role_admin',
      name: 'Admin',
      description: 'Administrative access to most features',
      permissionCount: 15,
      permissions: [
        'perm_manage_users',
        'perm_view_users',
        'perm_manage_sellers',
        'perm_verify_sellers',
        'perm_view_sellers',
        'perm_manage_listings',
        'perm_view_listings',
        'perm_manage_orders',
        'perm_view_orders',
        'perm_moderate_reviews',
        'perm_view_reviews',
        'perm_view_analytics',
        'perm_manage_taxonomies',
        'perm_manage_settings',
        'perm_view_logs',
      ],
    },
    {
      id: 'role_dealer',
      name: 'Dealer',
      description: 'Dealer seller with listing management',
      permissionCount: 5,
      permissions: [
        'perm_manage_listings',
        'perm_publish_listings',
        'perm_view_listings',
        'perm_view_orders',
        'perm_view_reviews',
      ],
    },
    {
      id: 'role_dealer_staff',
      name: 'Dealer Staff',
      description: 'Dealer staff member with limited access',
      permissionCount: 3,
      permissions: [
        'perm_manage_listings',
        'perm_view_listings',
        'perm_view_orders',
      ],
    },
    {
      id: 'role_private_seller',
      name: 'Private Seller',
      description: 'Private seller with basic listing management',
      permissionCount: 3,
      permissions: [
        'perm_manage_listings',
        'perm_view_listings',
        'perm_view_orders',
      ],
    },
    {
      id: 'role_buyer',
      name: 'Buyer',
      description: 'Regular buyer with view access',
      permissionCount: 2,
      permissions: [
        'perm_view_listings',
        'perm_view_sellers',
      ],
    },
    {
      id: 'role_moderator',
      name: 'Moderator',
      description: 'Content moderator for reviews and listings',
      permissionCount: 5,
      permissions: [
        'perm_view_listings',
        'perm_moderate_reviews',
        'perm_view_reviews',
        'perm_view_sellers',
        'perm_view_users',
      ],
    },
  ];

  constructor(private readonly cosmosService: CosmosService) {}

  /**
   * Check if a user has a specific permission
   */
  async checkPermission(dto: CheckPermissionDto): Promise<PermissionCheckResponse> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      dto.userId,
      dto.userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    // Check custom permissions first
    if (user.customPermissions?.includes(dto.permission)) {
      return {
        userId: dto.userId,
        permission: dto.permission,
        hasPermission: true,
        source: 'direct',
      };
    }

    // Check role-based permissions
    if (user.roles && user.roles.length > 0) {
      for (const userRole of user.roles) {
        const role = this.ROLES_CATALOG.find(r => r.id === userRole.roleId);
        if (role && role.permissions.includes(dto.permission)) {
          return {
            userId: dto.userId,
            permission: dto.permission,
            hasPermission: true,
            source: 'role',
            roleId: role.id,
          };
        }
      }
    }

    return {
      userId: dto.userId,
      permission: dto.permission,
      hasPermission: false,
      source: 'none',
    };
  }

  /**
   * Check multiple permissions for a user (batch)
   */
  async checkPermissionsBatch(dto: CheckPermissionsBatchDto): Promise<BatchPermissionCheckResponse> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      dto.userId,
      dto.userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const result: BatchPermissionCheckResponse = {
      userId: dto.userId,
      permissions: {},
    };

    for (const permission of dto.permissions) {
      // Check custom permissions
      if (user.customPermissions?.includes(permission)) {
        result.permissions[permission] = {
          hasPermission: true,
          source: 'direct',
        };
        continue;
      }

      // Check role-based permissions
      let found = false;
      if (user.roles && user.roles.length > 0) {
        for (const userRole of user.roles) {
          const role = this.ROLES_CATALOG.find(r => r.id === userRole.roleId);
          if (role && role.permissions.includes(permission)) {
            result.permissions[permission] = {
              hasPermission: true,
              source: 'role',
              roleId: role.id,
            };
            found = true;
            break;
          }
        }
      }

      if (!found) {
        result.permissions[permission] = {
          hasPermission: false,
          source: 'none',
        };
      }
    }

    return result;
  }

  /**
   * Get effective permissions for current user
   */
  async getEffectivePermissions(userId: string): Promise<EffectivePermissionsResponse> {
    const user = await this.cosmosService.readItem<UserDocument>(
      this.USERS_CONTAINER,
      userId,
      userId,
    );

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const effectivePermissions = new Set<string>();
    const roles: Array<{ id: string; name: string; permissions: string[] }> = [];

    // Collect permissions from roles
    if (user.roles && user.roles.length > 0) {
      for (const userRole of user.roles) {
        const role = this.ROLES_CATALOG.find(r => r.id === userRole.roleId);
        if (role) {
          roles.push({
            id: role.id,
            name: role.name,
            permissions: role.permissions,
          });
          role.permissions.forEach(p => effectivePermissions.add(p));
        }
      }
    }

    // Add custom permissions
    if (user.customPermissions && user.customPermissions.length > 0) {
      user.customPermissions.forEach(p => effectivePermissions.add(p));
    }

    return {
      userId: userId,
      permissions: Array.from(effectivePermissions),
      roles: roles,
      customPermissions: user.customPermissions || [],
    };
  }

  /**
   * Suggest permissions based on search query
   */
  async suggestPermissions(dto: SuggestPermissionsDto): Promise<PermissionSuggestion[]> {
    let permissions = [...this.PERMISSIONS_CATALOG];

    // Filter by query if provided
    if (dto.query) {
      const query = dto.query.toLowerCase();
      permissions = permissions.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      );
    }

    // Limit results
    return permissions.slice(0, dto.limit);
  }

  /**
   * Suggest roles based on search query
   */
  async suggestRoles(dto: SuggestRolesDto): Promise<RoleSuggestion[]> {
    let roles = [...this.ROLES_CATALOG];

    // Filter by query if provided
    if (dto.query) {
      const query = dto.query.toLowerCase();
      roles = roles.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query),
      );
    }

    // Limit results
    return roles.slice(0, dto.limit);
  }
}
