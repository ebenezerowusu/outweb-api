import { Module } from "@nestjs/common";
import { ListingsController } from "./listings.controller";
import { ListingsService } from "./listings.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, CosmosService],
  exports: [ListingsService],
})
export class ListingsModule {}
