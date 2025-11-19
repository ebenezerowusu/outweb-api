/**
 * Permission Check Response
 */
export interface PermissionCheckResponse {
  userId: string;
  permission: string;
  hasPermission: boolean;
  source?: 'direct' | 'role' | 'none';
  roleId?: string;
}

/**
 * Batch Permission Check Response
 */
export interface BatchPermissionCheckResponse {
  userId: string;
  permissions: {
    [permission: string]: {
      hasPermission: boolean;
      source?: 'direct' | 'role' | 'none';
      roleId?: string;
    };
  };
}

/**
 * Effective Permissions Response
 */
export interface EffectivePermissionsResponse {
  userId: string;
  permissions: string[];
  roles: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  customPermissions: string[];
}

/**
 * Permission Suggestion
 */
export interface PermissionSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Role Suggestion
 */
export interface RoleSuggestion {
  id: string;
  name: string;
  description: string;
  permissionCount: number;
  permissions: string[];
}
