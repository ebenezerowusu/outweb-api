import { Module } from "@nestjs/common";
import { RbacController } from "./rbac.controller";
import { RbacService } from "./rbac.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  controllers: [RbacController],
  providers: [RbacService, CosmosService],
  exports: [RbacService],
})
export class RbacModule {}
