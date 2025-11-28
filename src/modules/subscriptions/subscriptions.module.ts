import { Module } from "@nestjs/common";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionInvoicesService } from "./services/subscription-invoices.service";
import { CosmosService } from "@/common/services/cosmos.service";
import { BillingsModule } from "@/modules/billings/billings.module";

/**
 * Subscriptions Module
 * Manages subscription plans, billing, and Stripe integration
 */
@Module({
  imports: [BillingsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionInvoicesService, CosmosService],
  exports: [SubscriptionsService, SubscriptionInvoicesService],
})
export class SubscriptionsModule {}
