import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import { JwtService } from "../services/jwt.service";

/**
 * JWT Authentication Middleware
 * Validates Bearer token and populates request.user
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Log that middleware is running
    this.logger.log(`[JWT] Middleware running for ${req.method} ${req.url}`);

    // Skip authentication for public routes (handled by @SkipAuth decorator)
    // The RbacGuard will check for this
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      this.logger.warn(
        `[JWT] No Authorization header found for ${req.method} ${req.url}`,
      );
      next();
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      this.logger.warn(
        `[JWT] Authorization header doesn't start with 'Bearer ' for ${req.method} ${req.url}`,
      );
      next();
      return;
    }

    const token = authHeader.substring(7);
    this.logger.log(
      `[JWT] Attempting to verify token (length: ${token.length}) for ${req.method} ${req.url}`,
    );

    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      (req as any).user = payload;
      this.logger.log(
        `[JWT] ✓ Verification successful for user: ${payload.sub}, user set on request: ${!!(req as any).user}`,
      );
    } catch (error) {
      // Log the error for debugging but don't throw
      // This allows @SkipAuth() routes to work
      this.logger.warn(
        `[JWT] ✗ Verification failed for ${req.method} ${req.url}: ${error.message}`,
      );
    }

    next();
  }
}
