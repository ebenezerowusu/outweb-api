import { SetMetadata } from "@nestjs/common";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import {
  SKIP_AUTH_KEY,
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
} from "../guards/rbac.guard";
import { SKIP_COUNTRY_GUARD_KEY } from "../guards/country.guard";

/**
 * Skip Authentication
 * Use for public endpoints
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

/**
 * Skip Country Guard
 * Use for admin-only or global operations
 */
export const SkipCountryGuard = () => SetMetadata(SKIP_COUNTRY_GUARD_KEY, true);

/**
 * Require specific permissions
 * @param permissions - Array of permission keys
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Require specific roles
 * @param roles - Array of role IDs
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);

/**
 * Get current user from request
 * Populated by JWT auth middleware
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // In NestJS with Fastify, the user is set on the raw request
    return request.user || request.raw?.user;
  },
);

/**
 * Get country code from request
 * Populated by CountryGuard
 */
export const Country = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.country;
  },
);
