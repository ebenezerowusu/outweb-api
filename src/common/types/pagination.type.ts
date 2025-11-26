/**
 * Paginated Response
 * Standard response shape for all list endpoints
 */
export interface PaginatedResponse<T> {
  /**
   * Array of resources for the current page
   */
  items: T[];

  /**
   * Number of items in this page
   */
  count: number;

  /**
   * Opaque continuation token for the next page (null if no more pages)
   */
  nextCursor?: string | null;
}

/**
 * Pagination Query Parameters
 */
export interface PaginationParams {
  /**
   * Number of items to fetch (1-100, default per endpoint)
   */
  limit?: number;

  /**
   * Continuation token from previous page
   */
  cursor?: string;
}

/**
 * Filter Operators
 * Used in query parameters for filtering
 */
export type FilterOperator =
  | "eq" // Equals
  | "ne" // Not equals
  | "in" // In set
  | "nin" // Not in set
  | "gt" // Greater than
  | "gte" // Greater than or equal
  | "lt" // Less than
  | "lte" // Less than or equal
  | "like" // Wildcard match (case-sensitive)
  | "ilike" // Wildcard match (case-insensitive)
  | "startsWith" // Starts with
  | "contains" // Contains
  | "between" // Between two values
  | "is" // Is (for null checks)
  | "not"; // Not (for null checks)
