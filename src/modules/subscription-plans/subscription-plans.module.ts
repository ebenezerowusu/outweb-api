import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SubscriptionPlansController } from "./subscription-plans.controller";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  imports: [ConfigModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService, CosmosService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
