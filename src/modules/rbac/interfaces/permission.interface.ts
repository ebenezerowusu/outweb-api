/**
 * Permission Document Interface
 * Represents a permission in the system
 */
export interface PermissionDocument {
  id: string;
  type: "permission";
  category: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public Permission (safe for API responses)
 */
export type PublicPermission = PermissionDocument;
