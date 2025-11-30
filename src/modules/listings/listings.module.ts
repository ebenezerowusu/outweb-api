import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ListingsController } from "./listings.controller";
import { ListingsService } from "./listings.service";
import { VehiclesModule } from "../vehicles/vehicles.module";

@Module({
  imports: [ConfigModule, forwardRef(() => VehiclesModule)],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
