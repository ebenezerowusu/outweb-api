import { Module } from "@nestjs/common";
import { SellerGroupsController } from "./seller-groups.controller";
import { SellerGroupsService } from "./seller-groups.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  controllers: [SellerGroupsController],
  providers: [SellerGroupsService, CosmosService],
  exports: [SellerGroupsService],
})
export class SellerGroupsModule {}
