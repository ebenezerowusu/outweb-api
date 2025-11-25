import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

/**
 * RBAC Metadata Keys
 */
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const SKIP_AUTH_KEY = 'skipAuth';

/**
 * Permission Operator
 */
export type PermissionOperator = 'AND' | 'OR';

/**
 * RBAC Guard
 * Enforces role-based access control
 *
 * Usage with decorators:
 * @RequirePermissions(['perm_manage_users'], 'AND')
 * @RequireRoles(['role_admin'])
 * @SkipAuth() - for public endpoints
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route should skip auth
    const skipAuth = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Get user from request (set by JWT auth middleware)
    // In NestJS with Fastify, the user is set on the raw request
    const user = (request as any).user || ((request as any).raw?.user);

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions or roles required, allow access
    if (!requiredPermissions && !requiredRoles) {
      return true;
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles || [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];

      // Default to AND operator
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }
    }

    return true;
  }
}
