import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../services/jwt.service';

/**
 * JWT Authentication Middleware
 * Validates Bearer token and populates request.user
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const request = req as any;

    // Skip authentication for public routes (handled by @SkipAuth decorator)
    // The RbacGuard will check for this
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = await this.jwtService.verifyAccessToken(token);
        request.user = payload;
      } catch (error) {
        // Don't throw here, let RbacGuard handle it
        // This allows @SkipAuth() routes to work
      }
    }

    next();
  }
}
