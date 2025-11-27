import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";

/**
 * Country Guard Metadata Key
 * Use @SetMetadata('skipCountryGuard', true) to bypass for specific routes
 */
export const SKIP_COUNTRY_GUARD_KEY = "skipCountryGuard";

/**
 * Country Guard
 * Validates X-Country header on all requests (except exempted routes)
 *
 * Global Rule: X-Country is required on every request except:
 * - /health/* endpoints
 * - Admin-only routes (can bypass for global operations)
 * - External webhooks
 *
 * Accepted value: 2-letter ISO 3166-1 alpha-2 country code (e.g., "US", "CA", "GH", "GB")
 */
@Injectable()
export class CountryGuard implements CanActivate {
  // ISO 3166-1 alpha-2 country codes (subset of common ones, extend as needed)
  private readonly validCountryCodes = new Set([
    "US",
    "CA",
    "GB",
    "GH",
    "NG",
    "KE",
    "ZA",
    "DE",
    "FR",
    "IT",
    "ES",
    "NL",
    "SE",
    "NO",
    "DK",
    "FI",
    "PL",
    "PT",
    "IE",
    "AT",
    "CH",
    "AU",
    "NZ",
    "JP",
    "CN",
    "IN",
    "SG",
    "MY",
    "BR",
    "MX",
    "AR",
    "CL",
    "CO",
    "PE",
  ]);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route should skip country guard
    const skipGuard = this.reflector.getAllAndOverride<boolean>(
      SKIP_COUNTRY_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipGuard) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const path = request.url;

    // Skip for health endpoints
    if (path.startsWith("/health")) {
      return true;
    }

    // Skip for webhook endpoints (authenticated via provider-specific signatures)
    if (path.startsWith("/webhooks/")) {
      return true;
    }

    // Get X-Country header
    const country = request.headers["x-country"] as string;

    if (!country) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: "X-Country header is required",
      });
    }

    // Validate country code format (2 letters, uppercase)
    const countryCode = country.toUpperCase();

    if (countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message:
          "X-Country must be a valid 2-letter ISO 3166-1 alpha-2 country code",
      });
    }

    // Validate against known country codes
    if (!this.validCountryCodes.has(countryCode)) {
      throw new BadRequestException({
        statusCode: 400,
        error: "Bad Request",
        message: `Unsupported country code: ${countryCode}`,
      });
    }

    // Attach normalized country code to request for later use
    (request as any).country = countryCode;

    return true;
  }
}
