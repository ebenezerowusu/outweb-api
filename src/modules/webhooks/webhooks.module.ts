import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { BillingsModule } from "@/modules/billings/billings.module";
import { SubscriptionsModule } from "@/modules/subscriptions/subscriptions.module";

/**
 * Webhooks Module
 * Unified webhook handling for all payment gateway events
 */
@Module({
  imports: [BillingsModule, SubscriptionsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
