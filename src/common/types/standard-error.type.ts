/**
 * Standard Error Shape (RFC-7807 problem+json format)
 * Used for all error responses across the API
 */
export interface StandardError {
  /**
   * HTTP status code (400, 401, 403, 404, 409, 422, 500, etc.)
   */
  statusCode: number;

  /**
   * Short error name ("Bad Request", "Unauthorized", etc.)
   */
  error: string;

  /**
   * Human-readable error description
   */
  message: string;

  /**
   * Optional validation errors (field -> error messages map)
   * Mainly used for 422 Unprocessable Entity responses
   */
  details?: Record<string, string[]>;
}
