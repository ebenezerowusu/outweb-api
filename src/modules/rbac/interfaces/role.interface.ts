/**
 * Role Document Interface
 * Represents a role in the system with associated permissions
 */
export interface RoleDocument {
  id: string;
  type: "role";
  scope: "system";
  name: string;
  description: string;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Permission reference within a role
 */
export interface RolePermission {
  key: string;
  description?: string;
}

/**
 * Public Role (safe for API responses)
 */
export type PublicRole = RoleDocument;
