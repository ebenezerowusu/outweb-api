import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { CosmosService } from "@/common/services/cosmos.service";

@Module({
  controllers: [HealthController],
  providers: [HealthService, CosmosService],
})
export class HealthModule {}
