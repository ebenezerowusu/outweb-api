import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VehiclesService } from "./vehicles.service";
import { VehiclesController } from "./vehicles.controller";

@Module({
  imports: [ConfigModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
