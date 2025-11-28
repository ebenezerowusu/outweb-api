import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BillingsController } from "./billings.controller";
import { BillingsService } from "./billings.service";
import { CosmosService } from "@/common/services/cosmos.service";

/**
 * Billings Module
 * Handles one-time payment billing management
 */
@Module({
  imports: [ConfigModule],
  controllers: [BillingsController],
  providers: [BillingsService, CosmosService],
  exports: [BillingsService],
})
export class BillingsModule {}
