import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { CosmosService } from "@/common/services/cosmos.service";

/**
 * Subscriptions Module
 * Manages subscription plans, billing, and Stripe integration
 */
@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, CosmosService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
