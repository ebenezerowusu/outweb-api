import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { QueryVehicleDto } from "./dto/query-vehicle.dto";

@ApiTags("Vehicles")
@ApiBearerAuth()
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Create a new vehicle
   */
  @Post()
  @ApiOperation({
    summary: "Create a new vehicle",
    description: "Create a new vehicle record with VIN as unique identifier",
  })
  @ApiResponse({
    status: 201,
    description: "Vehicle created successfully",
  })
  @ApiResponse({
    status: 409,
    description: "Vehicle with this VIN already exists",
  })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  /**
   * Get all vehicles with filters
   */
  @Get()
  @ApiOperation({
    summary: "Get all vehicles",
    description: "Retrieve all vehicles with optional filters and pagination",
  })
  @ApiResponse({
    status: 200,
    description: "List of vehicles retrieved successfully",
  })
  async findAll(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(query);
  }

  /**
   * Get vehicle by ID
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get vehicle by ID",
    description: "Retrieve a specific vehicle by its ID",
  })
  @ApiResponse({
    status: 200,
    description: "Vehicle retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Vehicle not found",
  })
  async findById(@Param("id") id: string) {
    return this.vehiclesService.findById(id);
  }

  /**
   * Get vehicle by VIN
   */
  @Get("vin/:vin")
  @ApiOperation({
    summary: "Get vehicle by VIN",
    description: "Retrieve a specific vehicle by its VIN (fastest lookup)",
  })
  @ApiResponse({
    status: 200,
    description: "Vehicle retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Vehicle not found",
  })
  async findByVin(@Param("vin") vin: string) {
    return this.vehiclesService.findByVin(vin);
  }

  /**
   * Update vehicle
   */
  @Patch(":id")
  @ApiOperation({
    summary: "Update vehicle",
    description: "Update an existing vehicle (partial update)",
  })
  @ApiResponse({
    status: 200,
    description: "Vehicle updated successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Vehicle not found",
  })
  async update(
    @Param("id") id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  /**
   * Delete vehicle
   */
  @Delete(":id")
  @ApiOperation({
    summary: "Delete vehicle",
    description: "Delete a vehicle by ID",
  })
  @ApiResponse({
    status: 200,
    description: "Vehicle deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Vehicle not found",
  })
  async remove(@Param("id") id: string) {
    await this.vehiclesService.remove(id);
    return { message: "Vehicle deleted successfully" };
  }
}
