import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../services/jwt.service';

/**
 * JWT Authentication Middleware
 * Validates Bearer token and populates request.user
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  async use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const request = req as any;

    // Log that middleware is running
    this.logger.log(`[JWT] Middleware running for ${request.method} ${request.url}`);

    // Skip authentication for public routes (handled by @SkipAuth decorator)
    // The RbacGuard will check for this
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn(`[JWT] No Authorization header found for ${request.method} ${request.url}`);
      next();
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn(`[JWT] Authorization header doesn't start with 'Bearer ' for ${request.method} ${request.url}`);
      next();
      return;
    }

    const token = authHeader.substring(7);
    this.logger.log(`[JWT] Attempting to verify token (length: ${token.length}) for ${request.method} ${request.url}`);

    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      request.user = payload;
      this.logger.log(`[JWT] ✓ Verification successful for user: ${payload.sub}`);
    } catch (error) {
      // Log the error for debugging but don't throw
      // This allows @SkipAuth() routes to work
      this.logger.warn(
        `[JWT] ✗ Verification failed for ${request.method} ${request.url}: ${error.message}`,
      );
    }

    next();
  }
}
