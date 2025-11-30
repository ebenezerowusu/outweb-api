import { PartialType } from "@nestjs/swagger";
import { CreateVehicleDto } from "./create-vehicle.dto";

/**
 * Update Vehicle DTO
 * All fields are optional for partial updates
 */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
