/**
 * Token Object
 * Used by auth endpoints (/auth/signin, /auth/signup/*, /auth/refresh)
 */
export interface TokenResponse {
  /**
   * Short-lived JWT access token
   */
  accessToken: string;

  /**
   * Long-lived refresh token (JWT or opaque)
   */
  refreshToken: string;

  /**
   * Token type (always "Bearer" for this API)
   */
  tokenType: 'Bearer';

  /**
   * Access token lifetime in seconds
   */
  expiresIn: number;
}

/**
 * JWT Payload for access tokens
 */
export interface JwtPayload {
  /**
   * Subject (user ID)
   */
  sub: string;

  /**
   * User email
   */
  email: string;

  /**
   * User roles
   */
  roles?: string[];

  /**
   * Custom permissions
   */
  permissions?: string[];

  /**
   * Issued at timestamp
   */
  iat?: number;

  /**
   * Expiration timestamp
   */
  exp?: number;
}
