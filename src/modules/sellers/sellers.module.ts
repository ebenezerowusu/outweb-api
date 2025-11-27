import { Module } from "@nestjs/common";
import { SellersController } from "./sellers.controller";
import { SellersService } from "./sellers.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  controllers: [SellersController],
  providers: [SellersService, CosmosService],
  exports: [SellersService],
})
export class SellersModule {}
