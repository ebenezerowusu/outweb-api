import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { JwtService } from "./services/jwt.service";
import { JwtAuthMiddleware } from "./middleware/jwt-auth.middleware";
import { CosmosService } from "@/common/services/cosmos.service";
import { EmailService } from "@/common/services/email.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, CosmosService, EmailService],
  exports: [JwtService, AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply JWT auth middleware to all routes
    consumer.apply(JwtAuthMiddleware).forRoutes("*");
  }
}
