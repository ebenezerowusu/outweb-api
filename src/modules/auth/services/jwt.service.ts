import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SignJWT, jwtVerify } from "jose";
import { AppConfig } from "@/config/app.config";
import { JwtPayload, TokenResponse } from "@/common/types/token.type";

/**
 * JWT Service
 * Handles JWT token generation and validation using JOSE (EdDSA)
 */
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private accessSecret: Uint8Array;
  private refreshSecret: Uint8Array;
  private accessExpiresIn: number;
  private refreshExpiresIn: number;

  constructor(private configService: ConfigService<AppConfig>) {
    // Convert secrets to Uint8Array for JOSE
    const accessSecretString = this.configService.get("jwtAccessSecret", {
      infer: true,
    })!;
    const refreshSecretString = this.configService.get("jwtRefreshSecret", {
      infer: true,
    })!;

    this.accessSecret = new TextEncoder().encode(accessSecretString);
    this.refreshSecret = new TextEncoder().encode(refreshSecretString);

    this.accessExpiresIn =
      this.configService.get("jwtAccessExpiresIn", {
        infer: true,
      }) || 3600;
    this.refreshExpiresIn =
      this.configService.get("jwtRefreshExpiresIn", {
        infer: true,
      }) || 604800;

    this.logger.log("JWT Service initialized");
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(
    payload: Omit<JwtPayload, "iat" | "exp">,
  ): Promise<TokenResponse> {
    const now = Math.floor(Date.now() / 1000);

    // Generate access token
    const accessToken = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + this.accessExpiresIn)
      .sign(this.accessSecret);

    // Generate refresh token
    const refreshToken = await new SignJWT({ sub: payload.sub })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + this.refreshExpiresIn)
      .sign(this.refreshSecret);

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.accessExpiresIn,
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret);
      return payload as unknown as JwtPayload;
    } catch (error) {
      this.logger.debug(`Access token verification failed: ${error.message}`);
      throw new Error(`Invalid or expired access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.refreshSecret);
      return payload as unknown as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }
}
