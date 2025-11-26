import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CosmosService } from "@/common/services/cosmos.service";

/**
 * Orders Module
 * Manages orders and order transactions
 */
@Module({
  controllers: [OrdersController],
  providers: [OrdersService, CosmosService],
  exports: [OrdersService],
})
export class OrdersModule {}
